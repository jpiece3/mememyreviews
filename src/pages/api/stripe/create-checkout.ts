import type { APIRoute } from 'astro';
import { getUserClient, getAccessToken } from '../../../lib/supabase-server';
import { getStripe, PRICE_IDS, type PlanName } from '../../../lib/stripe-server';

export const POST: APIRoute = async ({ request }) => {
  const token = getAccessToken(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = getUserClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as PlanName;

  if (!plan || !PRICE_IDS[plan]) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 });
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${new URL(request.url).origin}/app?checkout=success`,
    cancel_url: `${new URL(request.url).origin}/app?checkout=cancel`,
    metadata: { supabase_user_id: user.id, plan },
  });

  return new Response(
    JSON.stringify({ checkoutUrl: session.url }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
