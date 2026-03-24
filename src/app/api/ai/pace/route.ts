export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/pace
 * Returns finish-line predictions for currently-reading books
 * based on recent session data.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { format, addDays } from 'date-fns';

interface PacePrediction {
  user_book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  current_page: number;
  total_pages: number;
  progress_pct: number;
  pages_left: number;
  avg_pages_per_day: number;
  days_to_finish: number | null;
  finish_date: string | null;
  sessions_used: number;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get currently-reading books
  const { data: currentlyReading } = await supabase
    .from('user_books')
    .select('id, current_page, book:books(id, title, authors, cover_url, page_count)')
    .eq('user_id', user.id)
    .eq('status', 'reading');

  if (!currentlyReading || currentlyReading.length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  // For each book, get recent sessions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const predictions: PacePrediction[] = [];

  for (const ub of currentlyReading) {
    type BookData = { id: string; title: string; authors: string[]; cover_url: string | null; page_count: number | null } | null;
    const book = ub.book as unknown as BookData;
    const totalPages = book?.page_count ?? null;
    const currentPage = ub.current_page ?? 0;

    if (!totalPages || totalPages <= 0) continue;

    const pagesLeft = totalPages - currentPage;
    if (pagesLeft <= 0) continue;

    // Get sessions for this book
    const { data: sessions } = await supabase
      .from('sessions')
      .select('created_at, pages_delta')
      .eq('user_id', user.id)
      .eq('user_book_id', ub.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const validSessions = (sessions ?? []).filter(s => (s.pages_delta ?? 0) > 0);

    let avgPagesPerDay = 0;
    let daysToFinish: number | null = null;
    let finishDate: string | null = null;

    if (validSessions.length >= 1) {
      // Calculate unique reading days and total pages
      const uniqueDays = new Set(validSessions.map(s => s.created_at.substring(0, 10))).size;
      const totalPagesInSessions = validSessions.reduce((sum, s) => sum + (s.pages_delta ?? 0), 0);
      avgPagesPerDay = uniqueDays > 0 ? Math.round(totalPagesInSessions / uniqueDays) : 0;

      if (avgPagesPerDay > 0) {
        daysToFinish = Math.ceil(pagesLeft / avgPagesPerDay);
        finishDate = format(addDays(new Date(), daysToFinish), 'MMM d, yyyy');
      }
    }

    predictions.push({
      user_book_id: ub.id,
      title: book?.title ?? 'Unknown',
      author: book?.authors?.[0] ?? 'Unknown Author',
      cover_url: book?.cover_url ?? null,
      current_page: currentPage,
      total_pages: totalPages,
      progress_pct: Math.round((currentPage / totalPages) * 100),
      pages_left: pagesLeft,
      avg_pages_per_day: avgPagesPerDay,
      days_to_finish: daysToFinish,
      finish_date: finishDate,
      sessions_used: validSessions.length,
    });
  }

  return NextResponse.json({ predictions });
}
