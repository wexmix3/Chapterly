export const dynamic = 'force-dynamic';

/**
 * POST /api/push/subscribe  { endpoint, keys: { p256dh, auth } }
 *   — saves a push subscription for the current user
 *
 * DELETE /api/push/subscribe  { endpoint }
 *   — removes a push subscription
 *
 * GET /api/push/subscribe
 *   — returns { subscribed: bool, publicKey: string }
 *   The publicKey is the VAPID public key the browser needs to subscribe.
 *
 * VAPID setup (one-time, run in project root):
 *   npx web-push generate-vapid-keys
 * Then add to .env.local:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
 *   VAPID_PRIVATE_KEY=<privateKey>
 *   VAPID_EMAIL=mailto:hello@getchapterly.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const endpoint = req.nextUrl.searchParams.get('endpoint');

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  if (!endpoint) {
    return NextResponse.json({ publicKey, subscribed: false });
  }

  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('endpoint', endpoint)
    .maybeSingle();

  return NextResponse.json({ publicKey, subscribed: !!data });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'endpoint and keys.p256dh + keys.auth are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    }, { onConflict: 'user_id,endpoint' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { endpoint: string };
  if (!body.endpoint) return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', session.user.id)
    .eq('endpoint', body.endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
