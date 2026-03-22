export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { year: number; goal_books: number; goal_pages?: number };

  const { data, error } = await supabase
    .from('reading_challenges')
    .upsert({ user_id: user.id, ...body }, { onConflict: 'user_id,year' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01T00:00:00.000Z`;
  const yearEnd = `${year + 1}-01-01T00:00:00.000Z`;

  // Fetch the stored challenge goal
  const { data: challenge } = await supabase
    .from('reading_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .maybeSingle();

  // Compute current_books from source of truth: finished books this year
  const { count: booksCount } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', yearStart)
    .lt('finished_at', yearEnd);

  // Compute current_pages from source of truth: pages logged in sessions this year
  const { data: sessionPages } = await supabase
    .from('sessions')
    .select('pages_read')
    .eq('user_id', user.id)
    .gte('logged_at', yearStart)
    .lt('logged_at', yearEnd);

  const pagesCount = (sessionPages ?? []).reduce((sum, s) => sum + (s.pages_read ?? 0), 0);

  if (!challenge) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      ...challenge,
      current_books: booksCount ?? 0,
      current_pages: pagesCount,
    },
  });
}
