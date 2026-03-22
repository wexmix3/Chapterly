export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ClubsClient from './ClubsClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function ClubsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ErrorBoundary><ClubsClient /></ErrorBoundary>;
}
