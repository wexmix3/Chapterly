export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

/** GET /api/buddy-reads — list current user's buddy reads (all statuses) */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('buddy_reads')
    .select(`
      id, status, target_date, created_at, updated_at,
      book_id,
      books(id, title, authors, cover_url, page_count),
      inviter:users!inviter_id(id, display_name, avatar_url, handle),
      invitee:users!invitee_id(id, display_name, avatar_url, handle)
    `)
    .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/buddy-reads — invite a friend to a buddy read
 * Body: { book_id, invitee_id, target_date? }
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { book_id?: string; invitee_id?: string; target_date?: string } | null;
  const { book_id, invitee_id, target_date } = body ?? {};

  if (!book_id || !invitee_id) {
    return NextResponse.json({ error: 'book_id and invitee_id required' }, { status: 400 });
  }
  if (invitee_id === user.id) {
    return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('buddy_reads')
    .insert({ book_id, inviter_id: user.id, invitee_id, target_date: target_date ?? null })
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Buddy read already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify the invitee
  try {
    const admin = createAdminSupabaseClient();
    const { data: actor } = await supabase.from('users').select('display_name, handle').eq('id', user.id).maybeSingle();
    const { data: bookInfo } = await supabase.from('books').select('title').eq('id', book_id).maybeSingle();
    if (actor && bookInfo) {
      await admin.from('notifications').insert({
        user_id: invitee_id,
        actor_id: user.id,
        type: 'buddy_read_invite',
        title: `${actor.display_name} invited you to buddy read "${bookInfo.title}"`,
        link: `/buddy-reads`,
      });
    }
  } catch (err) {
    console.error('[buddy-reads] notification insert failed:', err);
  }

  return NextResponse.json({ data: { id: inserted?.id } }, { status: 201 });
}
