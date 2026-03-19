export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Books finished this year
  const { data: booksRead } = await supabase
    .from('user_books')
    .select('rating, started_at, finished_at, book:books(id, title, authors, cover_url, page_count, subjects)')
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', yearStart)
    .lte('finished_at', yearEnd)
    .order('finished_at', { ascending: true });

  // Daily stats for the year
  const { data: dailyStats } = await supabase
    .from('stats_daily')
    .select('date, pages, minutes, is_streak_day')
    .eq('user_id', user.id)
    .gte('date', yearStart)
    .lte('date', yearEnd);

  type BookEntry = {
    rating?: number | null;
    started_at?: string | null;
    finished_at?: string | null;
    book?: {
      id?: string;
      title?: string;
      authors?: string[];
      cover_url?: string | null;
      page_count?: number | null;
      subjects?: string[];
    } | null;
  };

  const books = (booksRead ?? []) as BookEntry[];

  // Compute stats
  const totalBooks = books.length;
  const totalPages = (dailyStats ?? []).reduce((s, r) => s + (r.pages ?? 0), 0);
  const totalMinutes = (dailyStats ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
  const streakDays = (dailyStats ?? []).filter(r => r.is_streak_day).length;

  // Best month
  const monthCounts = new Array(12).fill(0);
  for (const b of books) {
    if (b.finished_at) monthCounts[new Date(b.finished_at).getMonth()]++;
  }
  const bestMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Genres
  const genreCounts: Record<string, number> = {};
  for (const b of books) {
    for (const s of b.book?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  // Highest rated book
  const topRated = books.filter(b => (b.rating ?? 0) >= 4.5).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

  // Fastest read
  const withDuration = books
    .filter(b => b.started_at && b.finished_at)
    .map(b => ({
      ...b,
      days: Math.ceil((new Date(b.finished_at!).getTime() - new Date(b.started_at!).getTime()) / 86400000),
    }))
    .filter(b => b.days > 0);
  const fastestRead = withDuration.sort((a, b) => a.days - b.days)[0] ?? null;

  // Average rating
  const rated = books.filter(b => b.rating);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1) : null;

  const wrapped = {
    year,
    totalBooks,
    totalPages,
    totalMinutes,
    streakDays,
    bestMonth: monthCounts[bestMonthIdx] > 0 ? { name: MONTH_NAMES[bestMonthIdx], count: monthCounts[bestMonthIdx] } : null,
    topGenres,
    topRated: topRated ? { title: topRated.book?.title, cover_url: topRated.book?.cover_url, rating: topRated.rating } : null,
    fastestRead: fastestRead ? { title: fastestRead.book?.title, cover_url: fastestRead.book?.cover_url, days: fastestRead.days } : null,
    avgRating,
    monthlyBooks: monthCounts,
    allCovers: books.slice(0, 12).map(b => ({ title: b.book?.title, cover_url: b.book?.cover_url })),
  };

  return NextResponse.json({ data: wrapped });
}
