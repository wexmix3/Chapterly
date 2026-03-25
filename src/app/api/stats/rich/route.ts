export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface RichStats {
  format_breakdown: { format: string; count: number; pct: number }[];
  avg_days_to_finish: number | null;
  longest_book_read: { title: string; authors: string[]; page_count: number } | null;
  shortest_book_read: { title: string; authors: string[]; page_count: number } | null;
  most_productive_month: { month: string; books: number } | null;
  rating_distribution: { rating: number; count: number }[];
  dnf_rate: number | null;
  total_books: number;
  books_read: number;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shelf } = await supabase
    .from('user_books')
    .select(`
      status, rating, format, started_at, finished_at,
      books(title, authors, page_count)
    `)
    .eq('user_id', user.id);

  if (!shelf || shelf.length === 0) {
    return NextResponse.json({ data: null });
  }

  type ShelfRow = {
    status: string;
    rating: number | null;
    format: string | null;
    started_at: string | null;
    finished_at: string | null;
    books: { title: string; authors: string[]; page_count: number | null } | null;
  };

  const rows = shelf as unknown as ShelfRow[];
  const readRows = rows.filter(r => r.status === 'read');
  const totalBooks = rows.length;
  const booksRead = readRows.length;

  // Format breakdown
  const formatCounts: Record<string, number> = { physical: 0, ebook: 0, audiobook: 0 };
  for (const r of rows) {
    if (r.format && formatCounts[r.format] !== undefined) {
      formatCounts[r.format]++;
    }
  }
  const totalFormatted = Object.values(formatCounts).reduce((s, n) => s + n, 0);
  const format_breakdown = Object.entries(formatCounts)
    .map(([format, count]) => ({
      format,
      count,
      pct: totalFormatted > 0 ? Math.round((count / totalFormatted) * 100) : 0,
    }))
    .filter(f => f.count > 0);

  // Average days to finish
  const daysToFinish = readRows
    .filter(r => r.started_at && r.finished_at)
    .map(r => {
      const start = new Date(r.started_at!).getTime();
      const end = new Date(r.finished_at!).getTime();
      return Math.round((end - start) / 86400000);
    })
    .filter(d => d > 0 && d < 365);

  const avg_days_to_finish = daysToFinish.length
    ? Math.round(daysToFinish.reduce((s, d) => s + d, 0) / daysToFinish.length)
    : null;

  // Longest and shortest books read
  const booksWithPages = readRows
    .filter(r => r.books?.page_count && (r.books.page_count ?? 0) > 0)
    .sort((a, b) => (b.books?.page_count ?? 0) - (a.books?.page_count ?? 0));

  const longest_book_read = booksWithPages[0]?.books
    ? { title: booksWithPages[0].books.title, authors: booksWithPages[0].books.authors, page_count: booksWithPages[0].books.page_count! }
    : null;

  const shortest_book_read = booksWithPages[booksWithPages.length - 1]?.books && booksWithPages.length > 1
    ? { title: booksWithPages[booksWithPages.length - 1].books!.title, authors: booksWithPages[booksWithPages.length - 1].books!.authors, page_count: booksWithPages[booksWithPages.length - 1].books!.page_count! }
    : null;

  // Most productive month (by finished_at)
  const monthCounts: Record<string, number> = {};
  for (const r of readRows) {
    if (r.finished_at) {
      const month = r.finished_at.slice(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    }
  }
  const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
  const most_productive_month = topMonth
    ? {
        month: new Date(topMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        books: topMonth[1],
      }
    : null;

  // Rating distribution
  const ratingMap: Record<number, number> = {};
  for (const r of rows) {
    if (r.rating && r.rating > 0) {
      const rounded = Math.round(r.rating * 2) / 2;
      ratingMap[rounded] = (ratingMap[rounded] ?? 0) + 1;
    }
  }
  const rating_distribution = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    .map(v => ({ rating: v, count: ratingMap[v] ?? 0 }))
    .filter(r => r.count > 0);

  // DNF rate
  const dnf = rows.filter(r => r.status === 'dnf').length;
  const started = rows.filter(r => ['read', 'dnf', 'reading'].includes(r.status)).length;
  const dnf_rate = started > 0 ? Math.round((dnf / started) * 100) : null;

  const result: RichStats = {
    format_breakdown,
    avg_days_to_finish,
    longest_book_read,
    shortest_book_read,
    most_productive_month,
    rating_distribution,
    dnf_rate,
    total_books: totalBooks,
    books_read: booksRead,
  };

  return NextResponse.json({ data: result });
}
