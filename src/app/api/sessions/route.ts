export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session: authSession } } = await supabase.auth.getSession();
  const user = authSession?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    user_book_id: string;
    book_id: string;
    mode: 'pages' | 'minutes';
    value: number;
    pages_start?: number;
    pages_end?: number;
    notes?: string;
  };

  const now = new Date();
  const pages_delta = body.mode === 'pages' ? body.value : 0;
  const minutes_delta = body.mode === 'minutes' ? body.value : 0;

  // Create session
  const { data: session, error: sessError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      user_book_id: body.user_book_id,
      book_id: body.book_id,
      mode: body.mode,
      source: 'manual',
      pages_delta,
      minutes_delta,
      pages_start: body.pages_start ?? null,
      pages_end: body.pages_end ?? null,
      notes: body.notes ?? null,
      started_at: now.toISOString(),
      ended_at: now.toISOString(),
    })
    .select()
    .single();

  if (sessError) return NextResponse.json({ error: sessError.message }, { status: 500 });

  // Update current_page if pages_end provided
  if (body.pages_end) {
    await supabase
      .from('user_books')
      .update({ current_page: body.pages_end, updated_at: now.toISOString() })
      .eq('id', body.user_book_id)
      .eq('user_id', user.id);
  }

  // Upsert daily stats
  const today = format(now, 'yyyy-MM-dd');
  const { data: existing } = await supabase
    .from('stats_daily')
    .select('pages, minutes, sessions_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('stats_daily')
      .update({
        pages: existing.pages + pages_delta,
        minutes: existing.minutes + minutes_delta,
        sessions_count: existing.sessions_count + 1,
        is_streak_day: true,
      })
      .eq('user_id', user.id)
      .eq('date', today);
  } else {
    await supabase.from('stats_daily').insert({
      user_id: user.id,
      date: today,
      pages: pages_delta,
      minutes: minutes_delta,
      sessions_count: 1,
      is_streak_day: true,
    });
  }

  return NextResponse.json({ data: session }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session: authSession } } = await supabase.auth.getSession();
  const user = authSession?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookId = request.nextUrl.searchParams.get('book_id');
  let query = supabase
    .from('sessions')
    .select('*, book:books(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (bookId) query = query.eq('book_id', bookId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
