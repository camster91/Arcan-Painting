import Stripe from 'stripe';
import { addCredits } from '../utils/credits-db.js';

export function getStripeWebhookSecret() {
  // ARCAN_STRIPE_WEBHOOK_SECRET is the canonical production name. Retaining
  // the documented legacy name prevents an otherwise-valid deployment from
  // silently rejecting Stripe events during the configuration transition.
  return process.env.ARCAN_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
}

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    const webhookSecret = getStripeWebhookSecret();

    if (!webhookSecret) {
      console.error('Stripe webhook secret not set — rejecting webhook');
      return Response.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    let event;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits, 10);
      const packageId = session.metadata?.package_id;

      if (userId && credits > 0) {
        await addCredits(
          userId,
          credits,
          'purchase',
          `Purchased ${packageId} (${credits} credits)`,
          session.id
        );
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return Response.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
