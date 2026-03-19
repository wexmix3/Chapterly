export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/clubs — list public clubs + clubs you belong to
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mine = req.nextUrl.searchParams.get('mine') === 'true';

  if (mine) {
    const { data, error } = await supabase
      .from('club_members')
      .select('club:clubs(*, book:books(title, authors, cover_url))')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: (data ?? []).map(r => r.club) });
  }

  // Public clubs
  const { data, error } = await supabase
    .from('clubs')
    .select('*, book:books(title, authors, cover_url), owner:users(handle, display_name, avatar_url)')
    .eq('is_public', true)
    .order('member_count', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/clubs — create a club
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, is_public, book_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data: club, error } = await supabase
    .from('clubs')
    .insert({
      name: name.trim(),
      description: description?.trim() ?? null,
      owner_id: user.id,
      is_public: is_public ?? true,
      current_book_id: book_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-add owner as member
  await supabase.from('club_members').insert({
    club_id: club.id,
    user_id: user.id,
    role: 'owner',
  });

  return NextResponse.json({ data: club }, { status: 201 });
}
