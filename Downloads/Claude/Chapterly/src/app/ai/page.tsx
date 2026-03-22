export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import AIPageClient from './AIPageClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function AIPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  return <ErrorBoundary><AIPageClient /></ErrorBoundary>;
}
