export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET — list posts for a club
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('club_posts')
    .select('*, author:users(id, handle, display_name, avatar_url), book:books(id, title, cover_url)')
    .eq('club_id', params.id)
    .is('parent_id', null) // top-level posts only
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create a discussion post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify membership
  const { data: membership } = await supabase
    .from('club_members')
    .select('user_id')
    .eq('club_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: 'You are not a member of this club' }, { status: 403 });

  const { body, contains_spoilers, parent_id, book_id } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 });

  const { data, error } = await supabase
    .from('club_posts')
    .insert({
      club_id: params.id,
      user_id: user.id,
      body: body.trim(),
      contains_spoilers: contains_spoilers ?? false,
      parent_id: parent_id ?? null,
      book_id: book_id ?? null,
    })
    .select('*, author:users(id, handle, display_name, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
