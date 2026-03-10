export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import BookDetailClient from './BookDetailClient';

interface Props {
  params: { id: string };
}

export default async function BookDetailPage({ params }: Props) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch book from DB
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!book) redirect('/dashboard?tab=search');

  // Fetch user's shelf record for this book
  const { data: userBook } = await supabase
    .from('user_books')
    .select('*')
    .eq('user_id', user.id)
    .eq('book_id', params.id)
    .maybeSingle();

  // Fetch community reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, users(display_name, avatar_url)')
    .eq('book_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <BookDetailClient
      book={book}
      userBook={userBook}
      reviews={reviews ?? []}
      userId={user.id}
    />
  );
}
