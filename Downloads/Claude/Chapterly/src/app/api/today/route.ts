export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { format } from 'date-fns';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = format(new Date(), 'yyyy-MM-dd');
  const { data } = await supabase
    .from('stats_daily')
    .select('pages, minutes, sessions_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  return NextResponse.json({
    pages_today: data?.pages ?? 0,
    minutes_today: data?.minutes ?? 0,
    sessions_today: data?.sessions_count ?? 0,
  });
}
