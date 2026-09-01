export function assertPaymentCreateStatus(status) {
  if (!["pending", "cleared", "failed"].includes(status)) {
    throw new Error("A new payment cannot start as refunded");
  }
}

export function assertPaymentUpdate(existing, updates) {
  const current = existing.status;
  const next = updates.status ?? current;
  const transitions = {
    pending: new Set(["pending", "cleared", "failed"]),
    failed: new Set(["failed", "pending"]),
    cleared: new Set(["cleared", "refunded"]),
    refunded: new Set(["refunded"]),
  };

  if (!transitions[current]?.has(next)) {
    throw new Error(`Payment cannot move from ${current} to ${next}`);
  }

  const financialFields = ["amount", "payment_method", "payment_date"];
  if (["cleared", "refunded"].includes(current) && financialFields.some((field) => updates[field] !== undefined)) {
    throw new Error("Settled payment financial details are immutable; refund it and record a correction");
  }
}

export function invoiceBalance(totalAmount, clearedAmount) {
  const total = Math.max(0, Number(totalAmount) || 0);
  const paid = Math.max(0, Number(clearedAmount) || 0);
  return {
    amount_paid: paid,
    amount_due: Math.max(0, total - paid),
    customer_credit: Math.max(0, paid - total),
    payment_status: paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid",
  };
}
