export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ProgressClient from './ProgressClient';

export default async function ProgressPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  return <ProgressClient />;
}
