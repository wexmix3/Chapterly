export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/clubs/[id] — club detail + membership status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  const { data: club, error } = await supabase
    .from('clubs')
    .select('*, book:books(id, title, authors, cover_url, page_count, description), owner:users(id, handle, display_name, avatar_url)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !club) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Members list
  const { data: members } = await supabase
    .from('club_members')
    .select('role, joined_at, user:users(id, handle, display_name, avatar_url)')
    .eq('club_id', params.id)
    .order('joined_at', { ascending: true });

  // Is viewer a member?
  const is_member = userId ? (members ?? []).some((m) => {
    const u = m.user as unknown as { id: string } | null;
    return u?.id === userId;
  }) : false;

  // Progress (if there's a current book)
  let progress: unknown[] = [];
  if (club.current_book_id && is_member) {
    const { data } = await supabase
      .from('club_progress')
      .select('user_id, current_page, percent_complete, updated_at, user:users(display_name, avatar_url)')
      .eq('club_id', params.id)
      .eq('book_id', club.current_book_id);
    progress = data ?? [];
  }

  return NextResponse.json({
    club,
    members: members ?? [],
    is_member,
    is_owner: userId === (club.owner as { id: string } | null)?.id,
    progress,
  });
}

// PATCH /api/clubs/[id] — update club (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = await req.json();
  const { data, error } = await supabase
    .from('clubs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
