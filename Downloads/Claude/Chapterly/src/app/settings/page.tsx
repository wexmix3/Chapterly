export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, handle, bio, avatar_url, is_public, onboarding_done')
    .eq('id', user.id)
    .maybeSingle();

  const { data: challenge } = await supabase
    .from('reading_challenges')
    .select('goal_books, goal_pages')
    .eq('user_id', user.id)
    .eq('year', new Date().getFullYear())
    .maybeSingle();

  return (
    <SettingsClient
      email={user.email ?? ''}
      profile={profile ?? { display_name: '', handle: '', bio: '', avatar_url: null, is_public: true, onboarding_done: false }}
      challenge={challenge ?? null}
    />
  );
}
