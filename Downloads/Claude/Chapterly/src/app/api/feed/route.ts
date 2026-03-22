export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get list of users this person follows
  const { data: follows } = await supabase
    .from('social_follow')
    .select('followee_id')
    .eq('follower_id', user.id);

  const followeeIds = follows?.map(f => f.followee_id) ?? [];
  const following = followeeIds.length;

  if (followeeIds.length === 0) {
    return NextResponse.json({ data: [], following: 0 });
  }

  // Get recent shelf updates from followed users (only public or followers-visible entries)
  const { data: shelfUpdates } = await supabase
    .from('user_books')
    .select('id, user_id, status, rating, updated_at, books(id, title, cover_url), users(display_name, avatar_url, handle)')
    .in('user_id', followeeIds)
    .in('visibility', ['public', 'followers'])
    .order('updated_at', { ascending: false })
    .limit(30);

  const events = (shelfUpdates ?? []).map((ub: any) => {
    let event_type: string;
    if (ub.status === 'reading') event_type = 'started_reading';
    else if (ub.status === 'read') event_type = 'finished';
    else event_type = 'added_to_shelf';

    if (ub.rating) event_type = 'rated';

    return {
      id: ub.id,
      event_type,
      user_id: ub.user_id,
      user_book_id: ub.id,
      book_id: ub.books?.id ?? null,
      book_title: ub.books?.title ?? 'Unknown',
      book_cover: ub.books?.cover_url ?? null,
      rating: ub.rating ?? null,
      display_name: ub.users?.display_name ?? 'Reader',
      avatar_url: ub.users?.avatar_url ?? null,
      handle: ub.users?.handle ?? null,
      created_at: ub.updated_at,
    };
  });

  return NextResponse.json({ data: events, following });
}
