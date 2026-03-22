export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getOrCreateBook } from '@/lib/books';
import type { BookSearchResult, ShelfStatus } from '@/types';

// Ensure a public.users profile exists — creates one if the OAuth callback missed it
async function ensureProfile(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string, email: string, metadata: Record<string, unknown>) {
  const { data: profile } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
  if (!profile) {
    const handle = (email.split('@')[0] || `reader_${Date.now()}`).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    await supabase.from('users').insert({
      id: userId,
      handle,
      display_name: (metadata?.full_name as string) ?? (metadata?.display_name as string) ?? email.split('@')[0] ?? 'Reader',
      avatar_url: (metadata?.avatar_url as string) ?? null,
      onboarding_complete: true,
    });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get('status') as ShelfStatus | null;
  const limit = parseInt(params.get('limit') ?? '50', 10);
  const offset = parseInt(params.get('offset') ?? '0', 10);

  let query = supabase
    .from('user_books')
    .select('*, book:books(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page: Math.floor(offset / limit), per_page: limit },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    searchResult: BookSearchResult;
    status: ShelfStatus;
    rating?: number;
    tags?: string[];
    mood?: string;
    visibility?: 'public' | 'followers' | 'private';
    review_text?: string;
  };

  // Ensure profile exists (defensive — handles case where OAuth callback didn't finish)
  await ensureProfile(supabase, user.id, user.email ?? '', user.user_metadata ?? {});

  let book;
  try {
    book = await getOrCreateBook(supabase, body.searchResult);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create book record';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('user_books')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', book.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Already on shelf' }, { status: 409 });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_books')
    .insert({
      user_id: user.id,
      book_id: book.id,
      status: body.status,
      rating: body.rating ?? null,
      tags: body.tags ?? [],
      mood: body.mood ?? null,
      visibility: body.visibility ?? 'public',
      review_text: body.review_text ?? null,
      started_at: body.status === 'reading' ? now : null,
      finished_at: body.status === 'read' ? now : null,
    })
    .select('*, book:books(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await request.json() as { id: string } & Record<string, unknown>;
  const now = new Date().toISOString();

  // Auto-fill dates on status transitions
  if (updates.status === 'reading' && !updates.started_at) updates.started_at = now;
  if (updates.status === 'read' && !updates.finished_at) updates.finished_at = now;

  const { data, error } = await supabase
    .from('user_books')
    .update({ ...updates, updated_at: now })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, book:books(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
