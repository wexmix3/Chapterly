export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Idempotency: skip if we've already processed this event
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Record the event before processing to prevent double-execution
  await supabase.from('stripe_events').insert({ id: event.id, type: event.type });

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      const isActive = ['active', 'trialing'].includes(sub.status);
      const raw = sub as unknown as { current_period_start: number; current_period_end: number };
      const periodStart = new Date(raw.current_period_start * 1000).toISOString();
      const periodEnd = new Date(raw.current_period_end * 1000).toISOString();

      await supabase.from('users').update({
        is_premium: isActive,
        premium_expires_at: isActive ? periodEnd : null,
        stripe_subscription_id: sub.id,
        stripe_customer_id: String(sub.customer),
      }).eq('id', userId);

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: String(sub.customer),
        status: sub.status,
        plan: 'premium_monthly',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await supabase.from('users').update({
        is_premium: false,
        premium_expires_at: null,
        stripe_subscription_id: null,
      }).eq('id', userId);

      await supabase.from('subscriptions').update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'invoice.payment_failed': {
      // Mark premium as inactive on payment failure
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = String(invoice.customer);
      await supabase.from('users').update({
        is_premium: false,
        premium_expires_at: null,
      }).eq('stripe_customer_id', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
