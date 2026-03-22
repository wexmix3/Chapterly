export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import PeopleClient from './PeopleClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function PeoplePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ErrorBoundary><PeopleClient /></ErrorBoundary>;
}
