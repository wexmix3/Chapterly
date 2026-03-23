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
          {/* HIDDEN: premium nav — re-enable when monetizing */}
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
              <span>✨</span> AI-powered · Social · Free forever
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-ink-950 leading-tight mb-5">
              Track every page.<br />
              <span className="text-brand-500">Share every chapter.</span>
            </h1>
            <p className="text-lg text-ink-500 mb-8 leading-relaxed">
              The reading tracker that GoodReads never built — with AI insights, streaks, social feeds, and beautiful share cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <Link href="/login"
                className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-base font-semibold transition-colors shadow-lg shadow-brand-500/20">
                Start for free
              </Link>
              <div className="flex flex-col items-start gap-1">
                <Link href="/demo"
                  className="px-8 py-3.5 bg-white border border-ink-200 hover:border-brand-300 hover:text-brand-700 text-ink-700 rounded-2xl text-base font-semibold transition-colors">
                  Try the demo →
                </Link>
                <p className="text-xs text-ink-400 pl-1">No account needed</p>
              </div>
            </div>
            <p className="text-xs text-ink-400 mt-4">Free forever · No credit card · Import from Goodreads in 30 sec</p>
          </div>

          {/* App preview card */}
          <div className="relative hidden md:block pt-6 pr-6">
            <div className="bg-white rounded-3xl border border-ink-100 shadow-2xl shadow-ink-900/8 overflow-hidden max-w-sm ml-auto">

              {/* Mock top bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-paper-50 border-b border-ink-100">
                <span className="text-sm">📖</span>
                <span className="font-display text-xs font-bold text-ink-950">Chapterly</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-100">
                  🔥 23-day streak
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Continue reading */}
                <div>
                  <p className="text-[9px] font-bold text-ink-400 uppercase tracking-widest mb-2">Continue Reading</p>
                  <div className="space-y-2">
                    {[
                      { title: 'Fourth Wing', author: 'Rebecca Yarros', pct: 59, grad: 'from-red-400 to-orange-500' },
                      { title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', pct: 18, grad: 'from-blue-400 to-indigo-500' },
                    ].map(b => (
                      <div key={b.title} className="flex items-center gap-3 p-2.5 bg-paper-50 rounded-xl">
                        <div className={`w-8 h-11 rounded-md flex-shrink-0 bg-gradient-to-br ${b.grad} flex items-end justify-end p-1`}>
                          <span className="text-[8px] text-white/80 font-bold leading-none">{b.title.split(' ').map((w: string) => w[0]).join('').slice(0,3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-ink-800 truncate">{b.title}</p>
                          <p className="text-[9px] text-ink-400 truncate">{b.author}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${b.pct}%` }} />
                            </div>
                            <span className="text-[9px] text-ink-400 flex-shrink-0">{b.pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI insight */}
                <div className="bg-gradient-to-br from-violet-50 to-brand-50 rounded-xl p-3 border border-violet-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] text-white">✨</span>
                    </div>
                    <p className="text-[9px] font-bold text-violet-700 uppercase tracking-wide">AI Insight · Claude</p>
                  </div>
                  <p className="text-[10px] text-ink-700 leading-relaxed font-medium">You read 40% faster on weekday mornings — try blocking 8–10am for sessions.</p>
                </div>

                {/* Friends strip */}
                <div className="rounded-xl border border-ink-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-paper-100 bg-paper-50/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
                    <p className="text-[9px] font-bold text-ink-500 uppercase tracking-wide">Friends Activity</p>
                  </div>
                  {[
                    { name: 'Sarah K.', action: 'finished', book: 'The Midnight Library', color: 'bg-violet-100 text-violet-700' },
                    { name: 'James R.', action: 'started', book: 'Fourth Wing', color: 'bg-blue-100 text-blue-700' },
                  ].map(e => (
                    <div key={e.name} className="flex items-center gap-2 px-3 py-2 border-b border-paper-50 last:border-0">
                      <div className={`w-5 h-5 rounded-full ${e.color} flex-shrink-0 flex items-center justify-center text-[8px] font-bold`}>
                        {e.name[0]}
                      </div>
                      <p className="text-[9px] text-ink-600 leading-snug truncate">
                        <span className="font-semibold">{e.name}</span> {e.action} <span className="font-medium">{e.book}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating streak badge */}
            <div className="absolute bottom-0 -left-4 bg-ink-950 rounded-2xl p-4 text-white text-center shadow-xl w-24">
              <div className="text-2xl mb-1">🔥</div>
              <p className="font-display text-xl font-bold">23</p>
              <p className="text-[9px] text-ink-400 uppercase tracking-wider">Day Streak</p>
            </div>

            {/* Floating stat */}
            <div className="absolute top-0 right-0 bg-emerald-500 rounded-2xl px-4 py-2.5 text-white shadow-lg">
              <p className="text-[9px] font-medium uppercase tracking-wide opacity-80">On pace for</p>
              <p className="font-display font-bold text-lg leading-tight">24 books</p>
              <p className="text-[9px] opacity-70">this year 🎯</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="bg-white border-y border-ink-100 py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-ink-500">
          <span>📚 <strong className="text-ink-800">Any book</strong>, tracked instantly</span>
          <span>🔥 <strong className="text-ink-800">Daily streaks</strong> that stick</span>
          <span>🤖 <strong className="text-ink-800">Claude AI</strong> powered insights</span>
          <span>📤 <strong className="text-ink-800">Free</strong> forever, no ads</span>
        </div>
      </div>

      {/* Three pillars */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-3">
          Built different. Not just different-looking.
        </h2>
        <p className="text-ink-500 text-center mb-14 max-w-lg mx-auto">
          Three things Goodreads never got right. We got all three.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🤖',
              gradient: 'from-violet-500 to-brand-500',
              bg: 'bg-violet-50',
              border: 'border-violet-100',
              label: 'AI Intelligence',
              title: 'Your reading coach, built in',
              desc: 'Claude analyzes your habits and surfaces insights you\'d never find yourself — peak reading times, genre patterns, what to read next.',
            },
            {
              icon: '👥',
              gradient: 'from-pink-500 to-rose-500',
              bg: 'bg-pink-50',
              border: 'border-pink-100',
              label: 'Social & Community',
              title: 'Reading is better together',
              desc: 'Follow friends, see their live activity, join book clubs, compete on leaderboards, and share your progress with beautiful story cards.',
            },
            {
              icon: '✦',
              gradient: 'from-brand-400 to-emerald-500',
              bg: 'bg-brand-50',
              border: 'border-brand-100',
              label: 'Clean UX',
              title: 'An app you\'ll actually open',
              desc: 'No clutter. No dark patterns. Just a fast, beautiful app that makes tracking feel rewarding — not like homework.',
            },
          ].map(p => (
            <div key={p.label} className={`${p.bg} rounded-2xl border ${p.border} p-6`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white text-lg mb-4 shadow-sm`}>
                {p.icon}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">{p.label}</p>
              <h3 className="font-display font-bold text-ink-900 mb-2">{p.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{p.desc}</p>
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

      {/* Social feed spotlight */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-100 rounded-full text-rose-600 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" /> Live friend activity
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-4">Reading is better with friends</h2>
            <p className="text-ink-500 mb-6 leading-relaxed">
              Follow other readers and see what your network is reading in real time. Get nudged when a friend finishes a book you&apos;ve been eyeing.
            </p>
            <ul className="space-y-3 text-sm text-ink-500 mb-8">
              {[
                'Live friend activity feed',
                'Follow readers by taste and genre',
                'Private book clubs with chapter discussion',
                'Beautiful share cards for every milestone',
              ].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/demo#friends"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
              See the social feed →
            </Link>
          </div>

          {/* Social feed mock */}
          <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-paper-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
                  <span className="text-[10px] text-white">👥</span>
                </div>
                <span className="font-display text-sm font-semibold text-ink-800">Friends Activity</span>
                <span className="flex items-center gap-1 text-[10px] text-rose-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" />
                  Live
                </span>
              </div>
            </div>
            <div className="divide-y divide-paper-50">
              {[
                { name: 'Sarah K.', initials: 'S', action: 'finished', book: 'The Midnight Library', time: '2h ago', color: 'bg-violet-100 text-violet-700' },
                { name: 'James R.', initials: 'J', action: 'started reading', book: 'Fourth Wing', time: '5h ago', color: 'bg-blue-100 text-blue-700' },
                { name: 'Maya T.', initials: 'M', action: 'rated ★★★★★', book: 'Demon Copperhead', time: 'yesterday', color: 'bg-emerald-100 text-emerald-700' },
                { name: 'Alex W.', initials: 'A', action: 'added', book: 'Tomorrow, and Tomorrow', time: '2d ago', color: 'bg-amber-100 text-amber-700' },
              ].map(e => (
                <div key={e.name} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-8 h-8 rounded-full ${e.color} flex-shrink-0 flex items-center justify-center text-xs font-bold`}>
                    {e.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-800 leading-snug">
                      <span className="font-semibold">{e.name}</span>{' '}
                      <span className="text-ink-400">{e.action}</span>{' '}
                      <span className="font-medium truncate">{e.book}</span>
                    </p>
                    <p className="text-[10px] text-ink-300 mt-0.5">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Insights spotlight */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
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
              <ul className="space-y-3 text-sm text-ink-300 mb-8">
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
              <Link href="/demo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-semibold transition-colors">
                See AI insights in action →
              </Link>
            </div>
            <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 w-full md:w-72">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-brand-400 flex items-center justify-center">
                  <span className="text-[10px]">✨</span>
                </div>
                <p className="text-sm font-semibold">AI Insights</p>
                <span className="ml-auto text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full">Claude</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { emoji: '📈', title: 'Morning Reader', body: 'You log 73% of your pages before noon on weekdays.', border: 'border-l-blue-400' },
                  { emoji: '🏆', title: '30-Day Milestone', body: "You've read every day this month — that's your longest streak ever!", border: 'border-l-emerald-400' },
                  { emoji: '📚', title: 'Try Fantasy', body: 'Based on your 5-star ratings, you might love The Name of the Wind.', border: 'border-l-violet-400' },
                ].map(insight => (
                  <div key={insight.title} className={`bg-white/5 rounded-xl p-3 border-l-[3px] ${insight.border} border border-white/10`}>
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
              ['Live social reading feed', true, false],
              ['Book clubs with progress tracking', true, false],
              ['Year in Books (Wrapped)', true, false],
              ['Streak leaderboard', true, false],
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

      {/* Pricing — 100% free */}
      <section id="pricing" className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-semibold mb-6">
          <span>🎉</span> No credit card. No catch.
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 mb-4">
          100% free. Everything included.
        </h2>
        <p className="text-ink-500 text-lg max-w-xl mx-auto mb-12">
          We believe great reading tools should be available to everyone. Every feature — AI insights, social feeds, share cards, streak tracking — is free.
        </p>
        <div className="bg-white rounded-2xl border border-ink-100 p-8 max-w-md mx-auto shadow-sm">
          <p className="text-5xl font-bold text-ink-950 mb-1">$0</p>
          <p className="text-ink-400 mb-8">Forever. No tricks. No paywalls.</p>
          <ul className="space-y-3 text-sm text-ink-600 text-left mb-8">
            {[
              'Unlimited book tracking',
              'AI reading insights + recommendations',
              'Streak tracking + milestones',
              'Beautiful share cards',
              'Reading calendar + stats',
              'Book clubs',
              'Goodreads import',
              'Public profile + social feed',
            ].map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/login"
            className="block text-center px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-brand-500/30">
            Create your free account →
          </Link>
        </div>
      </section>

      {/* HIDDEN: Premium pricing section — re-enable when monetizing */}

      {/* Goodreads switcher section */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="font-display text-2xl font-bold text-ink-950 text-center mb-3">The things Goodreads readers actually complain about</h2>
        <p className="text-ink-500 text-center text-sm mb-10 max-w-lg mx-auto">We built Chapterly to fix every one of them.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              pain: '"Goodreads hasn\'t added half-star ratings in 20 years"',
              fix: 'Rate in 0.5 increments — always.',
              emoji: '⭐',
              grad: 'from-amber-400 to-orange-500',
            },
            {
              pain: '"The feed is dead. Nobody uses it."',
              fix: 'Live friend activity the moment they start, finish, or rate a book.',
              emoji: '👥',
              grad: 'from-rose-400 to-pink-500',
            },
            {
              pain: '"I have no idea how or when I actually read."',
              fix: 'AI-powered insights — peak hours, pace trends, genre patterns.',
              emoji: '🤖',
              grad: 'from-violet-400 to-brand-500',
            },
            {
              pain: '"There\'s no way to share my reading on social."',
              fix: 'Beautiful 9:16 story cards, one tap to export for TikTok or Instagram.',
              emoji: '✨',
              grad: 'from-brand-400 to-emerald-500',
            },
            {
              pain: '"I lose my streak and just give up."',
              fix: 'Streak protection so one missed day doesn\'t erase your momentum.',
              emoji: '🔥',
              grad: 'from-red-400 to-orange-500',
            },
            {
              pain: '"Dark mode. Please."',
              fix: 'Full dark mode. Obviously.',
              emoji: '🌙',
              grad: 'from-indigo-400 to-slate-600',
            },
          ].map(c => (
            <div key={c.pain} className="bg-white rounded-2xl border border-ink-100 p-5 hover:border-brand-200 transition-colors">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-white text-base mb-4 shadow-sm`}>
                {c.emoji}
              </div>
              <p className="text-xs text-ink-400 italic mb-2">{c.pain}</p>
              <p className="text-sm font-semibold text-ink-800">{c.fix}</p>
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"
              className="inline-flex items-center justify-center px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-lg font-bold transition-colors shadow-xl shadow-brand-500/20">
              Create your free account →
            </Link>
            <Link href="/demo"
              className="inline-flex items-center justify-center px-10 py-4 bg-white border border-ink-200 hover:border-brand-300 text-ink-700 rounded-2xl text-lg font-semibold transition-colors">
              Try the demo
            </Link>
          </div>
          <p className="text-xs text-ink-400 mt-4">Import from Goodreads in 30 seconds. No credit card needed.</p>
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
            {/* HIDDEN: premium footer link — re-enable when monetizing */}
            <Link href="/demo" className="hover:text-ink-700 transition-colors">Demo</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-ink-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
