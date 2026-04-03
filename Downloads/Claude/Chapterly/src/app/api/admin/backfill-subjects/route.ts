export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// One-time endpoint to populate subjects for all books on the user's shelf.
// Hit GET /api/admin/backfill-subjects while logged in.
// Safe to call multiple times — only fetches books that still lack subjects.
// Strategy: try direct ID lookup first, then fall back to title+author search.

type BookRow = { id: string; source: string; source_id: string; title: string; authors: string[]; subjects: string[] | null };

async function fetchSubjectsBySearch(title: string, authors: string[], apiKey: string | undefined): Promise<string[]> {
  const q = encodeURIComponent(`intitle:${title}${authors[0] ? ` inauthor:${authors[0]}` : ''}`);
  const kp = apiKey ? `&key=${apiKey}` : '';
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${kp}`);
  if (!res.ok) return [];
  const d = await res.json();
  return (d.items?.[0]?.volumeInfo?.categories ?? []).slice(0, 10);
}

async function fetchSubjects(book: BookRow, apiKey: string | undefined): Promise<string[]> {
  let subjects: string[] = [];

  // 1. Try direct lookup
  if (book.source === 'openlibrary') {
    try {
      const res = await fetch(`https://openlibrary.org/works/${book.source_id}.json`);
      if (res.ok) {
        const d = await res.json();
        subjects = (d.subjects ?? []).slice(0, 10);
      }
    } catch { /* skip */ }
  } else if (book.source === 'googlebooks') {
    try {
      const kp = apiKey ? `?key=${apiKey}` : '';
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${book.source_id}${kp}`);
      if (res.ok) {
        const d = await res.json();
        subjects = (d.volumeInfo?.categories ?? []).slice(0, 10);
      }
    } catch { /* skip */ }
  }

  // 2. Fall back to Google Books title+author search if direct lookup returned nothing
  if (subjects.length === 0 && book.title) {
    try {
      subjects = await fetchSubjectsBySearch(book.title, book.authors ?? [], apiKey);
    } catch { /* skip */ }
  }

  return subjects;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shelf } = await supabase
    .from('user_books')
    .select('books(id, source, source_id, title, authors, subjects)')
    .eq('user_id', user.id);

  if (!shelf || shelf.length === 0) {
    return NextResponse.json({ message: 'No books on shelf', filled: 0, skipped: 0 });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  const seenIds = new Set<string>();
  const needsSubjects = shelf
    .map(r => r.books as unknown as BookRow | null)
    .filter((b): b is BookRow => !!b && !b.subjects?.length)
    .filter(b => { if (seenIds.has(b.id)) return false; seenIds.add(b.id); return true; });

  // Process in batches of 5 to avoid hammering APIs
  let filled = 0;
  for (let i = 0; i < needsSubjects.length; i += 5) {
    const batch = needsSubjects.slice(i, i + 5);
    await Promise.allSettled(batch.map(async (book) => {
      const subjects = await fetchSubjects(book, apiKey);
      if (subjects.length > 0) {
        await supabase.from('books').update({ subjects }).eq('id', book.id);
        filled++;
      }
    }));
  }

  const skipped = needsSubjects.length - filled;
  const alreadyHad = shelf.length - seenIds.size;

  return NextResponse.json({
    message: `Done. ${filled} books backfilled, ${skipped} had no subjects available, ${alreadyHad} already had subjects.`,
    filled,
    skipped,
    already_had: alreadyHad,
  });
}
