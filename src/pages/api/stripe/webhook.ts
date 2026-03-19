import type { APIRoute } from 'astro';
import { getStripe } from '../../../lib/stripe-server';
import { getServiceClient } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  const supabase = getServiceClient();

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId && plan) {
        // Get subscription details
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status === 'active' ? 'active' : 'inactive',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
