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

  // Fetch user profile (for onboarding genre prefs) and shelf books in parallel
  const [userBooksResult, profileResult] = await Promise.all([
    supabase.from('user_books').select('book:books(subjects, source_id)').eq('user_id', user.id),
    supabase.from('users').select('genres').eq('id', user.id).maybeSingle(),
  ]);

  const shelvedSourceIds = new Set<string>();
  const genreCounts: Record<string, number> = {};

  for (const ub of userBooksResult.data ?? []) {
    const book = ub.book as { subjects?: string[]; source_id?: string } | null;
    if (book?.source_id) shelvedSourceIds.add(book.source_id);
    for (const s of book?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }

  // Derive top genres from shelf subjects
  const shelfTopGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // Fall back to onboarding genre preferences when shelf is sparse
  const onboardingGenres: string[] = (profileResult.data as { genres?: string[] } | null)?.genres ?? [];

  // Merge: shelf-derived genres take priority; fill remainder with onboarding prefs
  const topGenresSet = new Set<string>(shelfTopGenres);
  for (const g of onboardingGenres) {
    if (topGenresSet.size >= 3) break;
    topGenresSet.add(g);
  }
  const topGenres = [...topGenresSet];

  if (topGenres.length === 0) {
    return NextResponse.json({ data: [], userGenres: onboardingGenres });
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

  return NextResponse.json({ data: recommendations, userGenres: onboardingGenres });
}
