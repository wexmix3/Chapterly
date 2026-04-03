export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';
import { createMessageWithRetry } from '@/lib/ai-retry';

export interface GenreBreakdown {
  genre: string;
  count: number;
}

type BookWithSubjects = { id: string; title: string; authors: string[]; subjects: string[] | null };

// Classify up to 10 books via Claude Haiku and persist via admin client (bypasses RLS)
async function backfillBatch(books: BookWithSubjects[]): Promise<void> {
  if (books.length === 0) return;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const adminSupabase = createAdminSupabaseClient();

  const list = books.map((b, i) =>
    `${i + 1}. "${b.title}" by ${(b.authors ?? []).join(', ') || 'Unknown'}`
  ).join('\n');

  try {
    const msg = await createMessageWithRetry(anthropic, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are a book genre classifier. Return only valid JSON, no markdown.',
      messages: [{
        role: 'user',
        content: `Classify each book into 1-3 genres from: Fiction, Literary Fiction, Historical Fiction, Fantasy, Science Fiction, Mystery, Thriller, Romance, Horror, Nonfiction, Biography, Memoir, History, Science, Self-Help, Business, Philosophy, Psychology, Essays, Poetry, Young Adult.

Books:
${list}

Return JSON: {"results": [{"id": "1", "genres": ["Genre"]}, ...]}`,
      }],
    });

    const raw = (msg.content[0] as { text: string }).text;
    const match = raw.match(/\{[\s\S]*"results"[\s\S]*\}/);
    if (!match) return;

    const parsed = JSON.parse(match[0]) as { results: { id: string; genres: string[] }[] };
    await Promise.allSettled(parsed.results.map(async (r) => {
      const idx = parseInt(r.id) - 1;
      const book = books[idx];
      if (book && r.genres?.length > 0) {
        await adminSupabase.from('books').update({ subjects: r.genres }).eq('id', book.id);
        // Update in-memory so this request can return genres without a second DB call
        book.subjects = r.genres;
      }
    }));
  } catch { /* skip on error */ }
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all read books with their subjects
  const { data: rows } = await supabase
    .from('user_books')
    .select('book:books(id, title, authors, subjects)')
    .eq('user_id', user.id)
    .eq('status', 'read');

  if (!rows || rows.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const books = rows
    .map(r => r.book as unknown as BookWithSubjects | null)
    .filter((b): b is BookWithSubjects => !!b);

  // Backfill up to 10 books that lack subjects (keeps request under Vercel 10s timeout)
  const needsBackfill = books.filter(b => !b.subjects?.length).slice(0, 10);
  if (needsBackfill.length > 0) {
    await backfillBatch(needsBackfill);
  }

  // Compute genre counts from all books (including newly backfilled ones)
  const genreCount: Record<string, number> = {};
  for (const book of books) {
    for (const s of (book.subjects ?? []).slice(0, 3)) {
      const g = s.trim();
      if (g) genreCount[g] = (genreCount[g] ?? 0) + 1;
    }
  }

  const breakdown: GenreBreakdown[] = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genre, count]) => ({ genre, count }));

  return NextResponse.json({ data: breakdown });
}
