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

  const followedIds = follows?.map(f => f.followee_id) ?? [];
  const following = followedIds.length;

  if (followedIds.length === 0) {
    return NextResponse.json({ data: [], following: 0 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get recent shelf updates from followed users (only public or followers-visible entries)
  const { data: shelfUpdates } = await supabase
    .from('user_books')
    .select('id, user_id, status, rating, updated_at, books(id, title, cover_url), users(display_name, avatar_url, handle)')
    .in('user_id', followedIds)
    .in('visibility', ['public', 'followers'])
    .order('updated_at', { ascending: false })
    .limit(30);

  // Query reviews by followed users (last 30 days)
  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id, user_id, book_id, rating, body, created_at, books(title, cover_url)')
    .in('user_id', followedIds)
    .gte('created_at', thirtyDaysAgo)
    .not('body', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  // Query quotes by followed users (last 30 days)
  const { data: quotesData } = await supabase
    .from('quotes')
    .select('id, user_id, book_id, text, created_at, books(title, cover_url)')
    .in('user_id', followedIds)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20);

  // Build a profiles map from shelf updates for display_name/avatar_url/handle lookup
  const profilesMap = new Map<string, { display_name: string; avatar_url: string | null; handle: string | null }>();
  for (const ub of shelfUpdates ?? []) {
    if (ub.user_id && ub.users) {
      profilesMap.set(ub.user_id, {
        display_name: (ub.users as any).display_name ?? 'Reader',
        avatar_url: (ub.users as any).avatar_url ?? null,
        handle: (ub.users as any).handle ?? null,
      });
    }
  }

  // For reviews/quotes authors not already in the map, fetch their profiles
  const missingUserIds = [
    ...(reviewData ?? []).map((r: any) => r.user_id),
    ...(quotesData ?? []).map((q: any) => q.user_id),
  ].filter(id => !profilesMap.has(id));

  if (missingUserIds.length > 0) {
    const uniqueMissingIds = [...new Set(missingUserIds)];
    const { data: extraProfiles } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, handle')
      .in('id', uniqueMissingIds);
    for (const p of extraProfiles ?? []) {
      profilesMap.set(p.id, {
        display_name: p.display_name ?? 'Reader',
        avatar_url: p.avatar_url ?? null,
        handle: p.handle ?? null,
      });
    }
  }

  // Build a set of mutual-follow user IDs for relevance scoring
  const { data: reverseFollows } = await supabase
    .from('social_follow')
    .select('follower_id')
    .in('follower_id', followedIds)
    .eq('followee_id', user.id);

  const mutualFollowIds = new Set((reverseFollows ?? []).map((r: { follower_id: string }) => r.follower_id));

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const THREE_DAYS_MS = 3 * ONE_DAY_MS;

  // Map shelf update events
  const shelfEvents = (shelfUpdates ?? []).map((ub: any) => {
    let event_type: string;
    if (ub.status === 'reading') event_type = 'started_reading';
    else if (ub.status === 'read') event_type = 'finished';
    else event_type = 'added_to_shelf';

    if (ub.rating) event_type = 'rated';

    let score = 0;
    const itemAge = now - new Date(ub.updated_at).getTime();

    if (mutualFollowIds.has(ub.user_id)) score += 3;
    if ((ub.rating ?? 0) >= 4) score += 2;
    if (itemAge < ONE_DAY_MS) score += 2;
    else if (itemAge < THREE_DAYS_MS) score += 1;
    if (ub.status === 'read') score += 1;

    return {
      id: ub.id,
      event_type,
      user_id: ub.user_id,
      user_book_id: ub.id,
      book_id: ub.books?.id ?? null,
      book_title: ub.books?.title ?? 'Unknown',
      book_cover: ub.books?.cover_url ?? null,
      rating: ub.rating ?? null,
      display_name: (ub.users as any)?.display_name ?? 'Reader',
      avatar_url: (ub.users as any)?.avatar_url ?? null,
      handle: (ub.users as any)?.handle ?? null,
      created_at: ub.updated_at,
      review_text: undefined as string | undefined,
      quote_text: undefined as string | undefined,
      _score: score,
    };
  });

  // Map review events
  const reviewEvents = (reviewData ?? []).map((r: any) => {
    const profile = profilesMap.get(r.user_id);
    const itemAge = now - new Date(r.created_at).getTime();

    let score = 0;
    if (mutualFollowIds.has(r.user_id)) score += 3;
    if ((r.rating ?? 0) >= 4) score += 2;
    if (itemAge < ONE_DAY_MS) score += 2;
    else if (itemAge < THREE_DAYS_MS) score += 1;
    score += 1; // reviews carry an engagement bonus

    return {
      id: `review-${r.id}`,
      event_type: 'wrote_review',
      user_id: r.user_id,
      user_book_id: null as string | null,
      book_id: r.book_id ?? null,
      book_title: (r.books as any)?.title ?? 'Unknown',
      book_cover: (r.books as any)?.cover_url ?? null,
      rating: r.rating ?? null,
      display_name: profile?.display_name ?? 'Reader',
      avatar_url: profile?.avatar_url ?? null,
      handle: profile?.handle ?? null,
      created_at: r.created_at,
      review_text: (r.body as string) ?? undefined,
      quote_text: undefined as string | undefined,
      _score: score,
    };
  });

  // Map quote events
  const quoteEvents = (quotesData ?? []).map((q: any) => {
    const profile = profilesMap.get(q.user_id);
    const itemAge = now - new Date(q.created_at).getTime();

    let score = 0;
    if (mutualFollowIds.has(q.user_id)) score += 3;
    if (itemAge < ONE_DAY_MS) score += 2;
    else if (itemAge < THREE_DAYS_MS) score += 1;

    return {
      id: `quote-${q.id}`,
      event_type: 'saved_quote',
      user_id: q.user_id,
      user_book_id: null as string | null,
      book_id: q.book_id ?? null,
      book_title: (q.books as any)?.title ?? 'Unknown',
      book_cover: (q.books as any)?.cover_url ?? null,
      rating: null as number | null,
      display_name: profile?.display_name ?? 'Reader',
      avatar_url: profile?.avatar_url ?? null,
      handle: profile?.handle ?? null,
      created_at: q.created_at,
      review_text: undefined as string | undefined,
      quote_text: (q.text as string) ?? undefined,
      _score: score,
    };
  });

  // Merge all events and sort by score desc, then created_at desc
  const allEvents = [...shelfEvents, ...reviewEvents, ...quoteEvents];

  allEvents.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Strip internal scoring field and cap at 50
  const scoredEvents = allEvents
    .slice(0, 50)
    .map(({ _score: _s, ...rest }) => rest);

  return NextResponse.json({ data: scoredEvents, following });
}
