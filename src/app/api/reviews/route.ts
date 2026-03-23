export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const book_id = req.nextUrl.searchParams.get('book_id');
  if (!book_id) return NextResponse.json({ error: 'book_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('reviews')
    .select('*, users(display_name, avatar_url)')
    .eq('book_id', book_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const my_review = (data ?? []).find((r: { user_id: string }) => r.user_id === user.id) ?? null;
  return NextResponse.json({ data, my_review });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { book_id, user_book_id, rating, text, mood_tags, contains_spoilers } = body;

  if (!book_id || !rating) {
    return NextResponse.json({ error: 'book_id and rating required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      user_id: user.id,
      book_id,
      user_book_id,
      rating,
      text: text || null,
      mood_tags: mood_tags ?? [],
      contains_spoilers: contains_spoilers ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,book_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget friend_finished notifications (only on new reviews, not edits)
  // A new review has created_at === updated_at (within a second)
  const isNew = data && Math.abs(
    new Date(data.updated_at).getTime() - new Date(data.created_at).getTime()
  ) < 2000;

  if (isNew && data) {
    (async () => {
      try {
        // Find followers of the reviewer who also have this book with status 'read' or 'reading'
        const { data: followers } = await supabase
          .from('social_follow')
          .select('follower_id')
          .eq('followee_id', user.id);

        if (!followers || followers.length === 0) return;

        const followerIds = followers.map((f: { follower_id: string }) => f.follower_id);

        // Find which of those followers have this book on their shelf
        const { data: shelfEntries } = await supabase
          .from('user_books')
          .select('user_id')
          .eq('book_id', book_id)
          .in('status', ['read', 'reading'])
          .in('user_id', followerIds);

        if (!shelfEntries || shelfEntries.length === 0) return;

        // Fetch reviewer's display name and book title for notification body
        const { data: reviewer } = await supabase
          .from('users')
          .select('display_name, handle')
          .eq('id', user.id)
          .maybeSingle();

        const { data: book } = await supabase
          .from('books')
          .select('title')
          .eq('id', book_id)
          .maybeSingle();

        const actorName = reviewer?.display_name ?? 'Someone you follow';
        const bookTitle = book?.title ?? 'a book you have';

        const notifications = shelfEntries.map((entry: { user_id: string }) => ({
          user_id: entry.user_id,
          actor_id: user.id,
          type: 'friend_finished' as const,
          title: `${actorName} reviewed ${bookTitle}`,
          body: `See what they thought about a book on your shelf.`,
          link: `/u/${reviewer?.handle ?? user.id}`,
          read: false,
          created_at: new Date().toISOString(),
        }));

        await supabase.from('notifications').insert(notifications);
      } catch {
        // fire-and-forget — swallow errors silently
      }
    })();
  }

  return NextResponse.json({ data });
}
