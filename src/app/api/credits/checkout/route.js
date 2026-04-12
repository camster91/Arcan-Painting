import Stripe from 'stripe';
import { CREDIT_PACKAGES } from '../../utils/packages.js';
import { requireAuth } from '../../utils/auth.js';

const PACKAGES = Object.fromEntries(CREDIT_PACKAGES.map(p => [p.id, p]));

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { packageId } = await request.json();

    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return Response.json({ error: 'Invalid package' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: { name: pkg.name, description: `${pkg.credits} AI credits for Arcan Painting` },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/admin?credits=success`,
      cancel_url: `${origin}/admin?credits=cancelled`,
      metadata: {
        user_id: user.username,
        package_id: packageId,
        credits: pkg.credits.toString(),
      },
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
