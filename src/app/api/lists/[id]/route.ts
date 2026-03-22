export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const viewerId = session?.user?.id ?? null;

  const { data: list, error } = await supabase
    .from('reading_lists')
    .select('*, owner:users(id, handle, display_name, avatar_url)')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !list) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!list.is_public && (list.owner as { id: string } | null)?.id !== viewerId) {
    return NextResponse.json({ error: 'Private' }, { status: 403 });
  }

  const { data: books } = await supabase
    .from('reading_list_books')
    .select('note, position, book:books(id, title, authors, cover_url, page_count, description)')
    .eq('list_id', params.id)
    .order('position', { ascending: true });

  return NextResponse.json({ list, books: books ?? [], is_owner: viewerId === (list.owner as { id: string } | null)?.id });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Add a book to the list
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { book_id, note } = await req.json();
  if (!book_id) return NextResponse.json({ error: 'book_id required' }, { status: 400 });

  // Verify ownership
  const { data: list } = await supabase.from('reading_lists').select('user_id, book_count').eq('id', params.id).maybeSingle();
  if (!list || list.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('reading_list_books').insert({
    list_id: params.id,
    book_id,
    note: note ?? null,
    position: (list.book_count ?? 0) + 1,
  });

  if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 });

  // Update count + cover
  await supabase.from('reading_lists').update({
    book_count: (list.book_count ?? 0) + 1,
    cover_book_id: book_id,
    updated_at: new Date().toISOString(),
  }).eq('id', params.id);

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Update list metadata (title, description, is_public)
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, is_public } = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title?.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (is_public !== undefined) updates.is_public = is_public;

  const { data, error } = await supabase
    .from('reading_lists')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // If body contains book_id, remove book from list; otherwise delete the entire list
  let book_id: string | undefined;
  try {
    const body = await req.json();
    book_id = body?.book_id;
  } catch {
    // No body — delete entire list
  }

  if (book_id) {
    await supabase.from('reading_list_books').delete().eq('list_id', params.id).eq('book_id', book_id);
    await supabase.from('reading_lists').update({ updated_at: new Date().toISOString() }).eq('id', params.id).eq('user_id', user.id);
  } else {
    // Delete entire list (cascade deletes reading_list_books via FK)
    await supabase.from('reading_list_books').delete().eq('list_id', params.id);
    const { error } = await supabase.from('reading_lists').delete().eq('id', params.id).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
