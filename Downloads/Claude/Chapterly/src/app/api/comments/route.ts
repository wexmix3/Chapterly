export const dynamic = 'force-dynamic';

/**
 * GET  /api/comments?target_type=<t>&target_id=<id>  — list comments
 * POST /api/comments  { target_type, target_id, content }  — create
 * DELETE /api/comments?id=<id>  — delete own comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const target_type = req.nextUrl.searchParams.get('target_type');
  const target_id = req.nextUrl.searchParams.get('target_id');

  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .select('id, content, created_at, user_id, user:users(display_name, avatar_url, handle)')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { target_type?: string; target_id?: string; content?: string };
  const { target_type, target_id, content } = body;

  if (!target_type || !target_id || !content?.trim()) {
    return NextResponse.json({ error: 'target_type, target_id, and content are required' }, { status: 400 });
  }

  if (content.trim().length > 1000) {
    return NextResponse.json({ error: 'Comment too long (max 1000 chars)' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      user_id: session.user.id,
      target_type,
      target_id,
      content: content.trim(),
    })
    .select('id, content, created_at, user_id, user:users(display_name, avatar_url, handle)')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase
    .from('feed_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id); // RLS also enforces this

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
