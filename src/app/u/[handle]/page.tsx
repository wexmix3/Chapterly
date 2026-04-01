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
    .select('id, display_name, bio, avatar_url, handle, is_public')
    .eq('handle', params.handle)
    .maybeSingle();

  if (!profile || !profile.is_public) {
    return { title: 'Reader | Chapterly' };
  }

  // Count books read for the OG image stat
  const { count: booksRead } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'read');

  const name = profile.display_name || `@${params.handle}`;
  const description = profile.bio
    ? profile.bio.slice(0, 155)
    : `See ${name}'s reading shelf, reviews, and stats on Chapterly.`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getchapterly.com';
  const ogParams = new URLSearchParams({
    type: 'profile',
    name,
    handle: params.handle,
    books: String(booksRead ?? 0),
    ...(profile.avatar_url ? { avatar: profile.avatar_url } : {}),
  });
  const ogImageUrl = `${appUrl}/api/og?${ogParams.toString()}`;

  return {
    title: `${name} | Chapterly`,
    description,
    openGraph: {
      title: `${name} on Chapterly`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${name}'s Chapterly profile` }],
      type: 'profile',
      url: `${appUrl}/u/${params.handle}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} on Chapterly`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${appUrl}/u/${params.handle}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createServerSupabaseClient();

  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('users')
      .select('display_name, bio, avatar_url, handle, is_public')
      .eq('handle', params.handle)
      .maybeSingle(),
  ]);

  const jsonLd =
    profile && profile.is_public
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.display_name ?? `@${params.handle}`,
          url: `https://getchapterly.com/u/${params.handle}`,
          description: profile.bio ?? undefined,
          image: profile.avatar_url ?? undefined,
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient handle={params.handle} viewerId={user?.id ?? null} />
    </>
  );
}
