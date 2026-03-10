import type { Metadata } from 'next';
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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
