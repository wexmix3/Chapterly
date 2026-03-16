export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data } = await supabase
    .from('user_books')
    .select('finished_at')
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', start)
    .lte('finished_at', end);

  // Count books finished per month (0-indexed)
  const monthly = new Array(12).fill(0);
  for (const ub of data ?? []) {
    if (ub.finished_at) {
      const month = new Date(ub.finished_at).getMonth();
      monthly[month]++;
    }
  }

  return NextResponse.json({ data: monthly });
}
