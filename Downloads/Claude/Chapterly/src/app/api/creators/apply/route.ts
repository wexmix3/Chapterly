export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { platform, social_handle, follower_count, profile_url, notes } = await req.json();

  if (!platform || !social_handle || !profile_url) {
    return NextResponse.json({ error: 'platform, social_handle, and profile_url are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('creator_applications')
    .upsert({
      user_id: user.id,
      platform,
      social_handle,
      follower_count: follower_count ?? null,
      profile_url,
      notes: notes ?? null,
      status: 'pending',
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('creator_applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
