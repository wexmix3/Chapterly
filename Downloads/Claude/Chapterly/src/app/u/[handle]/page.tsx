export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ProfileClient from './ProfileClient';

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, bio, avatar_url, handle, is_public')
    .eq('handle', params.handle)
    .maybeSingle();

  if (!profile || !profile.is_public) {
    return { title: 'Reader | Chapterly' };
  }

  const name = profile.display_name || `@${params.handle}`;
  const description = profile.bio
    ? profile.bio.slice(0, 155)
    : `See ${name}'s reading shelf, reviews, and stats on Chapterly.`;

  return {
    title: `${name} | Chapterly`,
    description,
    openGraph: {
      title: `${name} on Chapterly`,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url, width: 400, height: 400, alt: name }] : [],
      type: 'profile',
      url: `https://chapterly.app/u/${params.handle}`,
    },
    twitter: {
      card: 'summary',
      title: `${name} on Chapterly`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
    alternates: {
      canonical: `https://chapterly.app/u/${params.handle}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <ProfileClient handle={params.handle} viewerId={user?.id ?? null} />;
}
