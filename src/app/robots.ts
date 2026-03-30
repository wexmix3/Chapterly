import { MetadataRoute } from 'next';

const APP_URL = 'https://chapterly.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/u/', '/clubs/'],
        disallow: ['/dashboard', '/settings', '/onboarding', '/api/', '/ai/', '/premium/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
