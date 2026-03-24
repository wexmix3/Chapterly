export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { XP_REWARDS, levelFromXP, type XPAction } from '@/lib/xp';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { action?: string; metadata?: Record<string, unknown> };
  const action = body.action as XPAction | undefined;

  if (!action || !(action in XP_REWARDS)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const xpToAdd = XP_REWARDS[action];

  // Fetch current XP
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('total_xp, reader_level')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const currentXP: number = (userData.total_xp as number | null) ?? 0;
  const oldLevel = (userData.reader_level as number | null) ?? 1;
  const newXP = currentXP + xpToAdd;
  const newLevel = levelFromXP(newXP);

  // Update user row
  const { error: updateError } = await supabase
    .from('users')
    .update({
      total_xp: newXP,
      reader_level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    new_xp: newXP,
    new_level: newLevel,
    xp_earned: xpToAdd,
    level_up: newLevel > oldLevel,
  });
}
