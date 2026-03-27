export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

/** GET /api/social — fetch the current user's following list */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('social_follow')
    .select('followee:users!followee_id(id, display_name, avatar_url, handle)')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const following = (data ?? []).map((r) => r.followee).filter(Boolean);
  return NextResponse.json({ data: following });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure the follower has a public.users profile (OAuth may create auth.users without public.users)
  const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
  if (!profile) {
    const meta = user.user_metadata ?? {};
    const email = user.email ?? '';
    const handle = (email.split('@')[0] || `reader_${Date.now()}`).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    await supabase.from('users').insert({
      id: user.id,
      handle,
      display_name: (meta.full_name as string) ?? (meta.display_name as string) ?? email.split('@')[0] ?? 'Reader',
      avatar_url: (meta.avatar_url as string) ?? null,
      onboarding_complete: true,
    }).select().maybeSingle();
  }

  const body = await request.json().catch(() => null) as { followee_id?: string } | null;
  const followee_id = body?.followee_id;
  if (!followee_id) return NextResponse.json({ error: 'followee_id required' }, { status: 400 });

  const { error } = await supabase.from('social_follow').insert({
    follower_id: user.id,
    followee_id,
  });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already following' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify the followee using the admin client (bypasses RLS — the follower's
  // session cannot insert a notification row for another user due to the
  // `user_id = auth.uid()` policy on the notifications table).
  try {
    const adminClient = createAdminSupabaseClient();
    const { data: actor } = await supabase
      .from('users').select('display_name, handle').eq('id', user.id).maybeSingle();
    if (actor) {
      await adminClient.from('notifications').insert({
        user_id: followee_id,
        actor_id: user.id,
        type: 'new_follower',
        title: `${actor.display_name} started following you`,
        link: `/u/${actor.handle}`,
      });
    }
  } catch (err) {
    // Non-fatal — follow succeeded; just log the notification failure
    console.error('[social/follow] notification insert failed:', err);
  }

  return NextResponse.json({ data: { success: true } }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { followee_id?: string } | null;
  const followee_id = body?.followee_id;
  if (!followee_id) return NextResponse.json({ error: 'followee_id required' }, { status: 400 });

  const { error } = await supabase
    .from('social_follow')
    .delete()
    .eq('follower_id', user.id)
    .eq('followee_id', followee_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { success: true } });
}
