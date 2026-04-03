export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { searchGoogleBooks } from '@/lib/books';

interface ParsedBook {
  title: string;
  author: string;
  isbn13?: string;
  rating?: number; // 0 = unrated, 1-5 = rated
  status: 'read' | 'to_read' | 'reading';
  date_read?: string; // YYYY/MM/DD
  page_count?: number;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { books } = await request.json() as { books: ParsedBook[] };
  if (!Array.isArray(books) || books.length === 0) {
    return NextResponse.json({ error: 'No books provided' }, { status: 400 });
  }

  // Cap at 500 books per import
  const toImport = books.slice(0, 500);
  let imported = 0;
  let skipped = 0;

  for (const parsed of toImport) {
    try {
      // 1. Find or create the book record
      let bookId: string | null = null;

      // Try to find by ISBN13 first
      if (parsed.isbn13 && parsed.isbn13.length === 13) {
        const { data: existing } = await supabase
          .from('books')
          .select('id')
          .eq('isbn13', parsed.isbn13)
          .maybeSingle();
        if (existing) bookId = existing.id;
      }

      // Try to find by title+author
      if (!bookId) {
        const { data: byTitle } = await supabase
          .from('books')
          .select('id')
          .ilike('title', parsed.title.trim())
          .limit(1)
          .maybeSingle();
        if (byTitle) bookId = byTitle.id;
      }

      // Fetch from Google Books and create if not found
      if (!bookId) {
        const query = parsed.isbn13
          ? `isbn:${parsed.isbn13}`
          : `${parsed.title} ${parsed.author}`;
        const results = await searchGoogleBooks(query);
        const match = results[0];

        if (match) {
          // Upsert by source+source_id
          const { data: created, error: insErr } = await supabase
            .from('books')
            .upsert({
              source: match.source,
              source_id: match.source_id,
              isbn10: match.isbn10 ?? null,
              isbn13: match.isbn13 ?? parsed.isbn13 ?? null,
              title: match.title,
              authors: match.authors,
              cover_url: match.cover_url ?? null,
              page_count: match.page_count ?? parsed.page_count ?? null,
              subjects: match.subjects ?? [],
            }, { onConflict: 'source,source_id' })
            .select('id')
            .single();
          if (!insErr && created) bookId = created.id;
        } else {
          // Create a minimal book record from Goodreads data
          const { data: minimal, error: minErr } = await supabase
            .from('books')
            .upsert({
              source: 'goodreads' as const,
              source_id: `gr_${parsed.isbn13 ?? `${Date.now()}_${Math.random()}`}`,
              isbn13: parsed.isbn13 ?? null,
              title: parsed.title.trim(),
              authors: [parsed.author.trim()],
              page_count: parsed.page_count ?? null,
              cover_url: null,
              subjects: [],
            }, { onConflict: 'source,source_id' })
            .select('id')
            .single();
          if (!minErr && minimal) bookId = minimal.id;
        }
      }

      if (!bookId) { skipped++; continue; }

      // 2. Check if user_book already exists
      const { data: ub } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();

      if (ub) { skipped++; continue; }

      // 3. Create user_book
      const now = new Date().toISOString();
      let finishedAt: string | null = null;
      if (parsed.date_read) {
        const d = new Date(parsed.date_read.replace(/\//g, '-'));
        if (!isNaN(d.getTime())) finishedAt = d.toISOString();
      }

      const { error: ubErr } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status: parsed.status,
          rating: parsed.rating && parsed.rating > 0 ? parsed.rating : null,
          started_at: parsed.status === 'reading' ? now : null,
          finished_at: parsed.status === 'read' ? (finishedAt ?? now) : null,
          visibility: 'public',
        });

      if (ubErr) { skipped++; continue; }
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped });
}
