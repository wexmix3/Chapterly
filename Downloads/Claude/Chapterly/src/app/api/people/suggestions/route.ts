export const dynamic = 'force-dynamic';

/**
 * GET /api/people/suggestions
 * Returns "readers like you" suggestions: users who have read books
 * overlapping with the current user's shelf, excluding already-followed.
 * Falls back to newest public users when overlaps are sparse.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get who the user already follows
  const { data: following } = await supabase
    .from('social_follow')
    .select('followee_id')
    .eq('follower_id', user.id);

  const followingIds = new Set((following ?? []).map(f => f.followee_id));
  followingIds.add(user.id); // exclude self

  let suggestions: Array<{ id: string; handle: string; display_name: string; avatar_url: string | null; overlap: number }> = [];

  // Phase 1: book-overlap suggestions
  const { data: myBooks } = await supabase
    .from('user_books')
    .select('book_id')
    .eq('user_id', user.id);

  const myBookIds = (myBooks ?? []).map(b => b.book_id);

  if (myBookIds.length >= 2) {
    const { data: overlappingReaders } = await supabase
      .from('user_books')
      .select('user_id, book_id')
      .in('book_id', myBookIds.slice(0, 50))
      .neq('user_id', user.id)
      .eq('visibility', 'public');

    const overlapMap: Record<string, number> = {};
    for (const row of overlappingReaders ?? []) {
      if (!followingIds.has(row.user_id)) {
        overlapMap[row.user_id] = (overlapMap[row.user_id] ?? 0) + 1;
      }
    }

    const topUserIds = Object.entries(overlapMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, overlap]) => ({ id, overlap }));

    if (topUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, handle, display_name, avatar_url')
        .in('id', topUserIds.map(u => u.id))
        .eq('is_public', true);

      const overlapById = Object.fromEntries(topUserIds.map(u => [u.id, u.overlap]));
      suggestions = (profiles ?? []).map(p => ({ ...p, overlap: overlapById[p.id] ?? 0 }));
    }
  }

  // Phase 2: fallback — newest public users not yet followed
  if (suggestions.length < 5) {
    const existingIds = new Set(suggestions.map(s => s.id));
    const excludeIds = [...followingIds].filter(id => id !== user.id);
    // Build the exclude list: following + already in suggestions
    const allExclude = [...new Set([...excludeIds, ...existingIds, user.id])];

    const { data: profiles } = await supabase
      .from('users')
      .select('id, handle, display_name, avatar_url')
      .eq('is_public', true)
      .neq('id', user.id)
      .order('id', { ascending: false })
      .limit(20);

    for (const p of profiles ?? []) {
      if (!allExclude.includes(p.id) && !existingIds.has(p.id)) {
        suggestions.push({ ...p, overlap: 0 });
      }
    }
  }

  return NextResponse.json({ data: suggestions.slice(0, 10) });
}
