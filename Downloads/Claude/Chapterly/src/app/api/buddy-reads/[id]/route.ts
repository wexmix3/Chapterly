export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/** GET /api/buddy-reads/[id] — detail with checkpoints */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: br, error } = await supabase
    .from('buddy_reads')
    .select(`
      id, status, target_date, created_at, updated_at,
      book_id,
      books(id, title, authors, cover_url, page_count),
      inviter:users!inviter_id(id, display_name, avatar_url, handle),
      invitee:users!invitee_id(id, display_name, avatar_url, handle)
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!br) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify user is a participant
  const brTyped = br as unknown as { inviter: { id: string }; invitee: { id: string } };
  if (brTyped.inviter?.id !== user.id && brTyped.invitee?.id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: checkpoints } = await supabase
    .from('buddy_read_checkpoints')
    .select('id, user_id, page, note, created_at, users!user_id(display_name, avatar_url)')
    .eq('buddy_read_id', params.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ data: { ...br, checkpoints: checkpoints ?? [] } });
}

/**
 * PATCH /api/buddy-reads/[id] — accept / decline / complete
 * Body: { status: 'accepted' | 'declined' | 'completed' }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { status?: string } | null;
  const newStatus = body?.status;
  if (!newStatus || !['accepted', 'declined', 'completed'].includes(newStatus)) {
    return NextResponse.json({ error: 'status must be accepted, declined, or completed' }, { status: 400 });
  }

  // Fetch to verify participant
  const { data: br } = await supabase
    .from('buddy_reads')
    .select('inviter_id, invitee_id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!br) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const brTyped = br as unknown as { inviter_id: string; invitee_id: string; status: string };
  if (brTyped.inviter_id !== user.id && brTyped.invitee_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Only the invitee can accept/decline; either can mark complete
  if ((newStatus === 'accepted' || newStatus === 'declined') && brTyped.invitee_id !== user.id) {
    return NextResponse.json({ error: 'Only the invitee can accept or decline' }, { status: 403 });
  }

  const { error } = await supabase
    .from('buddy_reads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
