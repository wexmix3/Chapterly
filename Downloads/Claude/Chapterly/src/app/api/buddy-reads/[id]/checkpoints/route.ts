export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/** GET /api/buddy-reads/[id]/checkpoints */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify participant
  const { data: br } = await supabase
    .from('buddy_reads')
    .select('inviter_id, invitee_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!br) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const brTyped = br as unknown as { inviter_id: string; invitee_id: string };
  if (brTyped.inviter_id !== user.id && brTyped.invitee_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('buddy_read_checkpoints')
    .select('id, user_id, page, note, created_at, users!user_id(display_name, avatar_url)')
    .eq('buddy_read_id', params.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/buddy-reads/[id]/checkpoints — post a page/note checkpoint
 * Body: { page?, note? }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify participant and accepted status
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
  if (brTyped.status !== 'accepted') {
    return NextResponse.json({ error: 'Buddy read must be accepted before posting checkpoints' }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as { page?: number; note?: string } | null;
  const { page, note } = body ?? {};

  if (!page && !note) {
    return NextResponse.json({ error: 'page or note required' }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from('buddy_read_checkpoints')
    .insert({ buddy_read_id: params.id, user_id: user.id, page: page ?? null, note: note ?? null })
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { id: inserted?.id } }, { status: 201 });
}
