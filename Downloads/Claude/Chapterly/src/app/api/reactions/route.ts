export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET — count reactions for a target, plus whether current user has reacted
// ?target_type=user_book&target_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const target_type = searchParams.get('target_type');
  const target_id = searchParams.get('target_id');
  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id required' }, { status: 400 });
  }

  const [countRes, myRes] = await Promise.all([
    supabase
      .from('feed_reactions')
      .select('id', { count: 'exact', head: true })
      .eq('target_type', target_type)
      .eq('target_id', target_id),
    supabase
      .from('feed_reactions')
      .select('id')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    count: countRes.count ?? 0,
    liked: !!myRes.data,
  });
}

// POST — toggle reaction (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { target_type, target_id } = await req.json();
  if (!target_type || !target_id) {
    return NextResponse.json({ error: 'target_type and target_id required' }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('feed_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase
      .from('feed_reactions')
      .delete()
      .eq('id', existing.id);
  } else {
    // Add
    await supabase
      .from('feed_reactions')
      .insert({ user_id: user.id, target_type, target_id });
  }

  // Return new count
  const { count } = await supabase
    .from('feed_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', target_type)
    .eq('target_id', target_id);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
