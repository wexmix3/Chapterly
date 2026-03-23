export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/discover/trending
// Returns top 10 most-added books in the last 7 days, no auth required.
export async function GET() {
  const supabase = createServerSupabaseClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Count distinct user_ids per book added in the last 7 days
  const { data, error } = await supabase
    .from('user_books')
    .select('book_id, books(id, title, authors, cover_url)')
    .gte('created_at', since)
    .not('book_id', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Aggregate counts per book_id client-side (Supabase doesn't support GROUP BY via JS client)
  const counts: Record<string, { count: number; book: unknown }> = {};
  for (const row of data) {
    const id = row.book_id as string;
    if (!id) continue;
    if (!counts[id]) {
      counts[id] = { count: 0, book: row.books };
    }
    counts[id].count += 1;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([book_id, { count, book }]) => ({ book_id, count, book }));

  return NextResponse.json({ data: sorted });
}
