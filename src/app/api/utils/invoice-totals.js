/**
 * Recompute an invoice's paid/due amounts from its payments.
 *
 * Only cleared payments count toward the balance; pending, failed and
 * refunded ones do not. The invoice status follows the balance: fully paid
 * invoices become 'paid', and a 'paid' invoice that loses a payment goes
 * back to 'sent'. Cancelled invoices keep their status.
 *
 * The sum is computed first and written as plain values so the UPDATE behaves
 * the same on PostgreSQL and MariaDB (MariaDB evaluates SET left to right).
 *
 * @param db  the `sql` helper or a transaction handle from sql.transaction
 */
export async function recalcInvoiceTotals(db, invoiceId) {
  const [inv] = await db`SELECT total_amount, status FROM invoices WHERE id = ${invoiceId}`;
  if (!inv) return null;
  const [sum] = await db`
    SELECT COALESCE(SUM(amount), 0) AS paid
    FROM payments
    WHERE invoice_id = ${invoiceId} AND status = 'cleared'
  `;

  const { paid, due, paymentStatus, status } = invoiceBalance(inv.total_amount, sum?.paid, inv.status);
  const [updated] = await db`
    UPDATE invoices
    SET amount_paid = ${paid}, amount_due = ${due}, payment_status = ${paymentStatus},
        status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${invoiceId}
    RETURNING *
  `;
  return updated;
}

/** Pure balance calculation, in cents to avoid float drift. */
export function invoiceBalance(totalAmount, paidAmount, currentStatus) {
  const cents = (v) => Math.round(Number(v || 0) * 100);
  const total = cents(totalAmount);
  const paid = cents(paidAmount);
  const paymentStatus = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
  let status = currentStatus;
  if (status !== "cancelled") {
    if (paymentStatus === "paid") status = "paid";
    else if (status === "paid") status = "sent";
  }
  return { paid: paid / 100, due: (total - paid) / 100, paymentStatus, status };
}
