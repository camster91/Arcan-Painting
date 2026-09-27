import sql from "@/app/api/utils/sql";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { isPublicToken, publicUrl } from "@/app/api/utils/public-links";
import { publicInvoice } from "@/app/api/utils/public-documents";
import { stripeClient } from "@/app/api/utils/stripe-payments";

// POST { token } — start a Stripe Checkout for the invoice's balance. Returns { url }.
export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const stripe = stripeClient();
  if (!stripe) return Response.json({ error: "Card payments are not set up. Please pay by e-transfer." }, { status: 503 });

  try {
    const { token } = await request.json().catch(() => ({}));
    const invoice = isPublicToken(token) ? await publicInvoice(sql, token) : null;
    if (!invoice) return Response.json({ error: "This invoice link is not valid." }, { status: 404 });
    if (!invoice.card_payments) return Response.json({ error: "This invoice has nothing left to pay." }, { status: 409 });

    const page = publicUrl("invoices", token, process.env.APP_URL || new URL(request.url).origin);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(Number(invoice.amount_due) * 100),
          product_data: { name: `${invoice.company.name} invoice ${invoice.invoice_number}`, description: invoice.title || undefined },
        },
      }],
      customer_email: invoice.customer_email || undefined,
      metadata: { invoice_id: String(invoice.id), invoice_number: invoice.invoice_number },
      payment_intent_data: { metadata: { invoice_id: String(invoice.id), invoice_number: invoice.invoice_number } },
      success_url: `${page}?paid=1`,
      cancel_url: page,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout failed:", error.message);
    return Response.json({ error: "Card payment could not be started. Please try again or pay by e-transfer." }, { status: 502 });
  }
}
