export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ClubDetailClient from './ClubDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data: club } = await supabase
    .from('clubs')
    .select('name, description, is_public')
    .eq('id', params.id)
    .maybeSingle();

  if (!club || !club.is_public) {
    return { title: 'Reading Club | Chapterly' };
  }

  const description = club.description
    ? club.description.slice(0, 155)
    : `Join ${club.name} — a reading club on Chapterly.`;

  return {
    title: `${club.name} | Chapterly`,
    description,
    openGraph: {
      title: `${club.name} on Chapterly`,
      description,
      type: 'website',
      url: `https://chapterly.app/clubs/${params.id}`,
    },
  };
}

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ClubDetailClient clubId={params.id} viewerId={user.id} />;
}
