export const PROJECT_EXPENSE_CATEGORIES = new Set(["material", "subcontractor", "equipment", "travel", "disposal", "permit", "other"]);

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function validateProjectExpense(input) {
  if (!PROJECT_EXPENSE_CATEGORIES.has(input.category)) throw new Error("Expense category is invalid");
  if (typeof input.description !== "string" || input.description.trim().length < 3 || input.description.trim().length > 500) throw new Error("Description must be between 3 and 500 characters");
  const amount = money(input.amount); const taxAmount = money(input.tax_amount || 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) throw new Error("Amount is invalid");
  if (!Number.isFinite(taxAmount) || taxAmount < 0 || taxAmount > amount) throw new Error("Tax amount is invalid");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.incurred_on || "")) throw new Error("Incurred date is invalid");
  const incurred = new Date(`${input.incurred_on}T00:00:00.000Z`);
  if (Number.isNaN(incurred.getTime()) || incurred.toISOString().slice(0, 10) !== input.incurred_on || input.incurred_on > new Date().toISOString().slice(0, 10)) throw new Error("Incurred date is invalid");
  if (input.receipt_url) { try { if (new URL(input.receipt_url).protocol !== "https:") throw new Error(); } catch { throw new Error("Receipt URL must use HTTPS"); } }
  return { category: input.category, description: input.description.trim(), vendor: input.vendor?.trim().slice(0, 255) || null, amount, taxAmount, totalAmount: money(amount + taxAmount), incurredOn: input.incurred_on, receiptUrl: input.receipt_url || null };
}

export function calculateJobCostSummary({ contractValue = 0, estimatedLabor = 0, estimatedMaterials = 0, laborActual = 0, expenseActual = 0, invoiced = 0, collected = 0 } = {}) {
  const revenue = money(contractValue); const actualCost = money(Number(laborActual) + Number(expenseActual));
  const grossProfit = money(revenue - actualCost);
  const billed = money(invoiced); const cash = money(collected);
  return { contract_value: revenue, estimated_labor: money(estimatedLabor), estimated_materials: money(estimatedMaterials), labor_actual: money(laborActual), expense_actual: money(expenseActual), actual_cost: actualCost, gross_profit: grossProfit, gross_margin_percent: revenue > 0 ? money(grossProfit / revenue * 100) : null, invoiced: billed, collected: cash, receivable: money(Math.max(0, billed - cash)), customer_credit: money(Math.max(0, cash - billed)) };
}
