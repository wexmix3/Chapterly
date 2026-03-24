import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import { Analytics } from '@vercel/analytics/react';

const APP_URL = 'https://chapterly.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'Chapterly — Track, Share, Read More', template: '%s | Chapterly' },
  description:
    'The most shareable, habit-forming reading log. Track your books, build streaks, and share beautiful reading cards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chapterly',
  },
  openGraph: {
    siteName: 'Chapterly',
    title: 'Chapterly — Track, Share, Read More',
    description: 'The most shareable, habit-forming reading log. Track your books, build streaks, and share beautiful reading cards.',
    type: 'website',
    url: APP_URL,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Chapterly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chapterly — Track, Share, Read More',
    description: 'The most shareable, habit-forming reading log.',
    images: ['/og-default.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value;
  const isDark = theme === 'dark';

  return (
    <html lang="en" className={isDark ? 'dark' : ''} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#ee7a1e" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-paper-50 dark:bg-ink-950 text-ink-900 dark:text-paper-100 transition-colors">
        <PWARegister />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
