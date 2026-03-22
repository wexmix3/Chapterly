export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await request.json() as Record<string, unknown>;

  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete all user data (RLS cascades will handle related rows, or delete manually)
  // Order matters: child tables first
  await supabase.from('sessions').delete().eq('user_id', user.id);
  await supabase.from('user_books').delete().eq('user_id', user.id);
  await supabase.from('reading_challenges').delete().eq('user_id', user.id);
  await supabase.from('social_follow').delete().or(`follower_id.eq.${user.id},followee_id.eq.${user.id}`);
  await supabase.from('share_cards').delete().eq('user_id', user.id);
  await supabase.from('stats_daily').delete().eq('user_id', user.id);
  await supabase.from('users').delete().eq('id', user.id);

  // Delete auth user
  const adminSupabase = createServerSupabaseClient();
  await adminSupabase.auth.admin.deleteUser(user.id).catch(() => {
    // If admin delete fails (missing service role key), sign out is still called client-side
  });

  return NextResponse.json({ success: true });
}
