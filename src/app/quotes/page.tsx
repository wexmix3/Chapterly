export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import QuotesClient from './QuotesClient';

export default async function QuotesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, books(id, title, authors, cover_url)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return <QuotesClient initialQuotes={quotes ?? []} />;
}
