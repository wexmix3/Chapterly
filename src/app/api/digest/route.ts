export const dynamic = 'force-dynamic';

/**
 * POST /api/digest
 * Called by Vercel Cron every Monday at 9am UTC.
 * Sends weekly reading digest emails to all users who have read in the last 7 days.
 * Protected by CRON_SECRET env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getResend, FROM_EMAIL, buildDigestHtml, type DigestData } from '@/lib/email';
import { subDays, startOfWeek, format } from 'date-fns';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const resend = getResend();

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd');
  const yearStart = `${now.getFullYear()}-01-01`;

  // Get all users who were active in the last 7 days
  const { data: activeStats } = await supabase
    .from('stats_daily')
    .select('user_id, pages')
    .gte('date', sevenDaysAgo);

  if (!activeStats || activeStats.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Aggregate pages per user for the week
  const userPagesMap: Record<string, number> = {};
  for (const row of activeStats) {
    userPagesMap[row.user_id] = (userPagesMap[row.user_id] ?? 0) + (row.pages ?? 0);
  }

  const activeUserIds = Object.keys(userPagesMap);

  // Fetch user profiles + emails in batches
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUserMap = new Map(
    (users?.users ?? []).map(u => [u.id, u.email ?? ''])
  );

  // Fetch Chapterly profiles
  const { data: profiles } = await supabase
    .from('users')
    .select('id, handle, display_name')
    .in('id', activeUserIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  // Fetch books finished this year per user
  const { data: finishedBooks } = await supabase
    .from('user_books')
    .select('user_id, finished_at, book:books(title)')
    .in('user_id', activeUserIds)
    .eq('status', 'read')
    .gte('finished_at', yearStart);

  const finishedByUser: Record<string, { count: number; thisWeek: string[] }> = {};
  for (const ub of finishedBooks ?? []) {
    if (!finishedByUser[ub.user_id]) finishedByUser[ub.user_id] = { count: 0, thisWeek: [] };
    finishedByUser[ub.user_id].count++;
    if (ub.finished_at >= weekStart) {
      const title = (ub.book as { title?: string } | null)?.title ?? 'a book';
      finishedByUser[ub.user_id].thisWeek.push(title);
    }
  }

  // Fetch streaks per user
  const { data: streakData } = await supabase
    .from('stats_daily')
    .select('user_id, date, is_streak_day')
    .in('user_id', activeUserIds)
    .eq('is_streak_day', true)
    .order('date', { ascending: false });

  const streakMap: Record<string, number> = {};
  for (const row of streakData ?? []) {
    streakMap[row.user_id] = (streakMap[row.user_id] ?? 0) + 1;
  }

  // Fetch reading challenges
  const { data: challenges } = await supabase
    .from('reading_challenges')
    .select('user_id, goal_books')
    .in('user_id', activeUserIds)
    .eq('year', now.getFullYear());

  const challengeMap = new Map((challenges ?? []).map(c => [c.user_id, c.goal_books]));

  // Send emails
  let sent = 0;
  const errors: string[] = [];

  for (const userId of activeUserIds) {
    const email = authUserMap.get(userId);
    const profile = profileMap.get(userId);
    if (!email || !profile) continue;

    const digestData: DigestData = {
      display_name: profile.display_name,
      handle: profile.handle,
      pages_this_week: userPagesMap[userId] ?? 0,
      books_finished: finishedByUser[userId]?.thisWeek ?? [],
      current_streak: streakMap[userId] ?? 0,
      books_read_this_year: finishedByUser[userId]?.count ?? 0,
      goal_books: challengeMap.get(userId) ?? 0,
      friend_activity: [], // TODO: pull from social feed in a future pass
    };

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `📚 Your reading week${digestData.pages_this_week > 0 ? ` — ${digestData.pages_this_week} pages!` : ''}`,
        html: buildDigestHtml(digestData),
      });
      sent++;
    } catch (err) {
      errors.push(`${userId}: ${String(err)}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
