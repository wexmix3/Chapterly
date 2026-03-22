export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/** GET /api/friend-recommendations — fetch recommendations received by current user */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('book_recommendations')
    .select('*, sender:users!sender_id(display_name, avatar_url, handle), book:books(title, cover_url, authors)')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

/** POST /api/friend-recommendations — send a book recommendation to a friend */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { recipient_id, book_id, message } = await req.json() as {
    recipient_id: string;
    book_id: string;
    message?: string;
  };

  if (!recipient_id || !book_id) {
    return NextResponse.json({ error: 'recipient_id and book_id required' }, { status: 400 });
  }
  if (recipient_id === user.id) {
    return NextResponse.json({ error: 'Cannot recommend to yourself' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('book_recommendations')
    .insert({ sender_id: user.id, recipient_id, book_id, message: message?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create a notification for the recipient
  const { data: senderProfile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: book } = await supabase
    .from('books')
    .select('title')
    .eq('id', book_id)
    .maybeSingle();

  await supabase.from('notifications').insert({
    user_id: recipient_id,
    actor_id: user.id,
    type: 'book_recommendation',
    title: `${senderProfile?.display_name ?? 'Someone'} recommended a book`,
    body: `"${book?.title ?? 'A book'}"${message?.trim() ? ` — "${message.trim()}"` : ''}`,
    link: `/notifications`,
  });

  return NextResponse.json({ data }, { status: 201 });
}
