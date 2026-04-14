export const dynamic = 'force-dynamic';

/**
 * GET  /api/content-warnings?book_id=<id>  — list warnings for a book
 * POST /api/content-warnings  { book_id, warning }  — add a community warning
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const book_id = req.nextUrl.searchParams.get('book_id');
  if (!book_id) return NextResponse.json({ error: 'book_id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('books')
    .select('content_warnings')
    .eq('id', book_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.content_warnings ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { book_id?: string; warning?: string };
  const { book_id, warning } = body;

  if (!book_id || !warning?.trim()) {
    return NextResponse.json({ error: 'book_id and warning are required' }, { status: 400 });
  }

  const normalized = warning.trim().toLowerCase();
  if (normalized.length > 60) {
    return NextResponse.json({ error: 'Warning too long (max 60 chars)' }, { status: 400 });
  }

  // Fetch current warnings first to avoid duplicates
  const { data: current } = await supabase
    .from('books')
    .select('content_warnings')
    .eq('id', book_id)
    .maybeSingle();

  const existing: string[] = current?.content_warnings ?? [];
  if (existing.includes(normalized)) {
    return NextResponse.json({ data: existing });
  }

  const updated = [...existing, normalized];

  const { error } = await supabase
    .from('books')
    .update({ content_warnings: updated })
    .eq('id', book_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: updated }, { status: 201 });
}
