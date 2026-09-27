import { estimatePreTax, invoiceTotals } from "@/app/api/utils/project-invoice";

export async function companySettings(db) {
  const [s] = await db`SELECT * FROM app_settings ORDER BY id DESC LIMIT 1`.catch(() => [undefined]);
  return {
    name: s?.company_name || "Arcan Painting",
    email: s?.company_email || "",
    phone: s?.company_phone || "",
    address: s?.company_address || "",
    logo_url: s?.logo_url || "",
    etransfer_email: s?.etransfer_email || s?.company_email || "",
    etransfer_instructions: s?.etransfer_instructions || "",
    estimate_terms: s?.estimate_terms || "",
    deposit_pct: s?.deposit_pct != null ? Number(s.deposit_pct) : 25,
  };
}

const today = () => new Date().toISOString().slice(0, 10);
const dateOnly = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);

/** What a customer may see about an estimate. Never includes internal costs. */
export async function publicEstimate(db, token) {
  const [e] = await db`
    SELECT e.id, e.estimate_number, e.project_title, e.project_description, e.total_cost, e.status,
           e.valid_until, e.notes, e.accepted_at, e.accepted_name, e.created_at,
           l.name AS customer_name, l.address AS customer_address
    FROM estimates e LEFT JOIN leads l ON e.lead_id = l.id
    WHERE e.public_token = ${token}
  `;
  if (!e) return null;
  const [settings] = await db`SELECT tax_rate FROM estimate_settings WHERE estimate_id = ${e.id} LIMIT 1`;
  const areas = await db`SELECT name FROM estimate_areas WHERE estimate_id = ${e.id} ORDER BY id`.catch(() => []);
  const totals = invoiceTotals(estimatePreTax(e.total_cost, settings?.tax_rate));
  const validUntil = dateOnly(e.valid_until);
  const expired = e.status === "expired" || (validUntil && validUntil < today() && e.status !== "approved");
  const company = await companySettings(db);
  return {
    estimate_number: e.estimate_number,
    project_title: e.project_title,
    project_description: e.project_description,
    notes: e.notes,
    areas: areas.map((a) => a.name).filter(Boolean),
    customer_name: e.customer_name,
    customer_address: e.customer_address,
    issued: dateOnly(e.created_at),
    valid_until: validUntil,
    ...totals,
    deposit_pct: company.deposit_pct,
    deposit_amount: invoiceTotals((totals.subtotal * company.deposit_pct) / 100).total_amount,
    status: e.status === "approved" ? "accepted" : expired ? "expired" : e.status === "rejected" ? "declined" : "open",
    accepted_at: e.accepted_at,
    accepted_name: e.accepted_name,
    company,
  };
}

/** What a customer may see about an invoice. */
export async function publicInvoice(db, token) {
  const [i] = await db`
    SELECT i.id, i.invoice_number, i.title, i.invoice_type, i.status, i.payment_status, i.issue_date, i.due_date,
           i.subtotal, i.tax_rate, i.tax_amount, i.total_amount, i.amount_paid, i.amount_due,
           l.name AS customer_name, l.address AS customer_address, l.email AS customer_email
    FROM invoices i LEFT JOIN leads l ON i.lead_id = l.id
    WHERE i.public_token = ${token}
  `;
  if (!i) return null;
  const items = await db`
    SELECT description, quantity, unit_price, line_total FROM invoice_line_items WHERE invoice_id = ${i.id} ORDER BY id
  `;
  const company = await companySettings(db);
  const payable = i.status !== "cancelled" && Number(i.amount_due) > 0;
  return {
    id: i.id,
    invoice_number: i.invoice_number,
    title: i.title,
    kind: i.invoice_type,
    status: i.status === "cancelled" ? "void" : i.payment_status === "paid" ? "paid" : payable ? "due" : i.status,
    issue_date: dateOnly(i.issue_date),
    due_date: dateOnly(i.due_date),
    overdue: payable && dateOnly(i.due_date) < today(),
    items,
    subtotal: i.subtotal,
    tax_rate: i.tax_rate,
    tax_amount: i.tax_amount,
    total_amount: i.total_amount,
    amount_paid: i.amount_paid,
    amount_due: i.amount_due,
    customer_name: i.customer_name,
    customer_address: i.customer_address,
    customer_email: i.customer_email,
    card_payments: payable && Boolean(process.env.STRIPE_SECRET_KEY),
    company,
  };
}
