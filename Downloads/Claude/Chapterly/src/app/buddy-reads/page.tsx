export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BuddyReadsClient from './BuddyReadsClient';

export default async function BuddyReadsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  return <BuddyReadsClient userId={session.user.id} />;
}
