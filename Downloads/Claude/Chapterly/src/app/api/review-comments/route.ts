export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const review_id = req.nextUrl.searchParams.get('review_id');
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('review_comments')
    .select('*, user:users!user_id(display_name, avatar_url, handle)')
    .eq('review_id', review_id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { review_id, text } = await req.json() as { review_id: string; text: string };
  if (!review_id || !text?.trim()) {
    return NextResponse.json({ error: 'review_id and text required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id, user_id: user.id, text: text.trim() })
    .select('*, user:users!user_id(display_name, avatar_url, handle)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
