export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('reading_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .single();

  return NextResponse.json({ data: data ?? null });
}
