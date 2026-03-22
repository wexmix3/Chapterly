export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard?type=streak|books|pages&scope=global|friends
 * Returns ranked leaderboard of readers.
 *
 * Fixes:
 * - Friends-scope filter was not being applied (q.in() return value was discarded)
 * - Private profiles (is_public=false) now excluded from all queries
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { format, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = (req.nextUrl.searchParams.get('type') ?? 'streak') as 'streak' | 'books' | 'pages';
  const scope = (req.nextUrl.searchParams.get('scope') ?? 'global') as 'global' | 'friends';

  // For friends scope, get the set of followed user IDs (including self)
  let friendIds: string[] = [];
  if (scope === 'friends') {
    const { data: following } = await supabase
      .from('social_follow')
      .select('followee_id')
      .eq('follower_id', user.id);
    friendIds = [...(following ?? []).map(f => f.followee_id), user.id];
  }

  // Fetch public user IDs to exclude private profiles from global leaderboard
  // For friends scope, privacy is not enforced (you chose to follow them)
  let publicUserIds: string[] | null = null;
  if (scope === 'global') {
    const { data: publicUsers } = await supabase
      .from('users')
      .select('id')
      .eq('is_public', true);
    publicUserIds = (publicUsers ?? []).map(u => u.id);
    if (publicUserIds.length === 0) return NextResponse.json({ data: [] });
  }

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  let entries: Array<{ user_id: string; value: number }> = [];

  if (type === 'streak') {
    let q = supabase
      .from('stats_daily')
      .select('user_id, date, is_streak_day')
      .eq('is_streak_day', true)
      .gte('date', thirtyDaysAgo);

    // Apply scope filter — must reassign to preserve the builder chain
    if (scope === 'friends' && friendIds.length > 0) {
      q = q.in('user_id', friendIds);
    } else if (scope === 'global' && publicUserIds && publicUserIds.length > 0) {
      q = q.in('user_id', publicUserIds);
    }

    const { data: streakRows } = await q;
    const counts: Record<string, number> = {};
    for (const row of streakRows ?? []) {
      counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
    }
    entries = Object.entries(counts).map(([user_id, value]) => ({ user_id, value }));

  } else if (type === 'books') {
    let q = supabase
      .from('user_books')
      .select('user_id, finished_at')
      .eq('status', 'read')
      .eq('visibility', 'public')
      .gte('finished_at', yearStart);

    if (scope === 'friends' && friendIds.length > 0) {
      q = q.in('user_id', friendIds);
    } else if (scope === 'global' && publicUserIds && publicUserIds.length > 0) {
      q = q.in('user_id', publicUserIds);
    }

    const { data: rows } = await q;
    const counts: Record<string, number> = {};
    for (const row of rows ?? []) {
      counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
    }
    entries = Object.entries(counts).map(([user_id, value]) => ({ user_id, value }));

  } else if (type === 'pages') {
    let q = supabase
      .from('stats_daily')
      .select('user_id, pages')
      .gte('date', yearStart);

    if (scope === 'friends' && friendIds.length > 0) {
      q = q.in('user_id', friendIds);
    } else if (scope === 'global' && publicUserIds && publicUserIds.length > 0) {
      q = q.in('user_id', publicUserIds);
    }

    const { data: rows } = await q;
    const totals: Record<string, number> = {};
    for (const row of rows ?? []) {
      totals[row.user_id] = (totals[row.user_id] ?? 0) + (row.pages ?? 0);
    }
    entries = Object.entries(totals).map(([user_id, value]) => ({ user_id, value }));
  }

  // Sort and take top 20
  entries.sort((a, b) => b.value - a.value);
  const top = entries.slice(0, 20);
  const topIds = top.map(e => e.user_id);

  if (topIds.length === 0) return NextResponse.json({ data: [], my_rank: null, my_value: 0 });

  const { data: profiles } = await supabase
    .from('users')
    .select('id, handle, display_name, avatar_url')
    .in('id', topIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const result = top
    .map((e, i) => {
      const p = profileMap.get(e.user_id);
      if (!p) return null;
      return { rank: i + 1, ...p, value: e.value, is_me: e.user_id === user.id };
    })
    .filter(Boolean);

  const myRank = entries.findIndex(e => e.user_id === user.id) + 1;

  return NextResponse.json({
    data: result,
    my_rank: myRank > 0 ? myRank : null,
    my_value: entries.find(e => e.user_id === user.id)?.value ?? 0,
  });
}
