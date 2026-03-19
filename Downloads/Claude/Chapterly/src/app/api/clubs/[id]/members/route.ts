export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST — join club
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: params.id, user_id: user.id, role: 'member' });

  if (error && error.code !== '23505') { // ignore duplicate
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment member_count
  await supabase.rpc('increment_club_members', { club_id: params.id });

  return NextResponse.json({ success: true });
}

// DELETE — leave club
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Owner can't leave (must delete club instead)
  const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', params.id).maybeSingle();
  if (club?.owner_id === user.id) {
    return NextResponse.json({ error: 'Club owner cannot leave. Delete the club instead.' }, { status: 400 });
  }

  await supabase.from('club_members').delete().eq('club_id', params.id).eq('user_id', user.id);
  await supabase.rpc('decrement_club_members', { club_id: params.id });

  return NextResponse.json({ success: true });
}
