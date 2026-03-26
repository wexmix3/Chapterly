export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Sparkles, Flame, Users, CheckCircle, X, Star } from 'lucide-react';

// Real book covers — verified OpenLibrary ISBNs used throughout the app
const HERO_BOOKS = [
  { isbn: '9781649374042', title: 'Fourth Wing' },
  { isbn: '9780735211292', title: 'Atomic Habits' },
  { isbn: '9780525559474', title: 'The Midnight Library' },
  { isbn: '9780385547345', title: 'Lessons in Chemistry' },
  { isbn: '9781250301697', title: 'The Seven Husbands of Evelyn Hugo' },
  { isbn: '9781619635180', title: 'A Court of Thorns and Roses' },
];

export default async function LandingPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white text-ink-900">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 bg-white/95 backdrop-blur-sm border-b border-ink-100/60">
        <span className="font-display text-xl font-bold text-ink-950">Chapterly</span>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Features</Link>
          <Link href="/demo" className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors hidden sm:block">Demo</Link>
          <Link href="/login" className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors hidden sm:block">Sign in</Link>
          <Link href="/login" className="px-4 py-2 bg-ink-950 hover:bg-ink-800 text-white rounded-full text-sm font-medium transition-colors">
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero: split layout ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 border border-brand-200 text-brand-700 rounded-full px-3 py-1 text-xs font-medium mb-8 bg-brand-50">
            AI-powered · Free forever
          </div>
          <h1 className="font-display text-5xl md:text-[3.5rem] font-bold text-ink-950 leading-[1.08] mb-6">
            Your reading life,<br />
            <span className="text-brand-500 italic">beautifully</span><br />
            tracked.
          </h1>
          <p className="text-lg text-ink-500 leading-relaxed mb-8 max-w-md">
            Track books, surface AI insights that match how you actually read, and connect with readers who share your taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="bg-ink-950 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-ink-800 transition-colors text-sm text-center"
            >
              Start reading free
            </Link>
            <Link
              href="/demo"
              className="border border-ink-200 px-7 py-3.5 rounded-full text-ink-700 font-semibold hover:border-ink-400 hover:bg-paper-50 transition-colors text-sm text-center"
            >
              See how it works
            </Link>
          </div>
          {/* Social proof */}
          <div className="flex items-center gap-2.5 mt-8">
            <div className="flex">
              {[0,1,2,3,4].map(i => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm text-ink-500">Loved by <span className="font-semibold text-ink-800">10,000+ readers</span></span>
          </div>
        </div>

        {/* Right: book cover mosaic */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-3">
            {HERO_BOOKS.map((book, i) => (
              <div
                key={book.isbn}
                className={`aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-ink-100 ${
                  i % 2 === 1 ? 'mt-5' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-ink-950 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Active readers' },
            { value: '500,000+', label: 'Pages tracked' },
            { value: '4.9 ★', label: 'Average rating' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-ink-400 text-sm">{s.label}</p>
            </div>
          ))}
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
                title: "A streak you'll want to keep",
                desc: 'Built-in reading streak with daily goals, milestone badges, and gentle reminders that keep you coming back without the guilt.',
              },
              {
                icon: Users,
                title: 'Find your people',
                desc: "Follow readers with your taste. See what they're reading. Discover books through people you trust — not algorithms.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="font-display font-bold text-ink-950 text-xl mb-3">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Feature highlights ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 space-y-28">

        {/* Row 1: AI Insights */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">AI Insights</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-5">Your reading data, finally useful</h2>
            <p className="text-ink-500 leading-relaxed mb-6">
              See which hours you read fastest, which genres you abandon, and which books you&apos;re most likely to love — powered by Claude AI.
            </p>
            <ul className="space-y-2.5">
              {[
                'Personalized reading pace analysis',
                'Genre preference mapping',
                'Finish probability predictions',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-700">
                  <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-paper-50 rounded-2xl border border-ink-100 p-5 space-y-2.5">
            {[
              { title: 'Morning Reader', body: 'You log 73% of your pages before noon on weekdays.', color: 'border-l-blue-400' },
              { title: 'Genre Explorer', body: 'Fantasy is your top genre — 14 books finished with an average 4.6 rating.', color: 'border-l-violet-400' },
              { title: 'Finish Line', body: "At your current pace, you'll finish Fourth Wing in 4 days.", color: 'border-l-brand-400' },
            ].map(i => (
              <div key={i.title} className={`bg-white rounded-xl p-4 border-l-[3px] ${i.color} border border-ink-100`}>
                <p className="text-xs font-bold text-ink-900 mb-1">{i.title}</p>
                <p className="text-[11px] text-ink-500 leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Progress tracking */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-paper-50 rounded-2xl border border-ink-100 p-6 space-y-4 order-2 md:order-1">
            {/* Books this year with real covers */}
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Books completed this year</p>
            <div className="flex gap-2 flex-wrap">
              {[
                '9781649374042',
                '9780385547345',
                '9780525559474',
                '9780593334867',
                '9781250178602',
              ].map(isbn => (
                <div key={isbn} className="w-9 h-[54px] rounded-md overflow-hidden shadow-sm ring-1 ring-ink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <div className="w-9 h-[54px] rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                +13
              </div>
            </div>
            {/* Streak calendar strip */}
            <div>
              <p className="text-[10px] text-ink-400 mb-2">Reading streak</p>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i} className={`aspect-square rounded-sm ${i < 11 ? 'bg-brand-400' : 'bg-ink-100'}`} />
                ))}
              </div>
              <p className="text-[10px] text-ink-500 mt-1.5 font-medium">11-day streak · keep going</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Progress</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-5">Watch the numbers go up</h2>
            <p className="text-ink-500 leading-relaxed mb-6">
              Pages read, books finished, reading streaks, genre breakdown, hours logged. Beautiful charts that make you want to open a book.
            </p>
            <ul className="space-y-2.5">
              {[
                'Daily and weekly reading stats',
                'Goal tracking with milestone badges',
                'Year-in-reading summary',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-700">
                  <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 3: Social */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Social</p>
            <h2 className="font-display text-3xl font-bold text-ink-950 mb-5">Books are better together</h2>
            <p className="text-ink-500 leading-relaxed mb-6">
              See what your friends are reading. Join book clubs. Discover your next read through people who share your taste.
            </p>
            <ul className="space-y-2.5">
              {[
                'Follow readers with your taste',
                'Activity feed and social reviews',
                'Reading challenges and leaderboards',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-ink-700">
                  <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 bg-white">
              <p className="text-xs font-bold text-ink-700">Friends Activity</p>
            </div>
            {[
              { name: 'Sarah K.', action: 'finished', book: 'The Midnight Library', color: 'bg-violet-100 text-violet-700', time: '2h ago', isbn: '9780525559474' },
              { name: 'James R.', action: 'started reading', book: 'Fourth Wing', color: 'bg-blue-100 text-blue-700', time: '5h ago', isbn: '9781649374042' },
              { name: 'Maya T.', action: 'rated 5 stars', book: 'Demon Copperhead', color: 'bg-emerald-100 text-emerald-700', time: 'yesterday', isbn: '9780393881851' },
            ].map(e => (
              <div key={e.name} className="flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0 bg-white">
                <div className={`w-8 h-8 rounded-full ${e.color} flex-shrink-0 flex items-center justify-center text-xs font-bold`}>
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
                <div className="w-7 h-10 rounded overflow-hidden flex-shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://covers.openlibrary.org/b/isbn/${e.isbn}-S.jpg`} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-paper-50 border-y border-ink-100 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-ink-400 uppercase tracking-widest mb-4">What readers say</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink-950 text-center mb-12">
            Readers who actually read.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Sarah M.',
                detail: '47 books this year',
                text: "I've tried every reading tracker out there. Chapterly is the only one that made me actually want to open the app every day.",
                color: 'bg-violet-100 text-violet-700',
              },
              {
                name: 'James T.',
                detail: '23-day reading streak',
                text: "The AI insights are genuinely impressive. It told me I read 40% faster in the mornings — I rearranged my whole schedule.",
                color: 'bg-blue-100 text-blue-700',
              },
              {
                name: 'Maya K.',
                detail: '200+ books tracked',
                text: "Finding readers with my exact taste through the social features completely changed how I discover new books.",
                color: 'bg-emerald-100 text-emerald-700',
              },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm">
                <div className="flex gap-0.5 mb-5">
                  {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-ink-700 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-ink-50">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-400">{t.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="bg-white border-b border-ink-100 py-24 px-6">
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
                    ? <CheckCircle className="w-4 h-4 text-brand-500" />
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

      {/* ── Final CTA ── */}
      <section className="px-4 md:px-8 py-24">
        <div className="max-w-4xl mx-auto bg-ink-950 text-white rounded-3xl px-8 py-20 text-center relative overflow-hidden">
          {/* Subtle book covers as background texture */}
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center gap-4 overflow-hidden">
            {['9781649374042','9780735211292','9780525559474','9780385547345','9781619635180','9780593334867'].map(isbn => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={isbn} src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`} alt="" className="h-64 object-cover rounded" />
            ))}
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Start your reading<br />journey today.
            </h2>
            <p className="text-ink-300 text-lg mb-10 max-w-lg mx-auto">
              Join 10,000+ readers who track smarter, read more, and actually enjoy it.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-ink-950 px-8 py-4 rounded-full font-semibold hover:bg-paper-50 transition-colors"
            >
              Create your free account
            </Link>
            <p className="text-ink-500 text-xs mt-4">Free forever. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-100 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-400">
          <span className="font-display text-lg font-bold text-ink-700">Chapterly</span>
          <p>© 2026 Chapterly · Built for readers, by readers.</p>
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
