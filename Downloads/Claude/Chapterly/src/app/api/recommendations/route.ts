export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { searchGoogleBooks } from '@/lib/books';
import type { BookSearchResult } from '@/types';

export interface RecommendedBook extends BookSearchResult {
  genre: string;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userBooks } = await supabase
    .from('user_books')
    .select('book:books(subjects, source_id)')
    .eq('user_id', user.id);

  const shelvedSourceIds = new Set<string>();
  const genreCounts: Record<string, number> = {};

  for (const ub of userBooks ?? []) {
    const book = ub.book as { subjects?: string[]; source_id?: string } | null;
    if (book?.source_id) shelvedSourceIds.add(book.source_id);
    for (const s of book?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  if (topGenres.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const genreResults = await Promise.allSettled(
    topGenres.map(async (genre) => {
      const results = await searchGoogleBooks(`subject:${genre}`);
      return { genre, results };
    })
  );

  const seen = new Set<string>();
  const recommendations: RecommendedBook[] = [];

  for (const settled of genreResults) {
    if (settled.status !== 'fulfilled') continue;
    const { genre, results } = settled.value;
    for (const book of results) {
      if (!book.source_id || seen.has(book.source_id)) continue;
      if (shelvedSourceIds.has(book.source_id)) continue;
      seen.add(book.source_id);
      recommendations.push({ ...book, genre });
      if (recommendations.length >= 12) break;
    }
    if (recommendations.length >= 12) break;
  }

  return NextResponse.json({ data: recommendations });
}
