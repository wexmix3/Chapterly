export const dynamic = 'force-dynamic';

/**
 * GET /api/series?book_id=<uuid>
 * Returns series info for a book if it belongs to a series in our DB,
 * or falls back to querying Open Library for series data.
 *
 * POST /api/series  { series_name, description?, books: [{ book_id, position }] }
 * Admin-only: seed a series. Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface OLSeriesDoc {
  key: string;
  title: string;
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookId = req.nextUrl.searchParams.get('book_id');
  const title = req.nextUrl.searchParams.get('title');
  const author = req.nextUrl.searchParams.get('author');

  if (!bookId && !title) {
    return NextResponse.json({ error: 'book_id or title is required' }, { status: 400 });
  }

  // 1. Check local DB for series membership
  if (bookId) {
    const { data: seriesBook } = await supabase
      .from('series_books')
      .select('position, series:book_series(id, name, description)')
      .eq('book_id', bookId)
      .maybeSingle();

    if (seriesBook?.series) {
      const series = seriesBook.series as unknown as { id: string; name: string; description: string | null };
      // Get all books in this series
      const { data: seriesMembers } = await supabase
        .from('series_books')
        .select('position, book:books(id, title, cover_url, authors)')
        .eq('series_id', series.id)
        .order('position', { ascending: true });

      return NextResponse.json({
        data: {
          source: 'local',
          series_name: series.name,
          description: series.description,
          current_position: seriesBook.position,
          total_books: seriesMembers?.length ?? 0,
          books: seriesMembers?.map(m => ({
            position: m.position,
            ...(m.book as object),
          })) ?? [],
        },
      });
    }
  }

  // 2. Fall back to Open Library series search
  if (title) {
    try {
      const searchQ = author ? `${title} ${author}` : title;
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQ)}&fields=key,title,first_sentence,series&limit=3`,
        { next: { revalidate: 3600 } }
      );
      if (olRes.ok) {
        const olData = await olRes.json();
        const doc = (olData.docs as Array<{ series?: string[]; title: string; key: string }>)?.[0];
        const seriesNames = doc?.series ?? [];

        if (seriesNames.length > 0) {
          return NextResponse.json({
            data: {
              source: 'openlibrary',
              series_name: seriesNames[0],
              description: null,
              current_position: null,
              total_books: null,
              books: [],
            },
          });
        }
      }
    } catch {
      // Non-fatal — return null series
    }
  }

  return NextResponse.json({ data: null });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const body = await req.json() as {
    series_name: string;
    description?: string;
    books: Array<{ book_id: string; position: number }>;
  };

  const { data: series, error: seriesErr } = await supabase
    .from('book_series')
    .insert({ name: body.series_name, description: body.description ?? null })
    .select('id')
    .maybeSingle();

  if (seriesErr || !series) {
    return NextResponse.json({ error: seriesErr?.message ?? 'Failed to create series' }, { status: 500 });
  }

  const { error: booksErr } = await supabase
    .from('series_books')
    .insert(body.books.map(b => ({ series_id: series.id, book_id: b.book_id, position: b.position })));

  if (booksErr) return NextResponse.json({ error: booksErr.message }, { status: 500 });
  return NextResponse.json({ data: { series_id: series.id } }, { status: 201 });
}
