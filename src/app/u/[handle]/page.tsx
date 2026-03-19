export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import ProfileClient from './ProfileClient';

export default async function ProfilePage({ params }: { params: { handle: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <ProfileClient handle={params.handle} viewerId={user?.id ?? null} />;
}
