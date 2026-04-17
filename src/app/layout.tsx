import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import PWARegister from '@/components/PWARegister';
import { Analytics } from '@vercel/analytics/react';
import PostHogProvider from '@/components/providers/PostHogProvider';
import PageTracker from '@/components/providers/PageTracker';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
});

const APP_URL = 'https://www.getchapterly.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: 'Chapterly — Reading Tracker & Book Log', template: '%s | Chapterly' },
  description:
    'The Goodreads alternative built for modern readers. Track books, build reading streaks, get AI-powered insights, and connect with your reading community.',
  keywords: ['reading tracker', 'book tracker', 'reading log', 'book log', 'Goodreads alternative', 'book tracking app', 'reading habit', 'reading streak'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chapterly',
  },
  openGraph: {
    siteName: 'Chapterly',
    title: 'Chapterly — Reading Tracker & Book Log',
    description: 'The Goodreads alternative built for modern readers. Track books, build reading streaks, and get AI-powered insights.',
    type: 'website',
    url: APP_URL,
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Chapterly — Reading Tracker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chapterly — Reading Tracker & Book Log',
    description: 'The Goodreads alternative built for modern readers. Track books, build reading streaks, and get AI-powered insights.',
    images: ['/api/og'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value;
  const isDark = theme === 'dark';

  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}${isDark ? ' dark' : ''}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#ee7a1e" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-paper-50 dark:bg-ink-950 text-ink-900 dark:text-paper-100 transition-colors">
        <PostHogProvider>
          <PageTracker />
          <PWARegister />
          <Analytics />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
