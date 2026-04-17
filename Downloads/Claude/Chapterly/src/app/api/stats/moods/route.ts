export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/moods
 * Returns mood tag distribution across read books for the authenticated user.
 * { data: Array<{ mood: string; count: number }> }
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // unnest mood_tags array column, count occurrences across read books
  const { data, error } = await supabase.rpc('get_mood_distribution', {
    p_user_id: session.user.id,
  });

  if (error) {
    // Fallback: manual query if RPC doesn't exist
    const { data: rows, error: fallbackError } = await supabase
      .from('user_books')
      .select('mood_tags')
      .eq('user_id', session.user.id)
      .eq('status', 'read')
      .not('mood_tags', 'eq', '{}');

    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });

    const counts: Record<string, number> = {};
    for (const row of rows ?? []) {
      for (const mood of row.mood_tags ?? []) {
        if (mood) counts[mood] = (counts[mood] ?? 0) + 1;
      }
    }

    const result = Object.entries(counts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: result });
  }

  return NextResponse.json({ data: data ?? [] });
}
