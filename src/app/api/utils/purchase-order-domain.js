import { PROJECT_EXPENSE_CATEGORIES } from "@/app/api/utils/project-expenses-domain";

const money = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function validatePurchaseOrder(input) {
  if (!PROJECT_EXPENSE_CATEGORIES.has(input.category))
    throw new Error("Purchase category is invalid");
  const vendor = typeof input.vendor === "string" ? input.vendor.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  if (vendor.length < 2 || vendor.length > 255)
    throw new Error("Vendor must be between 2 and 255 characters");
  if (description.length < 3 || description.length > 500)
    throw new Error("Description must be between 3 and 500 characters");
  const amount = money(input.amount);
  const taxAmount = money(input.tax_amount || 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000)
    throw new Error("Amount is invalid");
  if (!Number.isFinite(taxAmount) || taxAmount < 0 || taxAmount > amount)
    throw new Error("Tax amount is invalid");
  if (input.expected_on) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expected_on))
      throw new Error("Expected date is invalid");
    const expected = new Date(`${input.expected_on}T00:00:00.000Z`);
    if (
      Number.isNaN(expected.getTime()) ||
      expected.toISOString().slice(0, 10) !== input.expected_on
    )
      throw new Error("Expected date is invalid");
  }
  return {
    category: input.category,
    vendor,
    description,
    amount,
    taxAmount,
    totalAmount: money(amount + taxAmount),
    expectedOn: input.expected_on || null,
  };
}

export function validatePurchaseEvidence(input) {
  const reference =
    input.order_reference == null
      ? null
      : String(input.order_reference).trim().slice(0, 255) || null;
  let receiptUrl = null;
  if (input.receipt_url) {
    try {
      const url = new URL(input.receipt_url);
      if (url.protocol !== "https:") throw new Error();
      receiptUrl = url.toString();
    } catch {
      throw new Error("Receipt URL must use HTTPS");
    }
  }
  return { reference, receiptUrl };
}

export function assertPurchaseTransition(current, next) {
  const transitions = {
    draft: new Set(["approved", "cancelled"]),
    approved: new Set(["ordered", "cancelled"]),
    ordered: new Set(["received", "cancelled"]),
    received: new Set(),
    cancelled: new Set(),
  };
  if (!transitions[current]?.has(next))
    throw new Error(`Purchase order cannot move from ${current} to ${next}`);
}
