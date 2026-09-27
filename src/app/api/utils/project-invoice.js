import { randomInt } from "node:crypto";

export const HST_RATE = 13;

const cents = (value) => Math.round(Number(value || 0) * 100);

/**
 * The amount to invoice for an estimate, before tax.
 *
 * Estimates from the estimate builder store a tax-inclusive total and record
 * the rate in estimate_settings. Estimates entered without the builder have
 * no tax rate and their total is already pre-tax. Invoices add HST
 * themselves, so tax must come out here or customers are charged twice.
 */
export function estimatePreTax(totalCost, estimateTaxRate) {
  const total = cents(totalCost);
  const rate = Number(estimateTaxRate || 0);
  return (rate > 0 ? Math.round(total / (1 + rate / 100)) : total) / 100;
}

/**
 * Decide the pre-tax amount of a deposit or final invoice for a job.
 * `invoicedSubtotal` is the pre-tax total of the job's other invoices that
 * are not cancelled; the final invoice bills whatever is left.
 */
export function planProjectInvoice({ contractSubtotal, kind, depositPercent = 25, invoicedSubtotal = 0, hasDeposit = false }) {
  const contract = cents(contractSubtotal);
  const invoiced = cents(invoicedSubtotal);
  if (contract <= 0) return { error: "This job has no estimate amount to invoice." };

  if (kind === "deposit") {
    if (hasDeposit) return { error: "This job already has a deposit invoice." };
    const pct = Number(depositPercent);
    if (!(pct > 0 && pct <= 100)) return { error: "Deposit must be between 1% and 100%." };
    return { subtotal: Math.round((contract * pct) / 100) / 100, description: `Deposit (${pct}% of $${(contract / 100).toFixed(2)} + HST)` };
  }

  if (kind === "final") {
    const remaining = contract - invoiced;
    if (remaining <= 0) return { error: "This job has already been invoiced in full." };
    return {
      subtotal: remaining / 100,
      description: invoiced > 0 ? "Balance of painting work (less amounts already invoiced)" : "Painting work as estimated",
    };
  }

  return { error: "Invoice type must be deposit or final." };
}

/** HST and total for a pre-tax subtotal, rounded to the cent. */
export function invoiceTotals(subtotal, taxRate = HST_RATE) {
  const sub = cents(subtotal);
  const tax = Math.round((sub * Number(taxRate)) / 100);
  return { subtotal: sub / 100, tax_amount: tax / 100, total_amount: (sub + tax) / 100 };
}

export function generateInvoiceNumber(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `INV-${ymd}-${String(randomInt(0, 100000)).padStart(5, "0")}`;
}

const isoDate = (date) => date.toISOString().slice(0, 10);

/**
 * Create a deposit or final invoice for a job from its estimate.
 * Returns { invoice } or { error, status }.
 */
export async function createProjectInvoice(sql, { projectId, kind, depositPercent, dueDays, userId, now = new Date() }) {
  const [project] = await sql`SELECT id, lead_id, estimate_id, project_name FROM projects WHERE id = ${projectId}`;
  if (!project) return { error: "Job not found", status: 404 };
  if (!project.estimate_id) return { error: "This job has no estimate. Link an estimate before invoicing.", status: 400 };

  const [estimate] = await sql`SELECT id, estimate_number, total_cost FROM estimates WHERE id = ${project.estimate_id}`;
  if (!estimate) return { error: "The job's estimate no longer exists.", status: 400 };
  const [settings] = await sql`SELECT tax_rate FROM estimate_settings WHERE estimate_id = ${estimate.id} LIMIT 1`;

  const existing = await sql`
    SELECT invoice_type, subtotal FROM invoices
    WHERE project_id = ${projectId} AND status <> 'cancelled'
  `;
  const plan = planProjectInvoice({
    contractSubtotal: estimatePreTax(estimate.total_cost, settings?.tax_rate),
    kind,
    depositPercent,
    invoicedSubtotal: existing.reduce((sum, inv) => sum + cents(inv.subtotal), 0) / 100,
    hasDeposit: existing.some((inv) => inv.invoice_type === "deposit"),
  });
  if (plan.error) return { error: plan.error, status: 409 };

  const totals = invoiceTotals(plan.subtotal);
  const days = Number.isFinite(Number(dueDays)) ? Number(dueDays) : kind === "deposit" ? 7 : 14;
  const due = new Date(now.getTime() + days * 86400000);
  const title = `${project.project_name} - ${kind === "deposit" ? "Deposit" : "Final invoice"}`;
  const lineDescription = `${plan.description} · Estimate ${estimate.estimate_number}`;

  const invoice = await sql.transaction(async (tx) => {
    const [inv] = await tx`
      INSERT INTO invoices (
        invoice_number, project_id, lead_id, estimate_id, title, invoice_type,
        subtotal, tax_rate, tax_amount, total_amount, amount_due,
        issue_date, due_date, created_by
      ) VALUES (
        ${generateInvoiceNumber(now)}, ${project.id}, ${project.lead_id}, ${estimate.id}, ${title}, ${kind},
        ${totals.subtotal}, ${HST_RATE}, ${totals.tax_amount}, ${totals.total_amount}, ${totals.total_amount},
        ${isoDate(now)}, ${isoDate(due)}, ${userId ?? null}
      ) RETURNING *
    `;
    await tx`
      INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, line_total, category)
      VALUES (${inv.id}, ${lineDescription}, 1, ${totals.subtotal}, ${totals.subtotal}, ${kind})
    `;
    return inv;
  });
  return { invoice };
}
