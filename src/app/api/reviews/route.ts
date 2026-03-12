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
  return NextResponse.json({ data });
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
  return NextResponse.json({ data });
}
