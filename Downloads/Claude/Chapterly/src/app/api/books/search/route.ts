export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/books';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  const results = await searchBooks(q);
  return NextResponse.json({ data: results });
}
