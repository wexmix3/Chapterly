export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// One-time endpoint to populate subjects for all books on the user's shelf.
// Hit GET /api/admin/backfill-subjects while logged in.
// Safe to call multiple times — only fetches books that still lack subjects.

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shelf } = await supabase
    .from('user_books')
    .select('books(id, source, source_id, subjects)')
    .eq('user_id', user.id);

  if (!shelf || shelf.length === 0) {
    return NextResponse.json({ message: 'No books on shelf', filled: 0, skipped: 0 });
  }

  type BookRow = { id: string; source: string; source_id: string; subjects: string[] | null };

  const seenIds = new Set<string>();
  const needsSubjects = shelf
    .map(r => r.books as unknown as BookRow | null)
    .filter((b): b is BookRow => !!b && !b.subjects?.length && !!b.source && !!b.source_id)
    .filter(b => { if (seenIds.has(b.id)) return false; seenIds.add(b.id); return true; });

  const results = await Promise.allSettled(needsSubjects.map(async (book) => {
    let subjects: string[] = [];
    if (book.source === 'openlibrary') {
      const res = await fetch(`https://openlibrary.org/works/${book.source_id}.json`);
      if (res.ok) { const d = await res.json(); subjects = (d.subjects ?? []).slice(0, 10); }
    } else if (book.source === 'googlebooks') {
      const kp = process.env.GOOGLE_BOOKS_API_KEY ? `?key=${process.env.GOOGLE_BOOKS_API_KEY}` : '';
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${book.source_id}${kp}`);
      if (res.ok) { const d = await res.json(); subjects = (d.volumeInfo?.categories ?? []).slice(0, 10); }
    }
    if (subjects.length > 0) {
      await supabase.from('books').update({ subjects }).eq('id', book.id);
      return { id: book.id, subjects };
    }
    return { id: book.id, subjects: [] };
  }));

  const filled = results.filter(r => r.status === 'fulfilled' && (r.value as { subjects: string[] }).subjects.length > 0).length;
  const skipped = needsSubjects.length - filled;
  const alreadyHad = shelf.length - seenIds.size;

  return NextResponse.json({
    message: `Done. ${filled} books backfilled, ${skipped} had no subjects available, ${alreadyHad} already had subjects.`,
    filled,
    skipped,
    already_had: alreadyHad,
  });
}
