import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chapterly — Track, Share, Read More',
  description:
    'The most shareable, habit-forming reading log. Track your books, build streaks, and share beautiful reading cards.',
  openGraph: {
    title: 'Chapterly',
    description: 'Track, Share, Read More.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value;
  const isDark = theme === 'dark';

  return (
    <html lang="en" className={isDark ? 'dark' : ''}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-paper-50 dark:bg-ink-950 text-ink-900 dark:text-paper-100 transition-colors">
        {children}
      </body>
    </html>
  );
}
