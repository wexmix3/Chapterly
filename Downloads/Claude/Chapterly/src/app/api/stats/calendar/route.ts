export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear());
  const month = req.nextUrl.searchParams.get('month') ?? String(new Date().getMonth() + 1);

  const paddedMonth = String(month).padStart(2, '0');
  const startDate = `${year}-${paddedMonth}-01`;
  const endDate = `${year}-${paddedMonth}-31`;

  const { data, error } = await supabase
    .from('stats_daily')
    .select('date, pages, minutes, is_streak_day')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
