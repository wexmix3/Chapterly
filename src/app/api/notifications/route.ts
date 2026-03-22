export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/** GET /api/notifications — fetch user's notifications (newest first) */
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10);
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  let query = supabase
    .from('notifications')
    .select('*, actor:users!actor_id(display_name, avatar_url, handle)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('read', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count unread
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return NextResponse.json({ data: data ?? [], unread_count: count ?? 0 });
}

/** PATCH /api/notifications — mark notifications as read */
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, all } = await req.json() as { ids?: string[]; all?: boolean };

  if (all) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  } else if (ids?.length) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids)
      .eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
