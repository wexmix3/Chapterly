export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function enrichDescription(
  source: string,
  sourceId: string,
): Promise<{ description: string | null; subjects: string[] }> {
  try {
    if (source === 'openlibrary') {
      const res = await fetch(`https://openlibrary.org/works/${sourceId}.json`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) return { description: null, subjects: [] };
      const data = await res.json();
      const description =
        typeof data.description === 'string'
          ? data.description
          : (data.description?.value ?? null);
      const subjects: string[] = (data.subjects ?? []).slice(0, 10);
      return { description, subjects };
    }
    if (source === 'googlebooks') {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      const keyParam = apiKey ? `?key=${apiKey}` : '';
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${sourceId}${keyParam}`,
        { next: { revalidate: 86400 } },
      );
      if (!res.ok) return { description: null, subjects: [] };
      const data = await res.json();
      return {
        description: data.volumeInfo?.description ?? null,
        subjects: (data.volumeInfo?.categories ?? []).slice(0, 10),
      };
    }
  } catch {}
  return { description: null, subjects: [] };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userBook, error } = await supabase
    .from('user_books')
    .select('*, book:books(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !userBook) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const book = userBook.book as Record<string, unknown>;

  if (!book?.description && book?.source && book?.source_id) {
    const enriched = await enrichDescription(
      book.source as string,
      book.source_id as string,
    );
    if (enriched.description) {
      await supabase.from('books').update({
        description: enriched.description,
        ...(enriched.subjects.length > 0 && { subjects: enriched.subjects }),
      }).eq('id', book.id as string);
      book.description = enriched.description;
      if (
        enriched.subjects.length > 0 &&
        (!book.subjects || (book.subjects as string[]).length === 0)
      ) {
        book.subjects = enriched.subjects;
      }
    }
  }

  return NextResponse.json({ data: { ...userBook, book } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = (await req.json()) as Record<string, unknown>;
  const now = new Date().toISOString();
  if (updates.status === 'reading' && !updates.started_at) updates.started_at = now;
  if (updates.status === 'read' && !updates.finished_at) updates.finished_at = now;

  let { data, error } = await supabase
    .from('user_books')
    .update({ ...updates, updated_at: now })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*, book:books(*)')
    .single();

  // If format column doesn't exist yet (migration not applied), retry without it
  if (error?.message?.includes('format')) {
    const { format: _f, ...updatesNoFormat } = updates as Record<string, unknown> & { format?: unknown };
    const retryResult = await supabase
      .from('user_books')
      .update({ ...updatesNoFormat, updated_at: now })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('*, book:books(*)')
      .single();
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
