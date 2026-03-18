import Stripe from 'stripe';
import { addCredits } from '../utils/credits-db.js';

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    const webhookSecret = process.env.ARCAN_STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('ARCAN_STRIPE_WEBHOOK_SECRET not set — rejecting webhook');
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
        const newBalance = addCredits(
          userId,
          credits,
          'purchase',
          `Purchased ${packageId} (${credits} credits)`,
          session.id
        );
        console.log(`Credits added: ${credits} for ${userId}, new balance: ${newBalance}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return Response.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
