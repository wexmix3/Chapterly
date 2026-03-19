export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function LandingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">

      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 bg-paper-50/80 backdrop-blur-sm border-b border-ink-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="font-display text-lg font-bold text-ink-950">Chapterly</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#features" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Features</Link>
          <Link href="#premium" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Premium</Link>
          <Link href="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors hidden sm:block">Sign in</Link>
          <Link href="/login"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-brand-500/30">
            Start free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-xs font-semibold mb-6">
              <span>🔥</span> The reading tracker BookTok actually uses
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-950 leading-tight mb-5">
              Track every page.<br />
              <span className="text-brand-500">Share every chapter.</span>
            </h1>
            <p className="text-lg text-ink-500 mb-8 leading-relaxed">
              Beautiful reading logs, streak tracking, book clubs, AI-powered recommendations, and share cards built for social — all in one free app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <Link href="/login"
                className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-base font-semibold transition-colors shadow-lg shadow-brand-500/20">
                Start for free
              </Link>
              <Link href="#features"
                className="px-8 py-3.5 bg-white border border-ink-200 hover:border-ink-300 text-ink-700 rounded-2xl text-base font-semibold transition-colors">
                See what&apos;s inside →
              </Link>
            </div>
            <p className="text-xs text-ink-400 mt-4">Free forever · No credit card · Import from Goodreads in 30 sec</p>
          </div>

          {/* App preview card */}
          <div className="relative hidden md:block">
            <div className="bg-white rounded-3xl border border-ink-100 shadow-2xl shadow-ink-900/10 p-5 max-w-sm ml-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">📖</span>
                <span className="font-display text-sm font-bold text-ink-950">Chapterly</span>
                <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-100">🔥 23-day streak</span>
              </div>
              <div className="space-y-2.5 mb-4">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Continue Reading</p>
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
              {/* AI Insights preview */}
              <div className="bg-gradient-to-br from-brand-50 to-amber-50 rounded-xl p-3 border border-brand-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">✨</span>
                  <p className="text-[10px] font-semibold text-brand-700">AI Insight</p>
                </div>
                <p className="text-[10px] text-ink-600 leading-relaxed">You read 40% faster on weekday mornings. Try scheduling your sessions before 10am!</p>
              </div>
            </div>

            {/* Floating streak badge */}
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
      <div className="bg-white border-y border-ink-100 py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-ink-500">
          <span>📚 <strong className="text-ink-800">10,000+</strong> books tracked</span>
          <span>🔥 <strong className="text-ink-800">Avg 12</strong> day streaks</span>
          <span>🤖 <strong className="text-ink-800">Claude AI</strong> powered insights</span>
          <span>📤 <strong className="text-ink-800">Free</strong> forever, no ads</span>
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-3">
          Up and running in 60 seconds
        </h2>
        <p className="text-ink-500 text-center mb-14 max-w-lg mx-auto">
          No setup. No configuration. Just start reading.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', emoji: '📦', title: 'Import or start fresh', desc: 'Drag in your Goodreads CSV to bring your entire library, or search any book and add it in seconds.' },
            { step: '02', emoji: '📝', title: 'Log your sessions', desc: 'Tap "Log Reading" after each session. Enter pages or minutes. Your streak builds automatically.' },
            { step: '03', emoji: '✨', title: 'Share & discover', desc: 'Get AI-powered insights on your habits, create stunning share cards, and join book clubs with friends.' },
          ].map(s => (
            <div key={s.step} className="relative bg-white rounded-2xl border border-ink-100 p-6 hover:shadow-sm transition-all">
              <div className="text-xs font-bold text-ink-200 mb-4 font-mono">{s.step}</div>
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h3 className="font-display font-bold text-ink-900 mb-2">{s.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white border-y border-ink-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-3">
            Everything Goodreads should have been
          </h2>
          <p className="text-ink-500 text-center mb-14 max-w-xl mx-auto">
            Beautiful, fast, social — and actually fun to use.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { emoji: '🤖', title: 'AI Reading Insights', desc: "Claude analyzes your reading habits and gives you personalized insights — when you read fastest, what genres you love, what to read next.", badge: 'New' },
              { emoji: '🔥', title: 'Streak Tracking', desc: "Build daily reading streaks with forgiving protection. Earn milestone badges at 7, 30, 100, and 365 days. See your rank on the global leaderboard.", badge: null },
              { emoji: '📖', title: 'Book Clubs', desc: "Create private or public book clubs, track group reading progress, and discuss chapters with spoiler protection built in.", badge: 'New' },
              { emoji: '🎁', title: 'Year in Books', desc: "Your personal Spotify Wrapped for reading. See your top books, best month, fastest reads, and favorite genres — beautifully designed.", badge: 'New' },
              { emoji: '✨', title: 'Share Cards', desc: "Beautiful 9:16 story cards for TikTok and Instagram. Four themes. One tap to export. No design skills needed.", badge: null },
              { emoji: '📊', title: 'Deep Stats', desc: "Pages, hours, streaks, reading calendar, monthly charts. Know your habits better than any app has shown you before.", badge: null },
              { emoji: '🏆', title: 'Leaderboard', desc: "See how your reading stacks up against friends and the world. Compete on streak days, books read, or total pages.", badge: 'New' },
              { emoji: '⭐', title: 'Half-Star Ratings', desc: "The feature Goodreads users have begged for since 2007. Rate books in 0.5 increments. Finally.", badge: null },
              { emoji: '📦', title: 'Goodreads Import', desc: "Bring your entire reading history in seconds. Every book, every shelf, every rating. One CSV file.", badge: null },
            ].map(f => (
              <div key={f.title} className="bg-paper-50 rounded-2xl border border-ink-100 p-6 hover:border-brand-200 hover:bg-brand-50/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{f.emoji}</div>
                  {f.badge && (
                    <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">{f.badge}</span>
                  )}
                </div>
                <h3 className="font-display font-bold text-ink-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights spotlight */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 rounded-3xl p-10 md:p-14 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-brand-300 text-xs font-semibold mb-5">
                <span>✨</span> Powered by Claude AI
              </div>
              <h2 className="font-display text-3xl font-bold mb-4">Insights that actually help you read more</h2>
              <p className="text-ink-300 mb-6 leading-relaxed">
                Chapterly uses Claude — Anthropic&apos;s AI — to analyze your reading patterns and surface genuinely useful insights. Not generic tips. Your data, your habits, your recommendations.
              </p>
              <ul className="space-y-3 text-sm text-ink-300">
                {[
                  'Discover when you read fastest during the day',
                  'Get 6 personalized book recommendations based on your taste',
                  'Understand which genres you actually finish vs. abandon',
                  'See patterns in your reading pace and session length',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-brand-400 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 w-full md:w-72">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-amber-400 flex items-center justify-center">
                  <span className="text-[10px]">✨</span>
                </div>
                <p className="text-sm font-semibold">AI Insights</p>
                <span className="ml-auto text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">Beta</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { type: 'pattern', emoji: '📈', title: 'Morning Reader', body: 'You log 73% of your pages before noon on weekdays.' },
                  { type: 'achievement', emoji: '🏆', title: '30-Day Milestone', body: "You've read every day this month — that's your longest streak ever!" },
                  { type: 'suggestion', emoji: '📚', title: 'Try Fantasy', body: 'Based on your 5-star ratings, you might love The Name of the Wind.' },
                ].map(insight => (
                  <div key={insight.title} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{insight.emoji}</span>
                      <p className="text-xs font-semibold text-white">{insight.title}</p>
                    </div>
                    <p className="text-[10px] text-ink-400 leading-relaxed">{insight.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-ink-950 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-2">Why not Goodreads?</h2>
          <p className="text-ink-400 text-center mb-10">We built what they never did. And kept building.</p>
          <div className="bg-ink-900 rounded-2xl overflow-hidden border border-ink-800">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider text-ink-400 px-6 py-3 border-b border-ink-800">
              <span>Feature</span>
              <span className="text-center text-brand-400">Chapterly</span>
              <span className="text-center">Goodreads</span>
            </div>
            {[
              ['AI-powered insights', true, false],
              ['Book clubs with progress tracking', true, false],
              ['Year in Books (Wrapped)', true, false],
              ['Streak leaderboard', true, false],
              ['BookTok creator hub', true, false],
              ['Half-star ratings', true, false],
              ['Beautiful share cards', true, false],
              ['Dark mode', true, false],
              ['No ads ever', true, false],
              ['Reading calendar heatmap', true, false],
              ['Goodreads import', true, true],
              ['Book reviews', true, true],
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

      {/* Premium */}
      <section id="premium" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 mb-3">Free forever. Or go Premium.</h2>
          <p className="text-ink-500 max-w-xl mx-auto">Everything you need is free. Premium is for readers who want the full experience.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-ink-100 p-7">
            <h3 className="font-display text-xl font-bold text-ink-900 mb-1">Free</h3>
            <p className="text-3xl font-bold text-ink-950 mb-1">$0<span className="text-base font-normal text-ink-400">/mo</span></p>
            <p className="text-sm text-ink-400 mb-6">Forever. No tricks.</p>
            <ul className="space-y-2.5 text-sm text-ink-600">
              {[
                'Unlimited book tracking',
                'Streak tracking + milestones',
                'AI insights + recommendations',
                'Share cards (4 themes)',
                'Reading calendar + stats',
                '1 book club',
                'Goodreads import',
                'Public profile + followers',
              ].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/login" className="mt-8 block text-center px-6 py-3 bg-paper-100 hover:bg-paper-200 text-ink-700 rounded-xl font-semibold text-sm transition-colors">
              Start free
            </Link>
          </div>
          {/* Premium */}
          <div className="bg-ink-950 rounded-2xl border border-ink-800 p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-xl font-bold text-white">Premium</h3>
                <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-semibold">Popular</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">$4.99<span className="text-base font-normal text-ink-400">/mo</span></p>
              <p className="text-sm text-ink-400 mb-6">7-day free trial, cancel anytime.</p>
              <ul className="space-y-2.5 text-sm text-ink-300">
                {[
                  'Everything in Free',
                  'Unlimited book clubs',
                  'Advanced stats & analytics',
                  'Custom share card themes',
                  '1 streak freeze per month',
                  'Ad-free experience',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-brand-400 font-bold">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/login" className="mt-8 block text-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors">
                Start 7-day free trial →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Goodreads import CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
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
            <div className="flex-shrink-0 text-7xl">📦</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl font-bold text-ink-950 text-center mb-8">BookTok creators love it</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { handle: '@readingwithray', platform: 'TikTok', quote: "Finally a reading app that gets it. The share cards are stunning and my followers love seeing my progress.", followers: '890K' },
            { handle: '@pagebypageclub', platform: 'Instagram', quote: "Switched from Goodreads and never looked back. The streak system actually keeps me reading every day.", followers: '420K' },
            { handle: '@booknerdvibes', platform: 'TikTok', quote: "The AI insights are wild — it told me I read 40% faster in the mornings. Now I block that time every day.", followers: '1.2M' },
          ].map(t => (
            <div key={t.handle} className="bg-white rounded-2xl border border-ink-100 p-6">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(n => <span key={n} className="text-amber-400 text-xs">★</span>)}
              </div>
              <p className="text-sm text-ink-600 italic mb-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                  {t.handle[1].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{t.handle}</p>
                  <p className="text-[11px] text-ink-400">{t.platform} · {t.followers} followers</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-paper-100 border-t border-ink-100 py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-brand-600 text-sm font-semibold mb-3 uppercase tracking-widest">Start today</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-950 mb-5 leading-tight">
            Read more.<br />Share more.<br />Enjoy it more.
          </h2>
          <p className="text-ink-500 mb-8">Free forever. No credit card. Import from Goodreads in 30 seconds.</p>
          <Link href="/login"
            className="inline-flex items-center px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-lg font-bold transition-colors shadow-xl shadow-brand-500/20">
            Create your reading journal →
          </Link>
          <p className="text-xs text-ink-400 mt-4">Join thousands of readers already tracking with Chapterly</p>
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
            <Link href="#features" className="hover:text-ink-700 transition-colors">Features</Link>
            <span>·</span>
            <Link href="#premium" className="hover:text-ink-700 transition-colors">Premium</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-ink-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
