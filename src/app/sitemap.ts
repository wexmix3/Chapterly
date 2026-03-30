import { MetadataRoute } from 'next';
import { createAdminSupabaseClient } from '@/lib/supabase-server';

const APP_URL = 'https://chapterly.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminSupabaseClient();

  // Fetch public user handles
  const { data: users } = await supabase
    .from('users')
    .select('handle, updated_at')
    .eq('is_public', true)
    .not('handle', 'is', null)
    .limit(1000);

  // Fetch public clubs
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, updated_at')
    .eq('is_public', true)
    .limit(500);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const userRoutes: MetadataRoute.Sitemap = (users ?? []).map((u) => ({
    url: `${APP_URL}/u/${u.handle}`,
    lastModified: u.updated_at ? new Date(u.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const clubRoutes: MetadataRoute.Sitemap = (clubs ?? []).map((c) => ({
    url: `${APP_URL}/clubs/${c.id}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...userRoutes, ...clubRoutes];
}
