export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createMessageWithRetry } from '@/lib/ai-retry';

// One-time endpoint to populate subjects for all books on the user's shelf.
// Hit GET /api/admin/backfill-subjects while logged in.
// Safe to call multiple times — only processes books that still lack subjects.
// Uses Claude Haiku to classify genres when external API lookups fail.

type BookRow = { id: string; source: string; source_id: string; title: string; authors: string[]; subjects: string[] | null };

// Classify a batch of books into genres using Claude Haiku
async function classifyGenres(
  books: { id: string; title: string; authors: string[] }[],
  anthropic: Anthropic
): Promise<Record<string, string[]>> {
  const list = books.map((b, i) =>
    `${i + 1}. "${b.title}" by ${b.authors?.join(', ') || 'Unknown'}`
  ).join('\n');

  const msg = await createMessageWithRetry(anthropic, {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'You are a book genre classifier. Return only valid JSON, no markdown.',
    messages: [{
      role: 'user',
      content: `Classify each book into 1-3 genres from this list: Fiction, Literary Fiction, Historical Fiction, Fantasy, Science Fiction, Mystery, Thriller, Romance, Horror, Nonfiction, Biography, Memoir, History, Science, Self-Help, Business, Philosophy, Psychology, Essays, Poetry, Graphic Novel, Young Adult, Children's.

Books:
${list}

Return JSON: {"results": [{"id": "book_id", "genres": ["Genre1", "Genre2"]}, ...]}
Use the exact book position number as id.`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text;
  const match = raw.match(/\{[\s\S]*"results"[\s\S]*\}/);
  if (!match) return {};

  const parsed = JSON.parse(match[0]) as { results: { id: string; genres: string[] }[] };
  const out: Record<string, string[]> = {};
  for (const r of parsed.results) {
    const idx = parseInt(r.id) - 1;
    if (books[idx]) out[books[idx].id] = r.genres;
  }
  return out;
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

  const seenIds = new Set<string>();
  const needsSubjects = shelf
    .map(r => r.books as unknown as BookRow | null)
    .filter((b): b is BookRow => !!b && !b.subjects?.length && !!b.title)
    .filter(b => { if (seenIds.has(b.id)) return false; seenIds.add(b.id); return true; });

  const alreadyHad = shelf.length - seenIds.size;

  if (needsSubjects.length === 0) {
    return NextResponse.json({ message: 'All books already have subjects.', filled: 0, skipped: 0, already_had: alreadyHad });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let filled = 0;

  // Batch 10 books per Claude call
  for (let i = 0; i < needsSubjects.length; i += 10) {
    const batch = needsSubjects.slice(i, i + 10);
    try {
      const genreMap = await classifyGenres(
        batch.map(b => ({ id: b.id, title: b.title, authors: b.authors ?? [] })),
        anthropic
      );
      await Promise.allSettled(
        Object.entries(genreMap).map(async ([bookId, genres]) => {
          if (genres.length > 0) {
            await supabase.from('books').update({ subjects: genres }).eq('id', bookId);
            filled++;
          }
        })
      );
    } catch { /* skip batch on error */ }
  }

  const skipped = needsSubjects.length - filled;

  return NextResponse.json({
    message: `Done. ${filled} books classified, ${skipped} failed, ${alreadyHad} already had subjects.`,
    filled,
    skipped,
    already_had: alreadyHad,
  });
}
