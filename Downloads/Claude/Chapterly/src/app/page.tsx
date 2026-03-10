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
        <div className="flex items-center gap-3">
          <Link href="/demo" className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors hidden sm:block">
            Live Demo
          </Link>
          <Link href="/login"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-sm font-medium mb-6">
              <span>🔥</span> BookTok&apos;s favorite reading tracker
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-950 leading-tight mb-5">
              Track your reading.<br />
              <span className="text-brand-500">Share your journey.</span>
            </h1>
            <p className="text-lg text-ink-500 mb-8 leading-relaxed">
              The most beautiful reading log you&apos;ll ever use. Build streaks, discover what BookTok loves, and create share cards that actually look good.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <Link href="/login"
                className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-base font-semibold transition-colors shadow-lg shadow-brand-500/20">
                Start for free
              </Link>
              <Link href="/demo"
                className="px-8 py-3.5 bg-white border border-ink-200 hover:border-ink-300 text-ink-700 rounded-2xl text-base font-semibold transition-colors">
                See live demo →
              </Link>
            </div>
            <p className="text-xs text-ink-400 mt-4">Free forever. No ads. No paywalls.</p>
          </div>

          {/* App preview card */}
          <div className="relative hidden md:block">
            <div className="bg-white rounded-3xl border border-ink-100 shadow-2xl shadow-ink-900/10 p-5 max-w-sm ml-auto">
              {/* Mini dashboard preview */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">📖</span>
                <span className="font-display text-sm font-bold text-ink-950">Chapterly</span>
                <span className="ml-auto text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">🔥 23-day streak</span>
              </div>
              <div className="space-y-2.5 mb-4">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Continue Reading</p>
                {[
                  { title: 'Fourth Wing', author: 'Rebecca Yarros', pct: 59, cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg' },
                  { title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', pct: 18, cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg' },
                ].map(b => (
                  <div key={b.title} className="flex items-center gap-3 p-2.5 bg-paper-50 rounded-xl">
                    <div className="w-8 h-11 rounded-md overflow-hidden flex-shrink-0 bg-paper-200">
                      <img src={b.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-ink-800 truncate">{b.title}</p>
                      <p className="text-[9px] text-ink-400 truncate">{b.author}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1 bg-ink-100 rounded-full">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${b.pct}%` }} />
                        </div>
                        <span className="text-[9px] text-ink-400">{b.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Books', value: '47' },
                  { label: 'Pages', value: '12.8k' },
                  { label: 'Avg ★', value: '4.2' },
                ].map(s => (
                  <div key={s.label} className="bg-paper-50 rounded-xl p-2.5 text-center">
                    <p className="font-display text-base font-bold text-ink-950">{s.value}</p>
                    <p className="text-[9px] text-ink-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating share card */}
            <div className="absolute -bottom-6 -left-8 bg-ink-950 rounded-2xl p-4 text-white text-center shadow-xl w-28">
              <div className="text-3xl mb-1">🔥</div>
              <p className="font-display text-2xl font-bold">23</p>
              <p className="text-[10px] text-ink-400 uppercase tracking-wider">Day Streak</p>
            </div>

            {/* Floating stat */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 rounded-2xl px-4 py-2.5 text-white shadow-lg">
              <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">On pace for</p>
              <p className="font-display font-bold text-lg leading-tight">24 books</p>
              <p className="text-[10px] opacity-70">this year 🎯</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="bg-white border-y border-ink-100 py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-ink-500">
          <span>📚 <strong className="text-ink-800">10,000+</strong> books tracked</span>
          <span>🔥 <strong className="text-ink-800">Avg 12</strong> day streaks</span>
          <span>🌟 <strong className="text-ink-800">4.9★</strong> rating</span>
          <span>📤 <strong className="text-ink-800">Free</strong> forever, no ads</span>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-4">
          Built for readers who love books <em>and</em> sharing them
        </h2>
        <p className="text-ink-500 text-center mb-12 max-w-xl mx-auto">
          Everything Goodreads should have been. Beautiful, fast, and actually fun to use.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { emoji: '🔥', title: 'Forgiving Streaks', desc: "Streak protection unlocks at 3 days. Miss a day without losing your progress — because life happens.", accent: 'brand' },
            { emoji: '✨', title: 'Share-First Design', desc: "Beautiful 9:16 story cards ready for TikTok and Instagram. Four themes. No design skills required.", accent: 'purple' },
            { emoji: '📊', title: 'Stats That Delight', desc: "Pages read, hours logged, streaks tracked, reading calendar. Know your habits better than ever.", accent: 'emerald' },
            { emoji: '🔥', title: 'BookTok Creator Hub', desc: "See what BookTok creators are reading. Creator-curated lists. \"Trending on BookTok\" updated weekly.", accent: 'red' },
            { emoji: '⭐', title: 'Half-Star Ratings', desc: "The feature Goodreads users have begged for since 2007. Rate in 0.5 increments. Finally.", accent: 'amber' },
            { emoji: '📦', title: 'Goodreads Import', desc: "Bring your entire library in seconds. Every book, every shelf, every rating. One CSV file.", accent: 'blue' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-ink-100 p-6 hover:border-ink-200 hover:shadow-sm transition-all">
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="font-display font-bold text-ink-900 mb-2">{f.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-ink-950 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-2">Why not Goodreads?</h2>
          <p className="text-ink-400 text-center mb-10">We built what they never did.</p>
          <div className="bg-ink-900 rounded-2xl overflow-hidden border border-ink-800">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider text-ink-400 px-6 py-3 border-b border-ink-800">
              <span>Feature</span>
              <span className="text-center text-brand-400">Chapterly</span>
              <span className="text-center">Goodreads</span>
            </div>
            {[
              ['BookTok creator hub', true, false],
              ['Half-star ratings', true, false],
              ['Forgiving streaks', true, false],
              ['Beautiful share cards', true, false],
              ['Dark mode', true, false],
              ['No ads ever', true, false],
              ['Reading calendar', true, false],
              ['Book reviews', true, true],
              ['Goodreads import', true, true],
            ].map(([feature, ours, theirs]) => (
              <div key={String(feature)} className="grid grid-cols-3 px-6 py-3 border-b border-ink-800/50 text-sm">
                <span className="text-ink-300">{feature}</span>
                <span className="text-center text-brand-400 font-bold">{ours ? '✓' : '—'}</span>
                <span className="text-center text-ink-500">{theirs ? '✓' : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goodreads import CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-10 md:p-14 text-white">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="font-display text-3xl font-bold mb-3">Bring your library with you</h2>
              <p className="text-brand-100 mb-6">
                Already on Goodreads? Import your entire library in seconds. Every book, every rating, every shelf — no manual entry.
              </p>
              <Link href="/login"
                className="inline-flex px-6 py-3 bg-white text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition-colors">
                Import from Goodreads →
              </Link>
            </div>
            <div className="flex-shrink-0 text-6xl">📦</div>
          </div>
        </div>
      </section>

      {/* Creator testimonials */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl font-bold text-ink-950 text-center mb-8">BookTok creators love it</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { handle: '@readingwithray', platform: 'TikTok', quote: "Finally a reading app that gets it. The share cards are stunning and my followers love seeing my progress.", followers: '890K' },
            { handle: '@pagebypageclub', platform: 'Instagram', quote: "Switched from Goodreads and never looked back. The streak system actually keeps me reading every day.", followers: '420K' },
            { handle: '@booknerdvibes', platform: 'TikTok', quote: "The BookTok creator hub is genius. I can see who's recommending what and discover books I actually want to read.", followers: '1.2M' },
          ].map(t => (
            <div key={t.handle} className="bg-white rounded-2xl border border-ink-100 p-6">
              <p className="text-sm text-ink-600 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                  {t.handle[1].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.handle}</p>
                  <p className="text-[11px] text-ink-400">{t.platform} • {t.followers} followers</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-paper-100 border-t border-ink-100 py-16 px-6 text-center">
        <h2 className="font-display text-4xl font-bold text-ink-950 mb-4">Start reading smarter today.</h2>
        <p className="text-ink-500 mb-8">Free forever. No credit card. Import from Goodreads in 30 seconds.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login"
            className="px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-base font-bold transition-colors shadow-lg shadow-brand-500/20">
            Create your reading journal →
          </Link>
          <Link href="/demo"
            className="px-10 py-4 bg-white border border-ink-200 hover:border-ink-300 text-ink-700 rounded-2xl text-base font-bold transition-colors">
            Try the demo first
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-400">
          <div className="flex items-center gap-2">
            <span>📖</span>
            <span className="font-display font-bold text-ink-700">Chapterly</span>
          </div>
          <p>© 2026 Chapterly. Track, Share, Read More.</p>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="hover:text-ink-700 transition-colors">Demo</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-ink-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
