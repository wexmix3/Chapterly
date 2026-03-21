'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, Share2, BarChart3, Flame, Star,
  BookMarked, LayoutDashboard, Rss, Users, ArrowRight,
  Sparkles, RefreshCw, ChevronRight, Trophy,
} from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BOOKS = [
  { id: '1',  title: 'Fourth Wing',             author: 'Rebecca Yarros',       cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', status: 'reading', page: 312, pages: 528, rating: null, genre: 'Fantasy' },
  { id: '9',  title: 'Tomorrow, and Tomorrow',  author: 'Gabrielle Zevin',      cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg', status: 'reading', page: 87,  pages: 480, rating: null, genre: 'Literary Fiction' },
  { id: '2',  title: 'Iron Flame',              author: 'Rebecca Yarros',       cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', status: 'to_read', page: 0,   pages: 640, rating: null, genre: 'Fantasy' },
  { id: '11', title: 'The Silent Patient',      author: 'Alex Michaelides',     cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg',  status: 'to_read', page: 0,   pages: 336, rating: null, genre: 'Thriller' },
  { id: '3',  title: 'A Court of Thorns & Roses', author: 'Sarah J. Maas',     cover: 'https://covers.openlibrary.org/b/id/10521943-M.jpg', status: 'read',    page: 419, pages: 419, rating: 5,    genre: 'Fantasy' },
  { id: '4',  title: 'Atomic Habits',           author: 'James Clear',          cover: 'https://covers.openlibrary.org/b/id/10281705-M.jpg', status: 'read',    page: 320, pages: 320, rating: 5,    genre: 'Self-Help' },
  { id: '5',  title: 'The Midnight Library',    author: 'Matt Haig',            cover: 'https://covers.openlibrary.org/b/id/10624628-M.jpg', status: 'read',    page: 288, pages: 288, rating: 4,    genre: 'Literary Fiction' },
  { id: '7',  title: 'The Housemaid',           author: 'Freida McFadden',      cover: 'https://covers.openlibrary.org/b/id/12716530-M.jpg', status: 'read',    page: 336, pages: 336, rating: 4,    genre: 'Thriller' },
  { id: '8',  title: 'Happy Place',             author: 'Emily Henry',          cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', status: 'read',    page: 400, pages: 400, rating: 4,    genre: 'Romance' },
  { id: '10', title: 'Lessons in Chemistry',    author: 'Bonnie Garmus',        cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', status: 'read',    page: 390, pages: 390, rating: 5,    genre: 'Fiction' },
  { id: '12', title: 'Daisy Jones & The Six',   author: 'Taylor Jenkins Reid',  cover: 'https://covers.openlibrary.org/b/id/8736389-M.jpg',  status: 'read',    page: 352, pages: 352, rating: 5,    genre: 'Fiction' },
  { id: '6',  title: 'Spare',                   author: 'Prince Harry',         cover: 'https://covers.openlibrary.org/b/id/13181979-M.jpg', status: 'dnf',     page: 140, pages: 416, rating: 2,    genre: 'Memoir' },
];

const MOCK_STATS = { streak: 23, books_read: 47, pages: 12840, hours: 214, avg_rating: 4.2, this_year: 18 };

const MOCK_INSIGHTS = [
  { emoji: '🌙', title: 'You read best at night', body: 'Your last 12 sessions all started after 9 pm. Your average night session is 42 pages — 60% more than your daytime pace.', type: 'pattern' },
  { emoji: '🏆', title: '23-day streak — your personal best', body: "You've now read every single day in March. That puts you in the top 8% of Chapterly readers this month.", type: 'achievement' },
  { emoji: '💡', title: 'A 15-min session keeps your streak alive', body: "You haven't logged today yet. Based on your patterns, reading just one chapter tonight keeps your 24-book goal on track.", type: 'suggestion' },
  { emoji: '📈', title: 'Your pace is up 22% this month', body: "At your current speed you'll finish Fourth Wing by March 28 — six days ahead of your original estimate.", type: 'encouragement' },
];

const MOCK_RECS = [
  { title: 'The Way of Kings', author: 'Brandon Sanderson', why: "Based on your love of Fourth Wing and ACOTAR, you're clearly a high-fantasy fan who craves epic world-building and slow-burn arcs.", genre: 'Fantasy', vibe: 'Epic', grad: 'from-violet-400 to-purple-500' },
  { title: 'The Thursday Murder Club', author: 'Richard Osman', why: "You gave The Housemaid 4★ and The Silent Patient is on your TBR — this cozy mystery will scratch the same itch.", genre: 'Thriller', vibe: 'Cozy', grad: 'from-amber-400 to-orange-500' },
  { title: 'Beach Read', author: 'Emily Henry', why: "You've rated three Emily Henry books 4★+ — you clearly love her voice and the slow-burn banter.", genre: 'Romance', vibe: 'Witty', grad: 'from-rose-400 to-pink-500' },
];

const MOCK_ACTIVITY = [
  { user: 'Alex R.',    initials: 'AR', avatarBg: 'bg-violet-100 text-violet-700', action: 'finished',        book: 'Fourth Wing',         cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', rating: 5, time: '2h ago' },
  { user: 'Jamie L.',   initials: 'JL', avatarBg: 'bg-sky-100 text-sky-700',      action: 'started reading', book: 'Iron Flame',          cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', rating: null, time: '5h ago' },
  { user: 'Sam K.',     initials: 'SK', avatarBg: 'bg-emerald-100 text-emerald-700', action: 'rated',        book: 'Lessons in Chemistry', cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', rating: 5, time: '1d ago' },
  { user: 'Morgan T.',  initials: 'MT', avatarBg: 'bg-rose-100 text-rose-700',    action: 'finished',        book: 'Happy Place',         cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', rating: 4, time: '1d ago' },
  { user: 'Casey P.',   initials: 'CP', avatarBg: 'bg-amber-100 text-amber-700',  action: 'started reading', book: 'The Silent Patient',  cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg',  rating: null, time: '2d ago' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'books' | 'ai' | 'friends' | 'stats';

const NAV_ITEMS: { tab: Tab; label: string; icon: React.ElementType; ai?: boolean }[] = [
  { tab: 'overview', label: 'Overview',    icon: LayoutDashboard },
  { tab: 'books',    label: 'My Books',    icon: BookMarked },
  { tab: 'ai',       label: 'AI Insights', icon: Sparkles, ai: true },
  { tab: 'friends',  label: 'Friends',     icon: Rss },
  { tab: 'stats',    label: 'Stats',       icon: BarChart3 },
];

const TYPE_CONFIG: Record<string, { border: string; bg: string }> = {
  pattern:      { border: 'border-l-blue-400',    bg: 'bg-blue-50/60' },
  achievement:  { border: 'border-l-emerald-400', bg: 'bg-emerald-50/60' },
  suggestion:   { border: 'border-l-violet-400',  bg: 'bg-violet-50/60' },
  encouragement:{ border: 'border-l-amber-400',   bg: 'bg-amber-50/60' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [shelfFilter, setShelfFilter] = useState('all');
  const [aiTab, setAiTab] = useState<'insights' | 'recommendations'>('insights');

  const reading  = MOCK_BOOKS.filter(b => b.status === 'reading');
  const filtered = shelfFilter === 'all' ? MOCK_BOOKS : MOCK_BOOKS.filter(b => b.status === shelfFilter);

  return (
    <div className="min-h-screen bg-paper-50">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-violet-600 to-brand-500 text-white text-center text-sm py-2.5 px-4 flex items-center justify-center gap-3">
        <span className="font-medium">👋 Live demo — sample data only.</span>
        <Link href="/login" className="underline font-bold hover:text-white/80 transition-colors">
          Create your free account →
        </Link>
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-10 bottom-0 w-64 bg-white border-r border-ink-100 flex-col px-4 py-6 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="text-2xl">📖</span>
          <span className="font-display text-lg font-bold text-ink-950">Chapterly</span>
          <span className="ml-1 text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">Demo</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(({ tab: t, label, icon: Icon, ai }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`}
            >
              {ai ? (
                <span className={`w-4 h-4 flex-shrink-0 ${tab === t ? 'text-brand-600' : 'text-violet-500'}`}>
                  <Icon className="w-4 h-4" />
                </span>
              ) : (
                <Icon className="w-4 h-4 flex-shrink-0" />
              )}
              {label}
              {ai && (
                <span className="ml-auto text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold leading-none">AI</span>
              )}
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="pt-4 border-t border-ink-100 mt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              JD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">Jane Demo</p>
              <p className="text-[11px] text-ink-400">23-day streak 🔥</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Sign up free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV_ITEMS.map(({ tab: t, label, icon: Icon, ai }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors relative ${
                tab === t ? 'text-brand-600' : 'text-ink-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{label}</span>
              {ai && (
                <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          {/* ══ OVERVIEW ══════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">Hey, Jane 👋</h1>
                <p className="text-sm text-ink-400 mt-1">Friday, March 20 · 23-day streak 🔥</p>
              </div>

              {/* Continue Reading */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">Continue Reading</h2>
                <div className="space-y-3">
                  {reading.map(b => (
                    <div key={b.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 transition-colors cursor-default">
                      <div className="w-12 h-16 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={b.cover} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink-900 truncate">{b.title}</p>
                        <p className="text-xs text-ink-400 truncate">{b.author}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${Math.round((b.page / b.pages) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-ink-400 flex-shrink-0">p. {b.page} / {b.pages}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-semibold">Log</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Insights preview */}
              <section>
                <div className="rounded-2xl overflow-hidden border border-ink-100 shadow-sm">
                  {/* Gradient header */}
                  <div className="bg-gradient-to-r from-violet-600 via-brand-500 to-brand-400 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-sm font-bold text-white leading-none">AI Insights</h2>
                        <p className="text-[10px] text-white/60 mt-0.5 tracking-wide">Powered by Claude</p>
                      </div>
                    </div>
                    <button onClick={() => setTab('ai')} className="flex items-center gap-1 text-xs text-white/80 hover:text-white font-medium transition-colors">
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Show first 2 insights */}
                  <div className="bg-white p-4 space-y-2.5">
                    {MOCK_INSIGHTS.slice(0, 2).map((insight, i) => {
                      const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.encouragement;
                      return (
                        <div key={i} className={`rounded-xl p-3.5 border-l-[3px] ${cfg.border} ${cfg.bg} border border-ink-100`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{insight.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm text-ink-900 leading-snug">{insight.title}</p>
                              <p className="text-xs text-ink-500 leading-relaxed mt-1">{insight.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => setTab('ai')} className="w-full text-xs font-semibold text-brand-600 hover:text-brand-700 py-1 flex items-center justify-center gap-1 transition-colors">
                      View all insights + recommendations <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Social activity */}
              <section>
                <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-paper-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-display text-base font-semibold text-ink-800">Friends Activity</span>
                      <span className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <button onClick={() => setTab('friends')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
                      See all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-paper-50/80">
                    {MOCK_ACTIVITY.slice(0, 3).map((a, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${a.avatarBg}`}>
                          {a.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink-800 leading-snug truncate">
                            <span className="font-semibold">{a.user}</span>{' '}
                            <span className="text-ink-400">{a.action}</span>{' '}
                            <span className="font-medium">{a.book}</span>
                          </p>
                          {a.rating && (
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: a.rating }).map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <div className="w-8 rounded overflow-hidden shadow-sm" style={{ aspectRatio: '2/3' }}>
                            <img src={a.cover} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          </div>
                          <span className="text-[9px] text-ink-300">{a.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Daily goal ring */}
              <section>
                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <h2 className="font-display text-base font-semibold text-ink-800 mb-4">Today&apos;s Reading Goal</h2>
                  <div className="flex items-center gap-6">
                    <GoalRing current={28} goal={40} />
                    <div>
                      <p className="text-2xl font-bold text-ink-900">28 <span className="text-base font-normal text-ink-400">/ 40 pages</span></p>
                      <p className="text-sm text-emerald-600 font-medium mt-1">12 pages to go 🎯</p>
                      <p className="text-xs text-ink-400 mt-1">At your pace, ~18 minutes</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA */}
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-ink-950 to-ink-800 p-6 text-white">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2">Start for free</p>
                  <h3 className="font-display text-xl font-bold mb-2">This is your reading life — for real.</h3>
                  <p className="text-ink-300 text-sm mb-5 leading-relaxed">
                    Connect your real library, get Claude AI insights about your actual reading habits, and follow the readers who share your taste.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ink-950 rounded-xl font-bold text-sm hover:bg-brand-50 transition-colors">
                      Create account <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition-colors border border-white/20">
                      Import from Goodreads
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MY BOOKS ══════════════════════════════════════════ */}
          {tab === 'books' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-2xl font-bold text-ink-900">My Books</h1>
                <span className="text-sm text-ink-400">{MOCK_BOOKS.length} books</span>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap mb-6">
                {[
                  { v: 'all',     l: 'All 📚' },
                  { v: 'reading', l: 'Reading 📖' },
                  { v: 'to_read', l: 'Want to Read 🔖' },
                  { v: 'read',    l: 'Read ✅' },
                  { v: 'dnf',     l: 'DNF 🚫' },
                ].map(({ v, l }) => (
                  <button key={v} onClick={() => setShelfFilter(v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      shelfFilter === v
                        ? 'bg-brand-500 text-white'
                        : 'bg-white border border-ink-100 text-ink-600 hover:border-brand-200'
                    }`}>
                    {l}
                    <span className={`text-[10px] ${shelfFilter === v ? 'text-white/70' : 'text-ink-400'}`}>
                      {v === 'all' ? MOCK_BOOKS.length : MOCK_BOOKS.filter(b => b.status === v).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filtered.map(b => (
                  <div key={b.id} className="group cursor-default">
                    <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm relative">
                      <img
                        src={b.cover}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                      />
                      {b.status === 'reading' && b.page > 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.round((b.page/b.pages)*100)}%` }} />
                          </div>
                        </div>
                      )}
                      {b.rating && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 rounded-md px-1.5 py-0.5">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[9px] text-white font-medium">{b.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-ink-800 line-clamp-2 leading-tight">{b.title}</p>
                    <p className="text-[10px] text-ink-400 truncate mt-0.5">{b.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ AI INSIGHTS ═══════════════════════════════════════ */}
          {tab === 'ai' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-ink-900">AI Insights</h1>
                <p className="text-sm text-ink-400 mt-1">Claude analyzes your reading patterns daily</p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-ink-100 shadow-sm">
                {/* Gradient header */}
                <div className="bg-gradient-to-r from-violet-600 via-brand-500 to-brand-400 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="font-display text-sm font-bold text-white leading-none">AI Insights</h2>
                        <p className="text-[10px] text-white/60 mt-0.5 tracking-wide">Powered by Claude · Updated today</p>
                      </div>
                    </div>
                    <button className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                <div className="bg-white">
                  {/* Sub-tabs */}
                  <div className="px-4 pt-3">
                    <div className="flex gap-1 bg-paper-50 rounded-xl p-1">
                      {(['insights', 'recommendations'] as const).map(t => (
                        <button key={t} onClick={() => setAiTab(t)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            aiTab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                          }`}>
                          {t === 'insights' ? '✨ Insights' : '📚 For You'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 pt-3 space-y-2.5">
                    {aiTab === 'insights' ? (
                      MOCK_INSIGHTS.map((insight, i) => {
                        const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.encouragement;
                        return (
                          <div key={i} className={`rounded-xl p-4 border-l-[3px] ${cfg.border} ${cfg.bg} border border-ink-100`}>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{insight.emoji}</span>
                              <div>
                                <p className="font-semibold text-sm text-ink-900 leading-snug">{insight.title}</p>
                                <p className="text-xs text-ink-500 leading-relaxed mt-1">{insight.body}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      MOCK_RECS.map((rec, i) => (
                        <div key={i} className="rounded-xl border border-paper-200 overflow-hidden">
                          <div className="flex items-start gap-3 p-3.5">
                            <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${rec.grad} shadow-sm`}>
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm text-ink-900 leading-tight">{rec.title}</p>
                                <span className="text-[10px] bg-paper-100 border border-paper-200 px-2 py-0.5 rounded-full text-ink-500 flex-shrink-0 whitespace-nowrap">{rec.vibe}</span>
                              </div>
                              <p className="text-xs text-ink-400 mt-0.5">{rec.author} · <span className="text-ink-300">{rec.genre}</span></p>
                              <p className="text-xs text-ink-500 italic leading-relaxed mt-1.5 border-l-2 border-violet-200 pl-2">&ldquo;{rec.why}&rdquo;</p>
                              <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                                Find this book <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sign-up nudge */}
              <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-5 text-center">
                <Sparkles className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-800 mb-1">These are demo insights</p>
                <p className="text-xs text-ink-400 mb-4">Sign up and Claude will analyze your real reading patterns — sessions, pace, genres, streak, and more.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors">
                  Unlock your real insights <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ══ FRIENDS ═══════════════════════════════════════════ */}
          {tab === 'friends' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-2xl font-bold text-ink-900">Friends Activity</h1>
                <span className="flex items-center gap-1 text-sm text-rose-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="space-y-3">
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${a.avatarBg}`}>
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-800 leading-snug">
                        <span className="font-semibold">{a.user}</span>{' '}
                        <span className="text-ink-400">{a.action}</span>{' '}
                        <span className="font-medium text-ink-800">{a.book}</span>
                      </p>
                      {a.rating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: a.rating }).map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                        </div>
                      )}
                      <p className="text-[11px] text-ink-300 mt-0.5">{a.time}</p>
                    </div>
                    <div className="w-10 flex-shrink-0 rounded-lg overflow-hidden shadow-sm" style={{ aspectRatio: '2/3' }}>
                      <img src={a.cover} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-ink-900 mb-1">Follow real readers</h3>
                <p className="text-sm text-ink-400 mb-4">Sign up to follow friends, see their shelves, and discover books through people you trust.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 transition-colors">
                  Find your readers <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ══ STATS ══════════════════════════════════════════════ */}
          {tab === 'stats' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl font-bold text-ink-900">Your Stats</h1>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-brand-200 p-4 animate-streak-glow">
                  <p className="text-xs text-ink-500 mb-1">Day Streak</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.streak} 🔥</p>
                  <p className="text-[11px] text-ink-400 mt-1">Streak protection active</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Books Read</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.books_read}</p>
                  <p className="text-[11px] text-ink-400 mt-1">All time</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">This Year</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.this_year}</p>
                  <p className="text-[11px] text-ink-400 mt-1">of 24 goal</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Total Pages</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{(MOCK_STATS.pages/1000).toFixed(1)}k</p>
                  <p className="text-[11px] text-ink-400 mt-1">All time</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Hours Read</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.hours}h</p>
                  <p className="text-[11px] text-ink-400 mt-1">All time</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Avg Rating</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.avg_rating}★</p>
                  <p className="text-[11px] text-ink-400 mt-1">From 47 books</p>
                </div>
              </div>

              {/* Calendar */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Reading Calendar — March 2026</h2>
                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <MiniCalendar />
                </div>
              </section>

              {/* Monthly chart */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Books Per Month</h2>
                <MonthChart />
              </section>

              {/* Top genres */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Top Genres</h2>
                <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-3">
                  {[
                    { genre: 'Fantasy', count: 14, pct: 85 },
                    { genre: 'Fiction', count: 9, pct: 55 },
                    { genre: 'Romance', count: 7, pct: 42 },
                    { genre: 'Thriller', count: 6, pct: 36 },
                    { genre: 'Self-Help', count: 5, pct: 30 },
                  ].map(g => (
                    <div key={g.genre}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink-700">{g.genre}</span>
                        <span className="text-xs text-ink-400">{g.count} books</span>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoalRing({ current, goal }: { current: number; goal: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(current / goal, 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-100" />
        <circle cx="44" cy="44" r={r} fill="none" stroke="url(#goalGrad)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700" />
        <defs>
          <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-ink-900">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}

function MiniCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const logged = [1,2,3,5,6,7,8,9,10,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28];
  const today = 20;
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-[10px] text-ink-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => (
          <div key={d} className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
            d === today
              ? 'bg-brand-500 text-white ring-2 ring-brand-300 ring-offset-1'
              : logged.includes(d)
              ? 'bg-brand-100 text-brand-700'
              : d < today
              ? 'text-ink-300'
              : 'text-ink-400'
          }`}>
            {d}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-400 mt-3 text-center">25 reading days this month</p>
    </div>
  );
}

function MonthChart() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const values = [3, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...values, 1);
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <div className="flex items-end gap-2 h-28">
        {months.map((m, i) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t-md overflow-hidden"
              style={{ height: `${values[i] ? Math.max((values[i] / max) * 96, 4) : 3}px` }}
            >
              <div className={`w-full h-full ${i === 2 ? 'bg-brand-500' : values[i] > 0 ? 'bg-brand-300' : 'bg-ink-100'}`} />
            </div>
            <span className="text-[9px] text-ink-400">{m}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-400 mt-2">March in progress — 6 books so far</p>
    </div>
  );
}
