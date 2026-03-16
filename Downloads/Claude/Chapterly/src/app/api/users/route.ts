export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ data: [] });

  // Search by handle or display_name (case-insensitive), exclude self
  const { data: users, error } = await supabase
    .from('users')
    .select('id, handle, display_name, avatar_url')
    .neq('id', user.id)
    .or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get who the current user is already following
  const { data: following } = await supabase
    .from('social_follow')
    .select('followee_id')
    .eq('follower_id', user.id);

  const followingIds = new Set((following ?? []).map((f: { followee_id: string }) => f.followee_id));

  const result = (users ?? []).map(u => ({
    ...u,
    is_following: followingIds.has(u.id),
  }));

  return NextResponse.json({ data: result });
}
