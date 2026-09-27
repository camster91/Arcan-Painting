import sql from "@/app/api/utils/sql";
import { recordCheckoutPayment, stripeClient } from "@/app/api/utils/stripe-payments";

// Stripe → POST. Verifies the signature, then records paid invoice checkouts.
// Configure the endpoint https://<site>/api/stripe/webhook in Stripe for
// checkout.session.completed and checkout.session.async_payment_succeeded.
export async function POST(request) {
  const stripe = stripeClient();
  const secret = process.env.ARCAN_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return Response.json({ error: "Stripe is not configured" }, { status: 503 });

  const payload = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, request.headers.get("stripe-signature") || "", secret);
  } catch (error) {
    return Response.json({ error: `Invalid signature: ${error.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      const result = await recordCheckoutPayment(sql, event.data.object);
      return Response.json({ received: true, ...result });
    } catch (error) {
      console.error("Stripe webhook payment record failed:", error);
      return Response.json({ error: "Could not record payment" }, { status: 500 }); // Stripe retries
    }
  }
  return Response.json({ received: true, ignored: event.type });
}
