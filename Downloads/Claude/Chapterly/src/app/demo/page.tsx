'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, Share2, Upload, BarChart3, Flame, Star,
  TrendingUp, Clock, BookMarked, ChevronRight, X, LayoutDashboard,
  Compass, Users, Trophy, Rss,
} from 'lucide-react';

// ── Mock data ───────────────────────────────────────────────
const MOCK_BOOKS = [
  { id: '1', title: 'Fourth Wing', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', status: 'reading', page: 312, pages: 528, rating: null, genre: 'Fantasy' },
  { id: '2', title: 'Iron Flame', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', status: 'to_read', page: 0, pages: 640, rating: null, genre: 'Fantasy' },
  { id: '3', title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', cover: 'https://covers.openlibrary.org/b/id/10521943-M.jpg', status: 'read', page: 419, pages: 419, rating: 5, genre: 'Fantasy' },
  { id: '4', title: 'Atomic Habits', author: 'James Clear', cover: 'https://covers.openlibrary.org/b/id/10281705-M.jpg', status: 'read', page: 320, pages: 320, rating: 5, genre: 'Self-Help' },
  { id: '5', title: 'The Midnight Library', author: 'Matt Haig', cover: 'https://covers.openlibrary.org/b/id/10624628-M.jpg', status: 'read', page: 288, pages: 288, rating: 4, genre: 'Literary Fiction' },
  { id: '6', title: 'Spare', author: 'Prince Harry', cover: 'https://covers.openlibrary.org/b/id/13181979-M.jpg', status: 'dnf', page: 140, pages: 416, rating: 2, genre: 'Memoir' },
  { id: '7', title: 'The Housemaid', author: 'Freida McFadden', cover: 'https://covers.openlibrary.org/b/id/12716530-M.jpg', status: 'read', page: 336, pages: 336, rating: 4, genre: 'Thriller' },
  { id: '8', title: 'Happy Place', author: 'Emily Henry', cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', status: 'read', page: 400, pages: 400, rating: 4, genre: 'Romance' },
  { id: '9', title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg', status: 'reading', page: 87, pages: 480, rating: null, genre: 'Literary Fiction' },
  { id: '10', title: 'Lessons in Chemistry', author: 'Bonnie Garmus', cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', status: 'read', page: 390, pages: 390, rating: 5, genre: 'Fiction' },
  { id: '11', title: 'The Silent Patient', author: 'Alex Michaelides', cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg', status: 'to_read', page: 0, pages: 336, rating: null, genre: 'Thriller' },
  { id: '12', title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', cover: 'https://covers.openlibrary.org/b/id/8736389-M.jpg', status: 'read', page: 352, pages: 352, rating: 5, genre: 'Fiction' },
];

const MOCK_STATS = {
  streak: 23,
  books_read: 47,
  pages: 12840,
  hours: 214,
  avg_rating: 4.2,
  this_year: 18,
};

const MOCK_ACTIVITY = [
  { user: 'Alex R.', avatar: 'AR', action: 'finished reading', book: 'Fourth Wing', cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', rating: 5, time: '2h ago' },
  { user: 'Jamie L.', avatar: 'JL', action: 'started reading', book: 'Iron Flame', cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', rating: null, time: '5h ago' },
  { user: 'Sam K.', avatar: 'SK', action: 'rated 5★', book: 'Lessons in Chemistry', cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', rating: 5, time: '1d ago' },
  { user: 'Morgan T.', avatar: 'MT', action: 'shared a reading card for', book: 'Happy Place', cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', rating: null, time: '1d ago' },
];

type Tab = 'overview' | 'reading' | 'search' | 'streak' | 'share' | 'feed';

const NAV_ITEMS = [
  { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
  { tab: 'reading', label: 'My Books', icon: BookMarked },
  { tab: 'search', label: 'Discover', icon: Compass },
  { tab: 'streak', label: 'Stats', icon: BarChart3 },
  { tab: 'share', label: 'Share Cards', icon: Share2 },
  { tab: 'feed', label: 'Friends', icon: Rss },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [shelfFilter, setShelfFilter] = useState<string>('all');

  const reading = MOCK_BOOKS.filter(b => b.status === 'reading');
  const filtered = shelfFilter === 'all' ? MOCK_BOOKS : MOCK_BOOKS.filter(b => b.status === shelfFilter);

  return (
    <div className="min-h-screen bg-paper-50">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 bg-brand-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
        <span>👋 This is a live demo with sample data.</span>
        <Link href="/login" className="underline font-semibold hover:text-brand-100">Sign up free →</Link>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-9 bottom-0 w-64 bg-white border-r border-ink-100 flex-col px-4 py-6 z-40">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="text-2xl">📖</span>
          <span className="font-display text-lg font-bold text-ink-950">Chapterly</span>
          <span className="ml-1 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Demo</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ tab: t, label, icon: Icon }) => (
            <button key={t} onClick={() => setTab(t as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-paper-100 hover:text-ink-900'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
        {/* Fake profile */}
        <div className="flex items-center gap-3 px-2 pt-4 border-t border-ink-100 mt-4">
          <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold">JD</div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">Jane Demo</p>
            <p className="text-[11px] text-ink-400 truncate">23-day streak 🔥</p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-100 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {NAV_ITEMS.slice(0, 5).map(({ tab: t, label, icon: Icon }) => (
          <button key={t} onClick={() => setTab(t as Tab)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${tab === t ? 'text-brand-600' : 'text-ink-400'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">Hey, Jane 👋</h1>

              {/* Continue reading */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Continue Reading</h2>
                <div className="space-y-3">
                  {reading.map(b => (
                    <div key={b.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 transition-colors cursor-pointer">
                      <div className="w-12 h-16 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={b.cover} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink-900 truncate">{b.title}</p>
                        <p className="text-xs text-ink-400 truncate">{b.author}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.round((b.page / b.pages) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-ink-400 flex-shrink-0">{Math.round((b.page / b.pages) * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-medium">Log</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Stats grid */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Your Stats</h2>
                <StatsGrid stats={MOCK_STATS} />
              </section>

              {/* Quick actions */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <QA icon={<Search className="w-5 h-5" />} label="Search Books" onClick={() => setTab('search')} />
                  <QA icon={<Share2 className="w-5 h-5" />} label="Share Card" onClick={() => setTab('share')} />
                  <QA icon={<Upload className="w-5 h-5" />} label="Import Goodreads" onClick={() => {}} />
                  <QA icon={<BarChart3 className="w-5 h-5" />} label="Full Stats" onClick={() => setTab('streak')} />
                </div>
              </section>

              {/* Sign-up CTA */}
              <div className="bg-brand-500 rounded-2xl p-6 text-white">
                <h3 className="font-display text-xl font-bold mb-2">Ready to track your real library?</h3>
                <p className="text-brand-100 text-sm mb-4">Create a free account and import your Goodreads library in seconds.</p>
                <Link href="/login" className="inline-flex px-5 py-2.5 bg-white text-brand-600 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors">
                  Sign up free →
                </Link>
              </div>
            </div>
          )}

          {/* ── My Books ── */}
          {tab === 'reading' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">My Books</h1>
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap mb-6">
                {['all', 'reading', 'to_read', 'read', 'dnf'].map(s => (
                  <button key={s} onClick={() => setShelfFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${shelfFilter === s ? 'bg-brand-500 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:border-brand-300'}`}>
                    {s === 'all' ? 'All' : s === 'to_read' ? 'Want to Read' : s === 'dnf' ? 'Did Not Finish' : s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="ml-1.5 text-xs opacity-70">
                      {s === 'all' ? MOCK_BOOKS.length : MOCK_BOOKS.filter(b => b.status === s).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filtered.map(b => (
                  <div key={b.id} className="group">
                    <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm">
                      <img src={b.cover} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={e => { (e.target as HTMLImageElement).src = ''; }} />
                    </div>
                    <p className="text-xs font-medium text-ink-800 truncate">{b.title}</p>
                    <p className="text-[10px] text-ink-400 truncate">{b.author}</p>
                    {b.rating && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: b.rating }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-brand-400 text-brand-400" />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Discover (fake search) ── */}
          {tab === 'search' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Find a Book</h1>
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input readOnly placeholder="Search by title or author…" onClick={() => {}}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-ink-200 rounded-2xl text-sm focus:outline-none focus:border-brand-400 cursor-pointer"
                  onFocus={e => e.target.blur()} />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-400 bg-ink-50 px-2 py-1 rounded-lg">Sign up to search</div>
              </div>
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Trending on BookTok 🔥</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MOCK_BOOKS.filter(b => ['Fantasy', 'Romance', 'Thriller'].includes(b.genre)).map(b => (
                  <div key={b.id} className="group cursor-pointer" onClick={() => {}}>
                    <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm">
                      <img src={b.cover} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    </div>
                    <p className="text-xs font-medium text-ink-800 truncate">{b.title}</p>
                    <p className="text-[10px] text-ink-400 truncate">{b.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stats ── */}
          {tab === 'streak' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl font-bold text-ink-900">Your Stats</h1>
              <StatsGrid stats={MOCK_STATS} />
              {/* Fake calendar */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Reading Calendar — March 2026</h2>
                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <MiniCalendar />
                </div>
              </section>
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Monthly Breakdown</h2>
                <MonthChart />
              </section>
            </div>
          )}

          {/* ── Share ── */}
          {tab === 'share' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Share Cards</h1>
              <div className="grid md:grid-cols-2 gap-6">
                <DemoShareCard
                  type="now_reading"
                  book="Fourth Wing"
                  author="Rebecca Yarros"
                  page={312}
                  pages={528}
                  streak={23}
                />
                <DemoShareCard
                  type="streak"
                  book="Atomic Habits"
                  author="James Clear"
                  page={320}
                  pages={320}
                  streak={23}
                />
              </div>
              <p className="text-center text-sm text-ink-400 mt-6">
                <Link href="/login" className="text-brand-600 hover:underline font-medium">Sign up</Link> to create and download your own share cards
              </p>
            </div>
          )}

          {/* ── Feed ── */}
          {tab === 'feed' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Friends' Reading</h1>
              <div className="space-y-4">
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-ink-100">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">{a.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold text-ink-900">{a.user}</span>{' '}
                        {a.action}{' '}
                        <span className="font-medium text-ink-900">{a.book}</span>
                        {a.rating && <span className="ml-1 text-brand-500">{'★'.repeat(a.rating)}</span>}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">{a.time}</p>
                    </div>
                    <div className="w-10 h-14 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={a.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-brand-50 border border-brand-100 rounded-2xl text-center">
                <p className="text-sm text-ink-600 mb-3">Follow friends to see their reading activity here</p>
                <Link href="/login" className="inline-flex px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
                  Sign up to follow friends →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatsGrid({ stats }: { stats: typeof MOCK_STATS }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard
        label="Day Streak"
        value={`${stats.streak} 🔥`}
        sub="Streak protection active"
        glow
      />
      <StatCard label="Books Read" value={String(stats.books_read)} sub="All time" />
      <StatCard label="This Year" value={String(stats.this_year)} sub="of 24 goal" />
      <StatCard label="Total Pages" value={`${(stats.pages / 1000).toFixed(1)}k`} sub="All time" />
      <StatCard label="Hours Read" value={`${stats.hours}h`} sub="All time" />
      <StatCard label="Avg Rating" value={`${stats.avg_rating}★`} sub="From 47 books" />
    </div>
  );
}

function StatCard({ label, value, sub, glow }: { label: string; value: string; sub: string; glow?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 ${glow ? 'border-brand-300 animate-streak-glow' : 'border-ink-100'}`}>
      <p className="text-xs text-ink-500 mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-ink-950">{value}</p>
      <p className="text-[11px] text-ink-400 mt-1">{sub}</p>
    </div>
  );
}

function QA({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left">
      <span className="text-ink-400">{icon}</span>
      <span className="text-sm font-medium text-ink-700">{label}</span>
    </button>
  );
}

function MiniCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const logged = [1,2,3,5,6,7,8,9,10,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-[10px] text-ink-400 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* March 2026 starts on Sunday */}
        {days.map(d => (
          <div key={d} className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium ${
            logged.includes(d) ? 'bg-brand-400 text-white' : 'text-ink-400 hover:bg-ink-50'
          } ${d === 9 ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}>
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
  const values = [3,5,4,6,4,3,2,5,4,6,5,0];
  const max = Math.max(...values);
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5">
      <div className="flex items-end gap-2 h-24">
        {months.map((m, i) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-brand-100 rounded-t-sm overflow-hidden" style={{ height: `${values[i] ? (values[i] / max) * 80 : 2}px` }}>
              <div className={`w-full h-full ${i === 2 ? 'bg-brand-500' : 'bg-brand-300'}`} />
            </div>
            <span className="text-[9px] text-ink-400">{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoShareCard({ type, book, author, page, pages, streak }: {
  type: 'now_reading' | 'streak'; book: string; author: string; page: number; pages: number; streak: number;
}) {
  if (type === 'now_reading') {
    return (
      <div className="aspect-[9/16] max-w-xs mx-auto bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 flex flex-col justify-between border border-orange-200 shadow-lg">
        <div>
          <p className="text-xs font-medium text-orange-700 uppercase tracking-widest mb-4">Currently Reading</p>
          <div className="w-24 h-36 bg-paper-300 rounded-xl mx-auto mb-4 overflow-hidden shadow-md">
            <img src="https://covers.openlibrary.org/b/id/14395680-M.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <h3 className="font-display text-xl font-bold text-ink-950 text-center">{book}</h3>
          <p className="text-sm text-ink-500 text-center mt-1">{author}</p>
        </div>
        <div>
          <div className="h-2 bg-orange-200 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round((page / pages) * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-orange-700">
            <span>p. {page}</span>
            <span>{Math.round((page / pages) * 100)}%</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-brand-500 font-bold">🔥 {streak}</span>
            <span className="text-xs text-ink-500">day streak</span>
          </div>
          <p className="text-center text-[10px] text-ink-400 mt-3 font-medium tracking-wider">CHAPTERLY</p>
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[9/16] max-w-xs mx-auto bg-ink-950 rounded-3xl p-6 flex flex-col justify-center items-center border border-ink-800 shadow-lg">
      <div className="text-7xl mb-4">🔥</div>
      <p className="font-display text-6xl font-bold text-white mb-2">{streak}</p>
      <p className="text-brand-400 text-lg font-semibold mb-6">Day Streak</p>
      <p className="text-ink-400 text-sm text-center">Reading every day since February 14th</p>
      <p className="text-center text-[10px] text-ink-600 mt-8 font-medium tracking-wider">CHAPTERLY</p>
    </div>
  );
}
