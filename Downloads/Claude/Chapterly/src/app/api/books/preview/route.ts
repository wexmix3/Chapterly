export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function fetchOLDescription(workId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://openlibrary.org/works/${workId}.json`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.description === 'string') return data.description;
    if (data.description?.value) return data.description.value as string;
    return null;
  } catch { return null; }
}

async function fetchWorkIdFromISBN(isbn: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[`ISBN:${isbn}`];
    return entry?.details?.works?.[0]?.key?.replace('/works/', '') ?? null;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = request.nextUrl.searchParams;
  const isbn  = p.get('isbn');
  const source  = p.get('source');
  const sourceId = p.get('id');
  const title  = p.get('title') ?? '';
  const author  = p.get('author') ?? '';

  // 1. Try to find the book in Chapterly DB
  let book: Record<string, unknown> | null = null;
  if (isbn) {
    const { data } = await supabase.from('books').select('*')
      .or(`isbn13.eq.${isbn},isbn10.eq.${isbn}`).maybeSingle();
    book = data;
  } else if (source && sourceId) {
    const { data } = await supabase.from('books').select('*')
      .eq('source', source).eq('source_id', sourceId).maybeSingle();
    book = data;
  }

  // 2. Fetch description from Open Library
  let description: string | null = null;
  let resolvedWorkId: string | null = null;

  if (isbn) {
    resolvedWorkId = await fetchWorkIdFromISBN(isbn);
    if (resolvedWorkId) description = await fetchOLDescription(resolvedWorkId);
  } else if (source === 'openlibrary' && sourceId) {
    resolvedWorkId = sourceId;
    description = await fetchOLDescription(sourceId);
  }

  // 3. Build a minimal book object from params if not in DB
  if (!book) {
    book = {
      id: null,
      source: source ?? 'openlibrary',
      source_id: resolvedWorkId ?? sourceId ?? isbn ?? '',
      isbn13: isbn && isbn.length === 13 ? isbn : null,
      isbn10: isbn && isbn.length === 10 ? isbn : null,
      title,
      authors: author ? [author] : [],
      cover_url: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null,
      page_count: null,
      published_year: null,
    };
  }

  // 4. Check if user has this on their shelf
  let userBook: { id: string; status: string } | null = null;
  if (book.id) {
    const { data } = await supabase.from('user_books')
      .select('id, status').eq('user_id', user.id).eq('book_id', book.id).maybeSingle();
    userBook = data;
  }

  // 5. Community reviews (only if book exists in DB)
  let reviews: unknown[] = [];
  if (book.id) {
    const { data } = await supabase.from('reviews')
      .select('id, rating, text, mood_tags, created_at, users(display_name, avatar_url)')
      .eq('book_id', book.id)
      .order('created_at', { ascending: false })
      .limit(20);
    reviews = data ?? [];
  }

  return NextResponse.json({ book, description, reviews, userBook });
}
