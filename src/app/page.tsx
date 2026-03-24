export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Sparkles, Flame, Users, CheckCircle, X } from 'lucide-react';

export default async function LandingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white text-ink-900">

      {/* ── Landing nav ── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 bg-white/90 backdrop-blur-sm border-b border-ink-100/60">
        <span className="font-display text-lg font-semibold text-ink-950 tracking-tight">Chapterly</span>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Features</Link>
          <Link href="/demo" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Demo</Link>
          <Link href="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors hidden sm:block">Sign in</Link>
          <Link href="/login" className="px-4 py-2 bg-ink-950 hover:bg-ink-800 text-white rounded-full text-sm font-medium transition-colors">
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Section 1: Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 rounded-full px-3 py-1 text-xs font-medium mb-8">
          AI-powered · Free forever
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-ink-950 leading-[1.05] mb-6">
          The reading app<br />
          built for readers<br />
          <span className="text-brand-500">who actually read.</span>
        </h1>

        <p className="text-xl text-ink-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          Track your books, get AI insights that match how you read,
          and connect with readers who share your taste.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="bg-ink-950 text-white px-8 py-3.5 rounded-full font-medium hover:bg-ink-800 transition-colors"
          >
            Start reading free
          </Link>
          <Link
            href="/demo"
            className="border border-ink-200 px-8 py-3.5 rounded-full text-ink-700 font-medium hover:border-ink-400 transition-colors"
          >
            See how it works
          </Link>
        </div>
        <p className="text-xs text-ink-400 mt-3">Free forever. No credit card.</p>
      </section>

      {/* ── Section 2: App preview ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-2xl shadow-2xl border border-ink-100 overflow-hidden bg-paper-50">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-ink-100">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-ink-100 rounded-md px-4 py-0.5 text-xs text-ink-500">app.chapterly.co</div>
            </div>
          </div>

          {/* Mock app content */}
          <div className="p-5 grid md:grid-cols-2 gap-4">
            {/* Left: Continue Reading */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Continue Reading</p>
              {[
                { title: 'Fourth Wing', author: 'Rebecca Yarros', pct: 59, grad: 'from-red-400 to-orange-500' },
                { title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', pct: 22, grad: 'from-blue-400 to-indigo-500' },
              ].map(b => (
                <div key={b.title} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-ink-100">
                  <div className={`w-9 h-12 rounded-lg flex-shrink-0 bg-gradient-to-br ${b.grad} flex items-end justify-end p-1`}>
                    <span className="text-[8px] text-white/80 font-bold leading-none">{b.title.split(' ').map((w: string) => w[0]).join('').slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-800 truncate">{b.title}</p>
                    <p className="text-[10px] text-ink-400 truncate">{b.author}</p>
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

            {/* Right: AI insight + stats strip */}
            <div className="space-y-3">
              {/* AI insight card */}
              <div className="bg-white rounded-xl border-l-4 border-brand-500 border border-ink-100 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">AI Insight</p>
                </div>
                <p className="text-xs text-ink-700 leading-relaxed font-medium">
                  You read 40% faster on weekday mornings. Your best reading window: 7–9am.
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Day Streak', value: '23', sub: 'days' },
                  { label: 'Today', value: '47', sub: 'pages' },
                  { label: 'This Year', value: '18', sub: 'books' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-ink-100 p-3 text-center">
                    <p className="font-display text-lg font-bold text-ink-950">{s.value}</p>
                    <p className="text-[9px] text-ink-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Streak fire */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                <Flame className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-ink-900">23-day streak</p>
                  <p className="text-xs text-ink-500">Keep it going — read for 5 min to continue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Three competitive advantages ── */}
      <section id="features" className="bg-paper-50 border-y border-ink-100 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-ink-400 uppercase tracking-widest mb-4">Why Chapterly</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-16">
            Built different. Not just different-looking.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'AI that reads your patterns',
                desc: 'Not just tracking — understanding. Chapterly analyzes your sessions, pace, and ratings to surface insights no other app can.',
              },
              {
                icon: Flame,
                title: 'A streak you\'ll want to keep',
                desc: 'Built-in reading streak with daily goals, milestone badges, and gentle reminders that keep you coming back without the guilt.',
              },
              {
                icon: Users,
                title: 'Find your people',
                desc: 'Follow readers with your taste. See what they\'re reading. Discover books through people you trust — not algorithms.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-ink-950 text-lg mb-3">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Feature highlights (alternating) ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 space-y-24">

        {/* Row 1: AI Insights */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">AI Insights</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-4">Your reading data, finally useful</h2>
            <p className="text-ink-500 leading-relaxed">
              See which hours you read fastest, which genres you abandon, and which books you&apos;re most likely to love — powered by Claude AI.
            </p>
          </div>
          <div className="bg-paper-50 rounded-2xl border border-ink-100 p-5 space-y-2.5">
            {[
              { title: 'Morning Reader', body: 'You log 73% of your pages before noon on weekdays.', color: 'border-l-blue-400' },
              { title: 'Genre Explorer', body: 'Fantasy is your top genre — 14 books finished with an average 4.6 rating.', color: 'border-l-violet-400' },
              { title: 'Finish Line', body: "At your current pace, you'll finish Fourth Wing in 4 days.", color: 'border-l-emerald-400' },
            ].map(i => (
              <div key={i.title} className={`bg-white rounded-xl p-3.5 border-l-[3px] ${i.color} border border-ink-100`}>
                <p className="text-xs font-semibold text-ink-900 mb-0.5">{i.title}</p>
                <p className="text-[11px] text-ink-500 leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Progress tracking */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-paper-50 rounded-2xl border border-ink-100 p-5 space-y-3 order-2 md:order-1">
            {/* Mini bar chart */}
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Books Per Month</p>
            <div className="flex items-end gap-1.5 h-20">
              {[
                { m: 'Oct', v: 3 }, { m: 'Nov', v: 5 }, { m: 'Dec', v: 2 },
                { m: 'Jan', v: 4 }, { m: 'Feb', v: 6 }, { m: 'Mar', v: 5 },
              ].map(({ m, v }) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-brand-400"
                    style={{ height: `${(v / 6) * 64}px` }}
                  />
                  <span className="text-[9px] text-ink-400">{m}</span>
                </div>
              ))}
            </div>
            {/* Streak calendar strip */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className={`aspect-square rounded-sm ${i < 18 ? 'bg-brand-400' : 'bg-ink-100'}`} />
              ))}
            </div>
            <p className="text-[10px] text-ink-400">18-day reading streak</p>
          </div>
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Progress</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-4">Watch the numbers go up</h2>
            <p className="text-ink-500 leading-relaxed">
              Pages read, books finished, reading streaks, genre breakdown, hours logged. Beautiful charts that make you want to open a book.
            </p>
          </div>
        </div>

        {/* Row 3: Social */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Social</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-4">Books are better together</h2>
            <p className="text-ink-500 leading-relaxed">
              See what your friends are reading. Join book clubs. Discover your next read through people who know your taste.
            </p>
          </div>
          <div className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 bg-white">
              <p className="text-xs font-bold text-ink-700">Friends Activity</p>
            </div>
            {[
              { name: 'Sarah K.', action: 'finished', book: 'The Midnight Library', color: 'bg-violet-100 text-violet-700', time: '2h ago' },
              { name: 'James R.', action: 'started reading', book: 'Fourth Wing', color: 'bg-blue-100 text-blue-700', time: '5h ago' },
              { name: 'Maya T.', action: 'rated 5 stars', book: 'Demon Copperhead', color: 'bg-emerald-100 text-emerald-700', time: 'yesterday' },
            ].map(e => (
              <div key={e.name} className="flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0 bg-white">
                <div className={`w-7 h-7 rounded-full ${e.color} flex-shrink-0 flex items-center justify-center text-[10px] font-bold`}>
                  {e.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-800 truncate">
                    <span className="font-semibold">{e.name}</span>{' '}
                    <span className="text-ink-400">{e.action}</span>{' '}
                    <span className="font-medium">{e.book}</span>
                  </p>
                  <p className="text-[10px] text-ink-300 mt-0.5">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Comparison table ── */}
      <section className="bg-paper-50 border-y border-ink-100 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-ink-950 text-center mb-3">Why switch?</h2>
          <p className="text-ink-500 text-center mb-12">Everything readers have always wanted — in one place.</p>

          <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 px-6 py-3 border-b border-ink-100 bg-paper-50">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Feature</span>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider text-center">Chapterly</span>
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider text-center">Others</span>
            </div>
            {[
              ['AI reading insights',     true,  false],
              ['Reading streak & goals',  true,  false],
              ['Ad-free experience',      true,  false],
              ['Modern mobile design',    true,  false],
              ['Social feed & clubs',     true,  true],
              ['Book search & discovery', true,  true],
              ['Reading statistics',      true,  'limited'],
              ['Free forever',            true,  true],
            ].map(([feature, ours, theirs]) => (
              <div key={String(feature)} className="grid grid-cols-3 px-6 py-3.5 border-b border-ink-50 last:border-0">
                <span className="text-sm text-ink-700">{String(feature)}</span>
                <span className="flex justify-center">
                  {ours === true
                    ? <CheckCircle className="w-4.5 h-4.5 text-brand-500" />
                    : <X className="w-4 h-4 text-ink-300" />
                  }
                </span>
                <span className="flex justify-center items-center">
                  {theirs === true
                    ? <CheckCircle className="w-4 h-4 text-ink-400" />
                    : theirs === 'limited'
                    ? <span className="text-xs text-ink-400">Limited</span>
                    : <X className="w-4 h-4 text-ink-300" />
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Final CTA ── */}
      <section className="px-4 md:px-8 py-24">
        <div className="max-w-4xl mx-auto bg-ink-950 text-white rounded-3xl px-8 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Start your reading streak today.
          </h2>
          <p className="text-ink-300 text-lg mb-10 max-w-lg mx-auto">
            Join readers who track smarter, read more, and actually enjoy it.
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-ink-950 px-8 py-3.5 rounded-full font-semibold hover:bg-paper-50 transition-colors"
          >
            Create free account
          </Link>
          <p className="text-ink-500 text-xs mt-4">Free forever. No credit card.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-100 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-400">
          <span className="font-display font-semibold text-ink-700">Chapterly</span>
          <p>© 2026 Chapterly</p>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hover:text-ink-700 transition-colors">Features</Link>
            <span>·</span>
            <Link href="/demo" className="hover:text-ink-700 transition-colors">Demo</Link>
            <span>·</span>
            <Link href="/login" className="hover:text-ink-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
