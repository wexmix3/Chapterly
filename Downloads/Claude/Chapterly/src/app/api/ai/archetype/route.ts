export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { computeArchetype, getArchetype } from '@/lib/archetype';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Gather stats in parallel
  const [shelfRes, sessionRes, streakRes] = await Promise.all([
    supabase
      .from('user_books')
      .select('status, books(subjects)')
      .eq('user_id', user.id),
    supabase
      .from('sessions')
      .select('pages_read')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50),
    supabase
      .from('stats_daily')
      .select('date, minutes_read')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(90),
  ]);

  const shelf = shelfRes.data ?? [];
  const sessions = sessionRes.data ?? [];

  // Books read / DNF / to_read
  const booksRead = shelf.filter(b => b.status === 'read').length;
  const dnfCount = shelf.filter(b => b.status === 'dnf').length;
  const toReadCount = shelf.filter(b => b.status === 'to_read').length;

  // Average pages per session
  const totalPages = sessions.reduce((s, r) => s + (r.pages_read ?? 0), 0);
  const avgPagesPerSession = sessions.length ? Math.round(totalPages / sessions.length) : 0;

  // Genre count
  const genreSet = new Set<string>();
  const genreFreq: Record<string, number> = {};
  for (const entry of shelf) {
    const sub = (entry.books as { subjects?: string[] } | null)?.subjects ?? [];
    for (const s of sub.slice(0, 3)) {
      genreSet.add(s);
      genreFreq[s] = (genreFreq[s] ?? 0) + 1;
    }
  }
  const genreCount = genreSet.size;
  const topGenreBooks = genreCount > 0
    ? Math.max(...Object.values(genreFreq))
    : 0;

  // Current streak (consecutive days with minutes_read > 0)
  const dailyStats = streakRes.data ?? [];
  let currentStreak = 0;
  for (const row of dailyStats) {
    if ((row.minutes_read ?? 0) > 0) currentStreak++;
    else break;
  }

  const archetypeId = computeArchetype({
    booksRead,
    avgPagesPerSession,
    dnfCount,
    genreCount,
    currentStreak,
    toReadCount,
    topGenreBooks,
  });

  const archetype = getArchetype(archetypeId);

  return NextResponse.json({ data: archetype });
}
