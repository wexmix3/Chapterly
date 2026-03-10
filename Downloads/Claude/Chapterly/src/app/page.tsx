export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function LandingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-paper-50">
      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 bg-paper-50/80 backdrop-blur-sm border-b border-ink-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="font-display text-lg font-bold text-ink-950">Chapterly</span>
        </div>
        <Link href="/login"
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-sm font-medium mb-8">
          <span>📚</span> Reading, but make it shareable
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-950 leading-tight mb-6">
          Track your reading.<br />
          <span className="text-brand-500">Share your journey.</span>
        </h1>
        <p className="text-lg text-ink-500 max-w-xl mx-auto mb-8">
          The most beautiful reading log you&apos;ll ever use. Build streaks, discover patterns, and create share cards that actually look good.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/login"
            className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-base font-semibold transition-colors shadow-lg shadow-brand-500/20">
            Start for free
          </Link>
          <p className="text-sm text-ink-400">Free. No ads. Your data is yours.</p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-ink-100 p-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-xl mb-4">🔥</div>
            <h3 className="font-display font-bold text-ink-900 mb-2">Build your streak</h3>
            <p className="text-sm text-ink-500">Forgiving streaks that don&apos;t punish a missed day. Streak protection unlocks at 3 days.</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-100 p-6">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl mb-4">✨</div>
            <h3 className="font-display font-bold text-ink-900 mb-2">Share-first design</h3>
            <p className="text-sm text-ink-500">Beautiful vertical story cards ready for TikTok and Instagram. Built for sharing, not afterthought.</p>
          </div>
          <div className="bg-white rounded-2xl border border-ink-100 p-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4">📊</div>
            <h3 className="font-display font-bold text-ink-900 mb-2">Stats that delight</h3>
            <p className="text-sm text-ink-500">Pages read, hours logged, streaks tracked. Know your reading habits better than ever.</p>
          </div>
        </div>
      </section>

      {/* Import CTA */}
      <section className="bg-ink-950 rounded-3xl mx-6 mb-16 p-10 md:p-14 max-w-4xl md:mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Bring your library with you
            </h2>
            <p className="text-ink-300 mb-6">
              Already on Goodreads? Import your entire library in seconds with our CSV importer. Every book, every rating, every shelf.
            </p>
            <Link href="/login"
              className="inline-flex px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors">
              Import from Goodreads →
            </Link>
          </div>
          <div className="flex-shrink-0 text-6xl">📦</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 px-6 py-8 text-center text-sm text-ink-400">
        <p>Built with Next.js, Supabase & Tailwind CSS.</p>
      </footer>
    </div>
  );
}
