export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = await req.json() as { token: string };
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  // Verify token matches the club's stored invite_token
  const { data: club } = await supabase
    .from('clubs')
    .select('id, invite_token, member_count')
    .eq('id', params.id)
    .maybeSingle();

  if (!club || club.invite_token !== token) {
    return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 });
  }

  // Add user to club (ignore duplicate — user already a member is fine)
  const { error } = await supabase
    .from('club_members')
    .insert({ club_id: params.id, user_id: user.id, role: 'member' });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment member count only if this was a new membership (not a duplicate)
  if (!error) {
    await supabase
      .from('clubs')
      .update({ member_count: ((club.member_count as number) ?? 0) + 1 })
      .eq('id', params.id);
  }

  return NextResponse.json({ ok: true });
}
