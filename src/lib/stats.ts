import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailyStats, UserStats, StreakInfo } from '@/types';
import { format, subDays, parseISO, startOfYear, startOfMonth, subMonths, getDay, getHours } from 'date-fns';

export function computeStreak(dailyStats: DailyStats[]): StreakInfo {
  if (!dailyStats.length) {
    return { current: 0, longest: 0, today_logged: false, streak_protection_available: false };
  }

  // Sort descending
  const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));
  const dates = sorted.map((d) => d.date);

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const todayLogged = dates.includes(today);
  const startDate = todayLogged ? today : (dates[0] === yesterday ? yesterday : null);

  let current = 0;
  if (startDate) {
    let cursor = startDate;
    while (dates.includes(cursor)) {
      current++;
      cursor = format(subDays(parseISO(cursor), 1), 'yyyy-MM-dd');
    }
  }

  // Compute longest streak
  let longest = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) { run = 1; continue; }
    const prev = format(subDays(parseISO(dates[i - 1]), 1), 'yyyy-MM-dd');
    if (dates[i] === prev) { run++; } else { run = 1; }
    longest = Math.max(longest, run);
  }
  longest = Math.max(longest, current);

  return {
    current,
    longest,
    today_logged: todayLogged,
    streak_protection_available: current >= 3,
  };
}

export async function computeUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  const now = new Date();
  const yearStart = format(startOfYear(now), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

  const [booksRes, sessionsRes, dailyRes, ratingRes] = await Promise.all([
    supabase
      .from('user_books')
      .select('id, status, finished_at, book:books(subjects)')
      .eq('user_id', userId),
    supabase
      .from('sessions')
      .select('pages_delta, minutes_delta, created_at, started_at')
      .eq('user_id', userId),
    supabase
      .from('stats_daily')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabase
      .from('user_books')
      .select('rating')
      .eq('user_id', userId)
      .eq('status', 'read')
      .not('rating', 'is', null),
  ]);

  const userBooks = booksRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const dailyStats = (dailyRes.data ?? []) as DailyStats[];
  const ratings = ratingRes.data ?? [];

  const totalBooksRead = userBooks.filter((b) => b.status === 'read').length;
  const booksThisYear = userBooks.filter(
    (b) => b.status === 'read' && b.finished_at && b.finished_at >= yearStart
  ).length;

  const totalPages = sessions.reduce((sum, s) => sum + (s.pages_delta || 0), 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes_delta || 0), 0);
  const pagesThisMonth = sessions
    .filter((s) => s.created_at >= monthStart)
    .reduce((sum, s) => sum + (s.pages_delta || 0), 0);

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum: number, r: { rating: number | null }) => sum + (r.rating ?? 0), 0) /
        ratings.length
      : null;

  const streakInfo = computeStreak(dailyStats);

  // Compute top genres from subjects across all shelved books
  const genreCounts: Record<string, number> = {};
  for (const ub of userBooks) {
    const subjects: string[] = (ub.book as any)?.subjects ?? [];
    for (const s of subjects) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }
  const top_genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Compute reading activity by month (last 12 months)
  const booksByMonth: Record<string, number> = {};
  for (const ub of userBooks) {
    if (ub.status === 'read' && ub.finished_at) {
      const month = ub.finished_at.substring(0, 7);
      booksByMonth[month] = (booksByMonth[month] ?? 0) + 1;
    }
  }
  const pagesByMonth: Record<string, number> = {};
  for (const s of sessions) {
    const month = s.created_at.substring(0, 7);
    pagesByMonth[month] = (pagesByMonth[month] ?? 0) + (s.pages_delta ?? 0);
  }
  const reading_by_month = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    const month = format(d, 'yyyy-MM');
    return { month, books: booksByMonth[month] ?? 0, pages: pagesByMonth[month] ?? 0 };
  });

  // ── Session insights ─────────────────────────────────────────
  const sessionCount = sessions.length;
  const avg_pages_per_session = sessionCount > 0 ? Math.round(totalPages / sessionCount) : 0;
  const avg_minutes_per_session = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
  const longest_session_pages = sessionCount > 0 ? Math.max(...sessions.map((s) => s.pages_delta ?? 0)) : 0;

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts: number[] = Array(7).fill(0);
  const timeBuckets: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  for (const s of sessions) {
    const ts = (s as any).started_at ?? s.created_at;
    if (!ts) continue;
    const dt = parseISO(ts);
    dayCounts[getDay(dt)]++;
    const h = getHours(dt);
    if (h >= 5 && h < 12) timeBuckets['Morning']++;
    else if (h >= 12 && h < 17) timeBuckets['Afternoon']++;
    else if (h >= 17 && h < 22) timeBuckets['Evening']++;
    else timeBuckets['Night']++;
  }
  const maxDayCount = Math.max(...dayCounts);
  const best_day_of_week = maxDayCount > 0 ? DAY_NAMES[dayCounts.indexOf(maxDayCount)] : null;
  const maxBucketCount = Math.max(...Object.values(timeBuckets));
  const best_time_of_day = maxBucketCount > 0
    ? (Object.entries(timeBuckets).find(([, v]) => v === maxBucketCount)?.[0] ?? null)
    : null;

  const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');
  const sessions30d = sessions.filter((s) => s.created_at >= thirtyDaysAgo);
  const pages30d = sessions30d.reduce((sum, s) => sum + (s.pages_delta ?? 0), 0);
  const distinctDays30d = new Set(sessions30d.map((s) => s.created_at.substring(0, 10))).size;
  const pages_per_day_30d = distinctDays30d > 0 ? Math.round(pages30d / distinctDays30d) : 0;

  return {
    total_books_read: totalBooksRead,
    total_pages: totalPages,
    total_minutes: totalMinutes,
    current_streak: streakInfo.current,
    longest_streak: streakInfo.longest,
    books_this_year: booksThisYear,
    pages_this_month: pagesThisMonth,
    avg_rating: avgRating,
    top_genres,
    reading_by_month,
    session_insights: {
      avg_pages_per_session,
      avg_minutes_per_session,
      best_day_of_week,
      best_time_of_day,
      longest_session_pages,
      pages_per_day_30d,
    },
  };
}
