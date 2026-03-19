export const dynamic = 'force-dynamic';

/**
 * GET /api/people/suggestions
 * Returns "readers like you" suggestions: users who have read books
 * overlapping with the current user's shelf, excluding already-followed.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get current user's book IDs
  const { data: myBooks } = await supabase
    .from('user_books')
    .select('book_id')
    .eq('user_id', user.id);

  const myBookIds = (myBooks ?? []).map(b => b.book_id);

  // Get who the user already follows
  const { data: following } = await supabase
    .from('social_follow')
    .select('followee_id')
    .eq('follower_id', user.id);

  const followingIds = new Set((following ?? []).map(f => f.followee_id));
  followingIds.add(user.id); // exclude self

  let suggestions: Array<{ id: string; handle: string; display_name: string; avatar_url: string | null; overlap: number }> = [];

  if (myBookIds.length >= 2) {
    // Find users who read overlapping books
    const { data: overlappingReaders } = await supabase
      .from('user_books')
      .select('user_id, book_id')
      .in('book_id', myBookIds.slice(0, 50)) // cap at 50 books for perf
      .neq('user_id', user.id)
      .eq('visibility', 'public');

    // Count overlap per user
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

  // Fallback: most-followed public users (if suggestions are sparse)
  if (suggestions.length < 5) {
    const { data: popular } = await supabase
      .from('social_follow')
      .select('followee_id')
      .not('followee_id', 'in', `(${[...followingIds].join(',') || 'null'})`)
      .limit(100);

    const counts: Record<string, number> = {};
    for (const row of popular ?? []) {
      counts[row.followee_id] = (counts[row.followee_id] ?? 0) + 1;
    }

    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)
      .filter(id => !suggestions.some(s => s.id === id));

    if (topIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, handle, display_name, avatar_url')
        .in('id', topIds)
        .eq('is_public', true);

      for (const p of profiles ?? []) {
        suggestions.push({ ...p, overlap: 0 });
      }
    }
  }

  return NextResponse.json({ data: suggestions.slice(0, 10) });
}
