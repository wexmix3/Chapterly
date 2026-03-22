export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/** GET /api/export — download user's full library as CSV */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all shelf books with book metadata
  const { data: userBooks, error } = await supabase
    .from('user_books')
    .select('*, book:books(title, authors, published_year, page_count, isbn13, subjects)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch all reading sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, book:books(title)')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: true });

  // ── Build shelf CSV ─────────────────────────────────────────────────────────
  const shelfHeaders = [
    'Title', 'Authors', 'ISBN13', 'Status', 'Rating', 'Started', 'Finished',
    'Current Page', 'Page Count', 'Published Year', 'Genres', 'Review', 'Added',
  ];

  const shelfRows = (userBooks ?? []).map((ub) => {
    const book = ub.book as {
      title?: string; authors?: string[]; isbn13?: string | null;
      page_count?: number | null; published_year?: number | null;
      subjects?: string[];
    } | null;
    return [
      book?.title ?? '',
      (book?.authors ?? []).join('; '),
      book?.isbn13 ?? '',
      ub.status,
      ub.rating ?? '',
      ub.started_at ? ub.started_at.slice(0, 10) : '',
      ub.finished_at ? ub.finished_at.slice(0, 10) : '',
      ub.current_page ?? '',
      book?.page_count ?? '',
      book?.published_year ?? '',
      (book?.subjects ?? []).slice(0, 5).join('; '),
      (ub.review_text ?? '').replace(/"/g, '""'),
      ub.created_at.slice(0, 10),
    ].map(v => `"${v}"`).join(',');
  });

  // ── Build sessions CSV ──────────────────────────────────────────────────────
  const sessionHeaders = [
    'Date', 'Book', 'Pages Read', 'Minutes', 'Start Page', 'End Page', 'Notes',
  ];

  const sessionRows = (sessions ?? []).map((s) => {
    const book = s.book as { title?: string } | null;
    return [
      s.logged_at ? s.logged_at.slice(0, 10) : '',
      book?.title ?? '',
      s.pages_read ?? s.pages_delta ?? '',
      s.minutes_delta ?? '',
      s.pages_start ?? '',
      s.pages_end ?? '',
      (s.notes ?? '').replace(/"/g, '""'),
    ].map(v => `"${v}"`).join(',');
  });

  // Combine into one CSV with two sections
  const csv = [
    '# CHAPTERLY EXPORT',
    `# Generated: ${new Date().toISOString()}`,
    '',
    '## MY LIBRARY',
    shelfHeaders.join(','),
    ...shelfRows,
    '',
    '## READING SESSIONS',
    sessionHeaders.join(','),
    ...sessionRows,
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chapterly-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
