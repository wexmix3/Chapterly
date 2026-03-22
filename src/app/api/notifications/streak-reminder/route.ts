export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/streak-reminder
 * Called by Vercel Cron daily at 7pm UTC.
 * Sends a "don't break your streak" email to users who:
 *   - Have a streak of 1+ days
 *   - Have NOT logged any reading today
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getResend, FROM_EMAIL, buildStreakReminderHtml } from '@/lib/email';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const resend = getResend();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Users who read YESTERDAY (active streak) but NOT today
  const { data: yesterdayReaders } = await supabase
    .from('stats_daily')
    .select('user_id')
    .eq('date', yesterday)
    .eq('is_streak_day', true);

  if (!yesterdayReaders || yesterdayReaders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const activeUserIds = yesterdayReaders.map(r => r.user_id);

  // Filter out users who already logged today
  const { data: todayReaders } = await supabase
    .from('stats_daily')
    .select('user_id')
    .eq('date', today)
    .eq('is_streak_day', true)
    .in('user_id', activeUserIds);

  const todaySet = new Set((todayReaders ?? []).map(r => r.user_id));
  const toRemind = activeUserIds.filter(id => !todaySet.has(id));

  if (toRemind.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Get streak lengths
  const { data: streakRows } = await supabase
    .from('stats_daily')
    .select('user_id, date, is_streak_day')
    .in('user_id', toRemind)
    .eq('is_streak_day', true)
    .order('date', { ascending: false });

  const streakMap: Record<string, number> = {};
  for (const row of streakRows ?? []) {
    streakMap[row.user_id] = (streakMap[row.user_id] ?? 0) + 1;
  }

  // Get profiles
  const { data: profiles } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', toRemind);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  // Get emails
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map((authUsers?.users ?? []).map(u => [u.id, u.email ?? '']));

  // Hard cap to bound Resend usage per cron run
  const MAX_EMAILS_PER_RUN = 500;

  let sent = 0;
  for (const userId of toRemind.slice(0, MAX_EMAILS_PER_RUN)) {
    const email = emailMap.get(userId);
    const profile = profileMap.get(userId);
    if (!email || !profile) continue;

    const streak = streakMap[userId] ?? 1;
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: streak > 1
          ? `🔥 Your ${streak}-day streak is at risk — log reading today!`
          : '📖 Log some reading today!',
        html: buildStreakReminderHtml(profile.display_name, streak),
      });
      sent++;
    } catch {
      // Non-fatal; log silently
    }
  }

  return NextResponse.json({ sent });
}
