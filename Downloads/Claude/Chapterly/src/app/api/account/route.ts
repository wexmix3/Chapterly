export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

export async function DELETE() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Delete user data in dependency order (children before parents)
  const tables = [
    'sessions',
    'stats_daily',
    'user_books',
    'reviews',
    'quotes',
    'club_members',
    'club_posts',
    'social_follow',
    'notifications',
    'streak_milestones',
    'share_cards',
    'reading_challenges',
    'subscriptions',
  ];

  for (const table of tables) {
    await admin.from(table as never).delete().eq('user_id', user.id);
  }

  // Delete clubs owned by user (after removing their membership records above)
  await admin.from('clubs').delete().eq('owner_id', user.id);

  // Delete the public user profile
  await admin.from('users').delete().eq('id', user.id);

  // Delete from auth — this signs them out of all sessions
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ ok: true });
}
