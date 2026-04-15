export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get followee IDs
  const { data: follows } = await supabase
    .from('social_follow')
    .select('followee_id')
    .eq('follower_id', user.id);

  const followeeIds = (follows ?? []).map(f => f.followee_id as string);
  if (followeeIds.length === 0) return NextResponse.json({ data: [] });

  // Get books those friends are currently reading (public only)
  const { data: rows } = await supabase
    .from('user_books')
    .select('book_id, user_id, books(id, title, authors, cover_url), users!user_id(id, display_name, avatar_url, handle)')
    .in('user_id', followeeIds)
    .eq('status', 'reading')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false });

  if (!rows || rows.length === 0) return NextResponse.json({ data: [] });

  // Group by book_id
  const bookMap = new Map<string, {
    book_id: string;
    book: { id: string; title: string; authors: string[]; cover_url?: string | null };
    readers: { id: string; display_name: string; avatar_url?: string | null; handle: string }[];
  }>();

  for (const row of rows) {
    const bookId = row.book_id as string;
    if (!bookId || !row.books) continue;
    const book = row.books as unknown as { id: string; title: string; authors: string[]; cover_url?: string | null };
    const reader = row.users as unknown as { id: string; display_name: string; avatar_url?: string | null; handle: string } | null;
    if (!reader) continue;

    const existing = bookMap.get(bookId);
    if (existing) {
      if (!existing.readers.find(r => r.id === reader.id)) {
        existing.readers.push(reader);
      }
    } else {
      bookMap.set(bookId, { book_id: bookId, book, readers: [reader] });
    }
  }

  // Sort by number of readers desc (most social first), cap at 12
  const result = Array.from(bookMap.values())
    .sort((a, b) => b.readers.length - a.readers.length)
    .slice(0, 12);

  return NextResponse.json({ data: result });
}
