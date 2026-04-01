export const dynamic = 'force-dynamic';

/**
 * POST /api/push/send
 * Sends a web push notification to one or more users.
 * Protected by CRON_SECRET (for server-to-server calls).
 *
 * Body: {
 *   user_id?: string        — send to one user (or omit + target_ids for bulk)
 *   user_ids?: string[]     — send to multiple users
 *   title: string
 *   body: string
 *   url?: string            — deep link opened on click
 *   icon?: string
 * }
 *
 * Uses the `web-push` npm package. Install with: npm install web-push
 * If web-push is not installed, the route returns a 501 with setup instructions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebPushLib = any;

async function getWebPush(): Promise<WebPushLib | null> {
  try {
    // Dynamic import so missing package doesn't break build
    const wp = await import('web-push');
    return wp.default ?? wp;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL ?? 'mailto:hello@getchapterly.com';

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      {
        error: 'VAPID keys not configured',
        setup: [
          'Run: npx web-push generate-vapid-keys',
          'Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env.local',
          'Add VAPID_EMAIL=mailto:you@domain.com to .env.local',
        ],
      },
      { status: 501 }
    );
  }

  const webpush = await getWebPush();
  if (!webpush) {
    return NextResponse.json(
      { error: 'web-push package not installed. Run: npm install web-push' },
      { status: 501 }
    );
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  const body = await req.json() as {
    user_id?: string;
    user_ids?: string[];
    title: string;
    body: string;
    url?: string;
    icon?: string;
  };

  const userIds = body.user_ids ?? (body.user_id ? [body.user_id] : []);
  if (userIds.length === 0) {
    return NextResponse.json({ error: 'user_id or user_ids is required' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscriptions found for these users' });
  }

  const payload: PushPayload = {
    title: body.title,
    body: body.body,
    url: body.url ?? '/',
    icon: body.icon,
  };

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        const result = await webpush.sendNotification(pushSub, JSON.stringify(payload));
        if (result.statusCode === 201 || result.statusCode === 200) {
          sent++;
        } else {
          failed++;
        }
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 410 Gone / 404 = subscription expired — clean it up
        if (status === 410 || status === 404) {
          staleEndpoints.push(sub.endpoint);
        }
        failed++;
      }
    })
  );

  // Remove stale subscriptions
  if (staleEndpoints.length > 0) {
    supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
      .then(() => {}, () => {});
  }

  return NextResponse.json({ sent, failed, stale_removed: staleEndpoints.length });
}
