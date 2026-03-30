export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { randomUUID } from 'crypto';

// GET — get or generate invite token for a club
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is a member or owner of this club
  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: 'Not a club member' }, { status: 403 });

  // Get or lazily create the invite token
  const { data: club } = await supabase
    .from('clubs')
    .select('invite_token, name')
    .eq('id', params.id)
    .maybeSingle();

  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  let token = club.invite_token as string | null;
  if (!token) {
    token = randomUUID();
    await supabase.from('clubs').update({ invite_token: token }).eq('id', params.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chapterly.app';
  return NextResponse.json({
    token,
    invite_url: `${appUrl}/clubs/${params.id}/join?token=${token}`,
    club_name: club.name,
  });
}
