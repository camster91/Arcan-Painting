import Stripe from "stripe";
import { recalcInvoiceTotals } from "@/app/api/utils/invoice-totals";

let client = null;
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/**
 * Record a completed Checkout Session as a cleared card payment, once.
 * payment_number is derived from the session id, so a retried webhook is ignored.
 */
export async function recordCheckoutPayment(db, session) {
  const invoiceId = parseInt(session?.metadata?.invoice_id, 10);
  if (!invoiceId || session.payment_status !== "paid") return { recorded: false, reason: "not a paid invoice session" };
  const amount = Number(session.amount_total || 0) / 100;
  const paymentNumber = `STRIPE-${session.id}`.slice(0, 50);
  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  return db.transaction(async (tx) => {
    const [invoice] = await tx`SELECT id FROM invoices WHERE id = ${invoiceId}`;
    if (!invoice) return { recorded: false, reason: "invoice not found" };
    const inserted = await tx`
      INSERT INTO payments (payment_number, invoice_id, payment_method, payment_reference, amount, payment_date,
                            status, notes, processed_by, stripe_payment_intent_id)
      VALUES (${paymentNumber}, ${invoiceId}, 'card', ${session.id}, ${amount}, ${new Date().toISOString().slice(0, 10)},
              'cleared', 'Paid online by card (Stripe)', 'stripe', ${intent})
      ON CONFLICT (payment_number) DO NOTHING
      RETURNING id
    `;
    if (!inserted.length) return { recorded: false, reason: "already recorded" };
    await recalcInvoiceTotals(tx, invoiceId);
    await tx`
      INSERT INTO notifications (type, title, message, related_type, related_id, is_read)
      VALUES ('payment_received', 'Card payment received', ${`$${amount.toFixed(2)} paid online by card.`}, 'invoice', ${invoiceId}, false)
    `;
    return { recorded: true, paymentId: inserted[0].id };
  });
}
