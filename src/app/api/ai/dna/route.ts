export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/dna
 * Returns a "Reading DNA" analysis: top genres, themes, and author patterns.
 * Uses Claude if API key is available, otherwise computes from data.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

interface GenreSlice {
  genre: string;
  pct: number;
  count: number;
}

interface DNAResult {
  top_genres: GenreSlice[];
  themes: string[];
  author_patterns: string;
  summary: string;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all read/reading books with ratings and subjects
  const { data: shelf } = await supabase
    .from('user_books')
    .select('status, rating, book:books(title, authors, subjects)')
    .eq('user_id', user.id)
    .in('status', ['read', 'reading', 'dnf']);

  type ShelfBook = {
    status: string;
    rating?: number | null;
    book?: { title?: string; authors?: string[]; subjects?: string[] } | null;
  };

  const books = (shelf ?? []) as ShelfBook[];

  if (books.length === 0) {
    return NextResponse.json({
      top_genres: [],
      themes: [],
      author_patterns: 'Add some books to your shelf to unlock your Reading DNA.',
      summary: 'Your reading DNA builds as you log more books.',
    } satisfies DNAResult);
  }

  // Compute genre distribution from subjects
  const genreCounts: Record<string, number> = {};
  for (const ub of books) {
    for (const subject of ub.book?.subjects ?? []) {
      // Only count top-level genre-like subjects (cap at 3 per book to avoid noise)
      genreCounts[subject] = (genreCounts[subject] ?? 0) + 1;
    }
  }

  const totalGenreHits = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  const topGenres: GenreSlice[] = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({
      genre,
      count,
      pct: totalGenreHits > 0 ? Math.round((count / totalGenreHits) * 100) : 0,
    }));

  // Normalize percentages to sum to 100 for top 3
  const top3 = topGenres.slice(0, 3);
  const top3Total = top3.reduce((s, g) => s + g.count, 0);
  const normalizedTop3: GenreSlice[] = top3.map(g => ({
    ...g,
    pct: top3Total > 0 ? Math.round((g.count / top3Total) * 100) : 0,
  }));

  // Collect book titles and authors for Claude
  const readBooks = books.filter(b => b.status === 'read');
  const topRatedTitles = books
    .filter(b => (b.rating ?? 0) >= 4)
    .slice(0, 8)
    .map(b => `"${b.book?.title}" by ${b.book?.authors?.[0] ?? 'Unknown'}`);

  const allTitles = books.slice(0, 20).map(b => `"${b.book?.title}" by ${b.book?.authors?.[0] ?? 'Unknown'}`);

  // Computed fallback
  function computedDNA(): DNAResult {
    const topGenreName = topGenres[0]?.genre ?? 'varied genres';
    const genreList = normalizedTop3.map(g => g.genre).join(', ');

    return {
      top_genres: normalizedTop3.length > 0 ? normalizedTop3 : topGenres.slice(0, 3),
      themes: topGenres.slice(0, 5).map(g => g.genre),
      author_patterns: books.length < 5
        ? 'Read more books to see patterns in the authors you love.'
        : `You gravitate toward ${topGenreName} and have read ${readBooks.length} books.`,
      summary: books.length < 3
        ? 'Keep reading to build your DNA profile.'
        : `Your shelf spans ${topGenres.length} genres with a focus on ${genreList}.`,
    };
  }

  if (!process.env.ANTHROPIC_API_KEY || books.length < 3) {
    return NextResponse.json(computedDNA());
  }

  const prompt = `You are a literary analyst identifying reading patterns. Analyze this reader's book collection and identify themes and author patterns.

THEIR BOOKS (${books.length} total on shelf, ${readBooks.length} read):
Top-rated (4★+): ${topRatedTitles.slice(0, 6).join(', ') || 'none rated yet'}
Books read: ${allTitles.slice(0, 12).join(', ')}
Top genres from metadata: ${topGenres.slice(0, 4).map(g => g.genre).join(', ')}

Return ONLY valid JSON, no markdown.
{
  "themes": ["theme 1", "theme 2", "theme 3", "theme 4", "theme 5"],
  "author_patterns": "One sentence about patterns in the kinds of authors they read (writing style, nationality, era, themes they explore)",
  "summary": "One sentence summarizing their reading DNA — specific, warm, insightful"
}`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text) as { themes: string[]; author_patterns: string; summary: string };

    return NextResponse.json({
      top_genres: normalizedTop3.length > 0 ? normalizedTop3 : topGenres.slice(0, 3),
      themes: parsed.themes ?? [],
      author_patterns: parsed.author_patterns ?? '',
      summary: parsed.summary ?? '',
    } satisfies DNAResult);
  } catch (err) {
    console.error('[ai/dna] Claude API failed, using computed fallback:', err);
    return NextResponse.json(computedDNA());
  }
}
