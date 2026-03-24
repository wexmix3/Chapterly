export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check freeze is available
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('streak_freeze_available, streak_freeze_used_at, current_streak, last_read_date')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!userData.streak_freeze_available) {
    return NextResponse.json({ error: 'No streak freeze available' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Mark today as a reading day (protect the streak)
  const { error: updateError } = await supabase
    .from('users')
    .update({
      streak_freeze_available: false,
      streak_freeze_used_at: today,
      last_read_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Streak freeze used — your streak is protected for today.',
    streak: userData.current_streak ?? 0,
  });
}
