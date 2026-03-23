export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: { handle: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const viewerId = session?.user?.id ?? null;

  const handle = params.handle.toLowerCase();

  // Fetch the profile
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, handle, display_name, avatar_url, bio, is_public, created_at, is_creator, creator_platform, creator_handle')
    .eq('handle', handle)
    .maybeSingle();

  if (error || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Private profiles: only visible to the owner
  if (!profile.is_public && profile.id !== viewerId) {
    return NextResponse.json({ error: 'This profile is private' }, { status: 403 });
  }

  // Follower/following counts
  const [{ count: followers_count }, { count: following_count }] = await Promise.all([
    supabase.from('social_follow').select('*', { count: 'exact', head: true }).eq('followee_id', profile.id),
    supabase.from('social_follow').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
  ]);

  // Books read + currently reading
  const { data: shelf } = await supabase
    .from('user_books')
    .select('status, rating, book:books(id, title, authors, cover_url, page_count)')
    .eq('user_id', profile.id)
    .in('visibility', ['public'])
    .order('updated_at', { ascending: false });

  const books_read = (shelf ?? []).filter((b) => b.status === 'read');
  const currently_reading = (shelf ?? []).filter((b) => b.status === 'reading').slice(0, 3);
  const want_to_read_count = (shelf ?? []).filter((b) => b.status === 'to_read').length;

  // Recent reviews (public only)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, text, mood_tags, contains_spoilers, created_at, book:books(id, title, authors, cover_url)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(6);

  // Is the viewer following this profile?
  let is_following = false;
  if (viewerId && viewerId !== profile.id) {
    const { data: follow } = await supabase
      .from('social_follow')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('followee_id', profile.id)
      .maybeSingle();
    is_following = !!follow;
  }

  // Stats: total pages, avg rating
  const { data: statsRows } = await supabase
    .from('stats_daily')
    .select('pages')
    .eq('user_id', profile.id);

  const total_pages = (statsRows ?? []).reduce((sum, r) => sum + (r.pages ?? 0), 0);
  const rated = books_read.filter((b) => b.rating);
  const avg_rating = rated.length
    ? Math.round((rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) * 10) / 10
    : null;

  return NextResponse.json({
    profile: {
      ...profile,
      followers_count: followers_count ?? 0,
      following_count: following_count ?? 0,
      books_read_count: books_read.length,
      want_to_read_count,
      total_pages,
      avg_rating,
    },
    currently_reading,
    recently_read: books_read.slice(0, 12),
    recent_reviews: reviews ?? [],
    is_following,
    is_own_profile: viewerId === profile.id,
  });
}
