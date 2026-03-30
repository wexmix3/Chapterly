export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const formatted =
    count && count >= 1000
      ? `${(count / 1000).toFixed(1)}K+`
      : `${count ?? 0}+`;

  return NextResponse.json({ count: count ?? 0, formatted }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
