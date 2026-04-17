export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/pace
 * Returns monthly reading pace (pages/hour) for the authenticated user.
 * Only includes months where the user logged both pages and minutes.
 * { data: Array<{ month: string; pages_per_hour: number; pages: number; minutes: number }> }
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch sessions from last 12 months with both pages and minutes
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('pages_delta, minutes_delta, started_at')
    .eq('user_id', session.user.id)
    .gte('started_at', twelveMonthsAgo.toISOString())
    .gt('pages_delta', 0)
    .gt('minutes_delta', 0);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by month (YYYY-MM)
  const byMonth: Record<string, { pages: number; minutes: number }> = {};
  for (const row of rows ?? []) {
    const month = (row.started_at as string).slice(0, 7); // 'YYYY-MM'
    if (!byMonth[month]) byMonth[month] = { pages: 0, minutes: 0 };
    byMonth[month].pages += row.pages_delta ?? 0;
    byMonth[month].minutes += row.minutes_delta ?? 0;
  }

  const result = Object.entries(byMonth)
    .filter(([, v]) => v.minutes > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      pages: v.pages,
      minutes: v.minutes,
      pages_per_hour: Math.round((v.pages / v.minutes) * 60),
    }));

  return NextResponse.json({ data: result });
}
