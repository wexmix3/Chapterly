export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface GenreBreakdown {
  genre: string;
  count: number;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rows } = await supabase
    .from('user_books')
    .select('status, books(subjects)')
    .eq('user_id', user.id)
    .eq('status', 'read');

  if (!rows || rows.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const genreCount: Record<string, number> = {};
  for (const row of rows) {
    const subjects = ((row.books as unknown as { subjects: string[] | null } | null)?.subjects ?? []);
    for (const s of subjects.slice(0, 3)) {
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
