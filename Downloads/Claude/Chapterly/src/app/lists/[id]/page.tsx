export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import ListDetailClient from './ListDetailClient';

export default async function ListPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <ListDetailClient listId={params.id} viewerId={user?.id ?? null} />;
}
