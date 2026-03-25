'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, BarChart3, Flame, Star,
  BookMarked, Rss, ArrowRight,
  Sparkles, RefreshCw, ChevronRight, Trophy,
  TrendingUp, Target, Users, Compass, ChevronDown,
  Book, Lock, Check, Loader2,
} from 'lucide-react';
import BookCover from '@/components/ui/BookCover';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_USER = { name: 'Alex Reader', initials: 'AR', streak: 18, booksThisYear: 12, level: 7, levelTitle: 'Bookworm', xp: 1840 };

const MOCK_BOOKS = [
  { id: '1',  title: 'Fourth Wing',               author: 'Rebecca Yarros',       cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', status: 'reading', page: 312, pages: 528, rating: null, genre: 'Fantasy' },
  { id: '9',  title: 'Tomorrow, and Tomorrow',    author: 'Gabrielle Zevin',      cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg', status: 'reading', page: 87,  pages: 480, rating: null, genre: 'Literary Fiction' },
  { id: '13', title: 'The Women',                 author: 'Kristin Hannah',       cover: 'https://covers.openlibrary.org/b/id/14791289-M.jpg', status: 'reading', page: 145, pages: 464, rating: null, genre: 'Historical Fiction' },
  { id: '2',  title: 'Iron Flame',                author: 'Rebecca Yarros',       cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', status: 'to_read', page: 0,   pages: 640, rating: null, genre: 'Fantasy' },
  { id: '11', title: 'The Silent Patient',        author: 'Alex Michaelides',     cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg',  status: 'to_read', page: 0,   pages: 336, rating: null, genre: 'Thriller' },
  { id: '3',  title: 'A Court of Thorns & Roses', author: 'Sarah J. Maas',        cover: 'https://covers.openlibrary.org/b/id/10521943-M.jpg', status: 'read',    page: 419, pages: 419, rating: 5,    genre: 'Fantasy' },
  { id: '4',  title: 'Atomic Habits',             author: 'James Clear',          cover: 'https://covers.openlibrary.org/b/id/10281705-M.jpg', status: 'read',    page: 320, pages: 320, rating: 5,    genre: 'Self-Help' },
  { id: '5',  title: 'The Midnight Library',      author: 'Matt Haig',            cover: 'https://covers.openlibrary.org/b/id/10624628-M.jpg', status: 'read',    page: 288, pages: 288, rating: 4,    genre: 'Literary Fiction' },
  { id: '7',  title: 'The Housemaid',             author: 'Freida McFadden',      cover: 'https://covers.openlibrary.org/b/id/12716530-M.jpg', status: 'read',    page: 336, pages: 336, rating: 4,    genre: 'Thriller' },
  { id: '8',  title: 'Happy Place',               author: 'Emily Henry',          cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', status: 'read',    page: 400, pages: 400, rating: 4,    genre: 'Romance' },
  { id: '10', title: 'Lessons in Chemistry',      author: 'Bonnie Garmus',        cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', status: 'read',    page: 390, pages: 390, rating: 5,    genre: 'Fiction' },
  { id: '12', title: 'Daisy Jones & The Six',     author: 'Taylor Jenkins Reid',  cover: 'https://covers.openlibrary.org/b/id/8736389-M.jpg',  status: 'read',    page: 352, pages: 352, rating: 5,    genre: 'Fiction' },
];

const MOCK_STATS = { streak: 18, books_read: 12, pages: 3840, hours: 67, avg_rating: 4.3, this_year: 12 };

const MOCK_INSIGHTS = [
  { emoji: '🌙', title: 'You read best at night', body: 'Your last 12 sessions all started after 9 pm. Your average night session is 42 pages — 60% more than your daytime pace.', type: 'pattern' },
  { emoji: '🏆', title: '18-day streak — your personal best', body: "You've now read every single day in March. That puts you in the top 12% of Chapterly readers this month.", type: 'achievement' },
  { emoji: '💡', title: 'A 15-min session keeps your streak alive', body: "You haven't logged today yet. Based on your patterns, reading just one chapter tonight keeps your 24-book goal on track.", type: 'suggestion' },
  { emoji: '📈', title: 'Your pace is up 18% this month', body: "At your current speed you'll finish Fourth Wing by March 31 — right on schedule.", type: 'encouragement' },
];

const MOCK_INSIGHTS_2 = [
  { emoji: '📚', title: 'Fantasy is your power genre', body: 'You finish 92% of Fantasy books you start — far above your 74% overall rate. Your brain is wired for world-building.', type: 'pattern' },
  { emoji: '⏱️', title: 'You average 42 pages per session', body: 'That puts you comfortably in the top 25% of readers your age. At this pace you can finish 2 more books before April.', type: 'achievement' },
  { emoji: '🎯', title: 'Sunday is your best reading day', body: 'Your longest sessions consistently happen on Sunday mornings. Protecting that window could add 3+ books to your year.', type: 'suggestion' },
  { emoji: '🌟', title: '12 books — you\'re ahead of schedule', body: 'With 9 months left in the year you\'re on pace for 24 books — right at your goal. Keep this momentum.', type: 'encouragement' },
];

const MOCK_DNA = [
  { genre: 'Fantasy', count: 5, pct: 85 },
  { genre: 'Fiction', count: 3, pct: 55 },
  { genre: 'Thriller', count: 2, pct: 38 },
  { genre: 'Romance', count: 1, pct: 22 },
  { genre: 'Self-Help', count: 1, pct: 18 },
];

const MOCK_RECS = [
  { title: 'The Way of Kings', author: 'Brandon Sanderson', why: "Based on your love of Fourth Wing and ACOTAR, you're clearly a high-fantasy fan who craves epic world-building.", genre: 'Fantasy', vibe: 'Epic', grad: 'from-violet-400 to-purple-500' },
  { title: 'The Thursday Murder Club', author: 'Richard Osman', why: "You gave The Housemaid 4 stars and The Silent Patient is on your TBR — this cozy mystery will scratch the same itch.", genre: 'Thriller', vibe: 'Cozy', grad: 'from-amber-400 to-orange-500' },
  { title: 'Beach Read', author: 'Emily Henry', why: "You've rated Happy Place 4 stars — you clearly love her voice and the slow-burn banter.", genre: 'Romance', vibe: 'Witty', grad: 'from-rose-400 to-pink-500' },
];

const MOCK_ACTIVITY = [
  { user: 'Sam K.',    initials: 'SK', avatarBg: 'bg-violet-100 text-violet-700', action: 'finished',        book: 'Fourth Wing',          cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', rating: 5, time: '2h ago' },
  { user: 'Jamie L.',  initials: 'JL', avatarBg: 'bg-sky-100 text-sky-700',      action: 'started reading', book: 'Iron Flame',           cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', rating: null, time: '5h ago' },
  { user: 'Morgan T.', initials: 'MT', avatarBg: 'bg-emerald-100 text-emerald-700', action: 'rated',        book: 'Lessons in Chemistry', cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', rating: 5, time: '1d ago' },
  { user: 'Casey P.',  initials: 'CP', avatarBg: 'bg-rose-100 text-rose-700',    action: 'finished',        book: 'Happy Place',          cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', rating: 4, time: '1d ago' },
  { user: 'Riley W.',  initials: 'RW', avatarBg: 'bg-amber-100 text-amber-700',  action: 'started reading', book: 'The Silent Patient',   cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg',  rating: null, time: '2d ago' },
];

const MOCK_ACHIEVEMENTS = [
  { id: 'early_adopter', emoji: '🚀', title: 'Early Adopter', desc: 'Created your account', xp: 10, unlocked: true },
  { id: 'first_book',    emoji: '📖', title: 'First Chapter',  desc: 'Finished your first book', xp: 25, unlocked: true },
  { id: 'streak_7',      emoji: '🔥', title: 'Week Warrior',  desc: '7-day reading streak', xp: 25, unlocked: true },
  { id: 'five_books',    emoji: '📚', title: 'Bookworm',       desc: 'Finish 5 books', xp: 50, unlocked: true },
  { id: 'streak_30',     emoji: '🌟', title: 'Monthly Reader', desc: '30-day reading streak', xp: 100, unlocked: false, progress: 60 },
  { id: 'ten_books',     emoji: '🏛️', title: 'Library Card',   desc: 'Finish 10 books', xp: 25, unlocked: false, progress: 80, current: 12, target: 10 },
];

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'books' | 'ai' | 'social' | 'stats' | 'achievements';

type MockBook = typeof MOCK_BOOKS[number];

const TYPE_CONFIG: Record<string, { border: string; bg: string }> = {
  pattern:       { border: 'border-l-blue-400',    bg: 'bg-blue-50/60' },
  achievement:   { border: 'border-l-emerald-400', bg: 'bg-emerald-50/60' },
  suggestion:    { border: 'border-l-violet-400',  bg: 'bg-violet-50/60' },
  encouragement: { border: 'border-l-amber-400',   bg: 'bg-amber-50/60' },
};

// ── Demo nav items ─────────────────────────────────────────────────────────────

const PERSONAL_NAV = [
  { tab: 'overview' as Tab,      label: 'My Books',     icon: BookOpen },
  { tab: 'stats' as Tab,         label: 'Progress',     icon: TrendingUp },
  { tab: 'achievements' as Tab,  label: 'Achievements', icon: Trophy },
];

const SOCIAL_NAV = [
  { tab: 'social' as Tab, label: 'Feed',     icon: Rss },
  { tab: 'social' as Tab, label: 'Find Readers', icon: Search },
  { tab: 'social' as Tab, label: 'Book Clubs', icon: BookMarked },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [shelfFilter, setShelfFilter] = useState('all');
  const [aiTab, setAiTab] = useState<'insights' | 'dna' | 'recommendations'>('insights');
  const [personalOpen, setPersonalOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);

  // Toast state
  const [demoToast, setDemoToast] = useState('');
  useEffect(() => {
    if (!demoToast) return;
    const t = setTimeout(() => setDemoToast(''), 2000);
    return () => clearTimeout(t);
  }, [demoToast]);

  // Log buttons state: bookId -> { logged, pages }
  const [loggedBooks, setLoggedBooks] = useState<Record<string, { logged: boolean; pages: number }>>({});

  // AI insights refresh state
  const [insightsSet, setInsightsSet] = useState<1 | 2>(1);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);

  // Selected book for bottom sheet
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const reading  = MOCK_BOOKS.filter(b => b.status === 'reading');
  const filtered = shelfFilter === 'all' ? MOCK_BOOKS : MOCK_BOOKS.filter(b => b.status === shelfFilter);

  const activeInsights = insightsSet === 1 ? MOCK_INSIGHTS : MOCK_INSIGHTS_2;

  // Progress bar widths for XP level
  const xpMin = 1250; // Lv 6
  const xpMax = 1800; // Lv 7 → 8 threshold approximation
  const xpPct = Math.round(((MOCK_USER.xp - xpMin) / (xpMax - xpMin)) * 100);

  const handleLog = (bookId: string, bookPages: number, currentPage: number) => {
    const already = loggedBooks[bookId];
    if (already?.logged) return;
    const delta = Math.floor(Math.random() * 21) + 15; // 15-35
    const newPage = Math.min(currentPage + delta, bookPages);
    setLoggedBooks(prev => ({ ...prev, [bookId]: { logged: true, pages: newPage } }));
    setTimeout(() => {
      setLoggedBooks(prev => ({ ...prev, [bookId]: { logged: false, pages: newPage } }));
    }, 3000);
  };

  const handleRefreshInsights = () => {
    setInsightsRefreshing(true);
    setTimeout(() => {
      setInsightsSet(prev => prev === 1 ? 2 : 1);
      setInsightsRefreshing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-paper-50">

      {/* Demo banner */}
      <div className="sticky top-0 z-50 bg-ink-950 text-white text-center text-sm py-2.5 px-4 flex items-center justify-center gap-3">
        <span className="font-medium">Live demo — sample data only.</span>
        <Link href="/login" className="underline font-bold hover:text-white/80 transition-colors">
          Create your free account
        </Link>
      </div>

      {/* ── Demo top nav ── */}
      <header className="sticky top-10 z-40 h-[52px] bg-white/90 backdrop-blur-xl border-b border-ink-100 flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-brand-600 tracking-tight">Chapterly</span>
          <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Demo</span>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Personal dropdown */}
          <div className="relative">
            <button
              onClick={() => { setPersonalOpen(v => !v); setSocialOpen(false); }}
              className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                ['overview','stats','achievements'].includes(tab)
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              Personal <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {personalOpen && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-ink-100 rounded-xl shadow-lg p-2 min-w-[180px]">
                {PERSONAL_NAV.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} onClick={() => { setTab(item.tab); setPersonalOpen(false); }}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <Icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI direct */}
          <button onClick={() => setTab('ai')}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'ai' ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:bg-ink-50'
            }`}>
            <Sparkles className="w-3.5 h-3.5" /> AI
          </button>

          {/* Social dropdown */}
          <div className="relative">
            <button
              onClick={() => { setSocialOpen(v => !v); setPersonalOpen(false); }}
              className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                tab === 'social' ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              Social <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {socialOpen && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-ink-100 rounded-xl shadow-lg p-2 min-w-[180px]">
                {SOCIAL_NAV.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} onClick={() => { setTab(item.tab); setSocialOpen(false); }}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
                      <Icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discover direct */}
          <button
            onClick={() => { setTab('overview'); setDemoToast('Full browse experience in the app →'); }}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-ink-600 hover:bg-ink-50 transition-colors">
            <Compass className="w-3.5 h-3.5" /> Discover
          </button>
        </nav>

        {/* Right: user area */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {MOCK_USER.initials}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-brand-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {MOCK_USER.level}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {([
            { tab: 'overview' as Tab, label: 'Books', icon: BookMarked },
            { tab: 'ai' as Tab, label: 'AI', icon: Sparkles },
            { tab: 'social' as Tab, label: 'Social', icon: Rss },
            { tab: 'stats' as Tab, label: 'Progress', icon: BarChart3 },
            { tab: 'achievements' as Tab, label: 'Achievements', icon: Trophy },
          ] as { tab: Tab; label: string; icon: React.ElementType }[]).map(({ tab: t, label, icon: Icon }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                tab === t ? 'text-brand-600' : 'text-ink-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          {/* Toast */}
          {demoToast && (
            <div className="mb-4 px-4 py-2.5 bg-ink-900 text-white text-sm rounded-xl flex items-center justify-between animate-fade-in">
              <span>{demoToast}</span>
              <Link href="/login" className="ml-3 text-brand-300 font-semibold hover:text-brand-200 text-xs whitespace-nowrap">Sign up free</Link>
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">
                  Hey, {MOCK_USER.name.split(' ')[0]}
                </h1>
                <p className="text-sm text-ink-400 mt-1">Monday, March 24 · {MOCK_USER.streak}-day streak</p>
              </div>

              {/* Continue Reading */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">Continue Reading</h2>
                <div className="space-y-3">
                  {reading.map(b => {
                    const logState = loggedBooks[b.id];
                    const displayPage = logState?.pages ?? b.page;
                    const displayPct = Math.round((displayPage / b.pages) * 100);
                    return (
                      <div key={b.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 transition-colors">
                        <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm relative">
                          <BookCover src={b.cover} title={b.title} authors={[b.author]} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-ink-900 truncate">{b.title}</p>
                          <p className="text-xs text-ink-400 truncate">{b.author}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${displayPct}%` }} />
                            </div>
                            <span className="text-[10px] text-ink-400 flex-shrink-0">p. {displayPage} / {b.pages}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLog(b.id, b.pages, displayPage)}
                          className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            logState?.logged
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-brand-50 text-brand-600 hover:bg-brand-100 cursor-pointer'
                          }`}
                        >
                          {logState?.logged ? 'Logged ✓' : 'Log'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* AI preview */}
              <section>
                <div className="rounded-2xl overflow-hidden border border-ink-100 shadow-sm">
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
                      View all insights <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Daily goal ring */}
              <section>
                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <h2 className="font-display text-base font-semibold text-ink-800 mb-4">Today&apos;s Reading Goal</h2>
                  <div className="flex items-center gap-6">
                    <GoalRing current={32} goal={40} />
                    <div>
                      <p className="text-2xl font-bold text-ink-900">32 <span className="text-base font-normal text-ink-400">/ 40 pages</span></p>
                      <p className="text-sm text-emerald-600 font-medium mt-1">8 pages to go</p>
                      <p className="text-xs text-ink-400 mt-1">At your pace, ~12 minutes</p>
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
                    Connect your real library, get Claude AI insights about your actual habits, and follow readers who share your taste.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ink-950 rounded-xl font-bold text-sm hover:bg-brand-50 transition-colors">
                      Create account <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MY BOOKS ══ */}
          {tab === 'books' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-2xl font-bold text-ink-900">My Books</h1>
                <span className="text-sm text-ink-400">{MOCK_BOOKS.length} books</span>
              </div>

              <div className="flex gap-2 flex-wrap mb-6">
                {[
                  { v: 'all',     l: 'All' },
                  { v: 'reading', l: 'Reading' },
                  { v: 'to_read', l: 'Want to Read' },
                  { v: 'read',    l: 'Read' },
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
                  <button
                    key={b.id}
                    className="group text-left cursor-pointer"
                    onClick={() => setSelectedBook(b)}
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-sm relative">
                      <BookCover src={b.cover} title={b.title} authors={[b.author]} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══ AI INSIGHTS ══ */}
          {tab === 'ai' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-ink-900">AI Insights</h1>
                <p className="text-sm text-ink-400 mt-1">Claude analyzes your reading patterns daily</p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-ink-100 shadow-sm">
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
                    <button
                      onClick={handleRefreshInsights}
                      disabled={insightsRefreshing}
                      className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white ${insightsRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="bg-white">
                  <div className="px-4 pt-3">
                    <div className="flex gap-1 bg-paper-50 rounded-xl p-1">
                      {(['insights', 'dna', 'recommendations'] as const).map(t => (
                        <button key={t} onClick={() => setAiTab(t)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            aiTab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                          }`}>
                          {t === 'insights' ? 'Insights' : t === 'dna' ? 'Reading DNA' : 'For You'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 pt-3 space-y-2.5">
                    {aiTab === 'insights' && (
                      insightsRefreshing ? (
                        <div className="space-y-2.5">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-20 bg-ink-100 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        activeInsights.map((insight, i) => {
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
                      )
                    )}

                    {aiTab === 'dna' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-ink-600 uppercase tracking-widest mb-3">Top Genres</p>
                          <div className="space-y-2.5">
                            {MOCK_DNA.map(g => (
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
                        </div>
                        <div className="bg-brand-50 rounded-xl p-3.5 border border-brand-100">
                          <p className="text-xs font-bold text-brand-700 mb-1">Theme Profile</p>
                          <p className="text-xs text-ink-600 leading-relaxed">
                            Strong affinity for strong female protagonists, magical world-building, and slow-burn romance arcs. High finish rate in Fantasy (92%) vs. Literary Fiction (74%).
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                          <p className="text-xs font-bold text-amber-700 mb-1">Finish Line</p>
                          <p className="text-xs text-ink-600 leading-relaxed">
                            At your current pace of 42 pages/day, you&apos;ll finish Fourth Wing in approximately 5 days.
                          </p>
                        </div>
                      </div>
                    )}

                    {aiTab === 'recommendations' && MOCK_RECS.map((rec, i) => (
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-violet-50 border border-violet-100 rounded-2xl p-5 text-center">
                <Sparkles className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-800 mb-1">These are demo insights</p>
                <p className="text-xs text-ink-400 mb-4">Sign up and Claude will analyze your real reading patterns.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors">
                  Unlock your real insights <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ══ SOCIAL ══ */}
          {tab === 'social' && (
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
                    <div className="w-10 flex-shrink-0 rounded-lg overflow-hidden shadow-sm relative" style={{ aspectRatio: '2/3' }}>
                      <BookCover src={a.cover} title={a.book} fill className="object-cover" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <h3 className="font-display font-bold text-ink-900 mb-1">Follow real readers</h3>
                <p className="text-sm text-ink-400 mb-4">Sign up to follow friends and discover books through people you trust.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 transition-colors">
                  Find your readers <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ══ STATS ══ */}
          {tab === 'stats' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl font-bold text-ink-900">Progress</h1>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-amber-200 p-4">
                  <p className="text-xs text-ink-500 mb-1">Day Streak</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.streak}</p>
                  <p className="text-[11px] text-amber-500 mt-1">🔥 Keep it going!</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Books This Year</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.this_year}</p>
                  <p className="text-[11px] text-ink-400 mt-1">of 24 goal · 50%</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Total Pages</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{(MOCK_STATS.pages/1000).toFixed(1)}k</p>
                  <p className="text-[11px] text-ink-400 mt-1">This year</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Hours Read</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.hours}h</p>
                  <p className="text-[11px] text-ink-400 mt-1">This year</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Avg Rating</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_STATS.avg_rating}★</p>
                  <p className="text-[11px] text-ink-400 mt-1">From {MOCK_STATS.books_read} books</p>
                </div>
                <div className="bg-white rounded-2xl border border-ink-100 p-4">
                  <p className="text-xs text-ink-500 mb-1">Reader Level</p>
                  <p className="font-display text-2xl font-bold text-ink-950">{MOCK_USER.level}</p>
                  <p className="text-[11px] text-brand-500 mt-1">{MOCK_USER.levelTitle}</p>
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
            </div>
          )}

          {/* ══ ACHIEVEMENTS ══ */}
          {tab === 'achievements' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-ink-900">Achievements</h1>

              {/* Level card */}
              <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h2 className="font-display text-xl font-bold text-ink-950">Reader Level {MOCK_USER.level}</h2>
                      <span className="text-sm font-medium text-brand-600">{MOCK_USER.levelTitle}</span>
                    </div>
                    <p className="text-sm text-ink-500 mb-3">{MOCK_USER.xp.toLocaleString()} XP · 360 XP to Level {MOCK_USER.level + 1}</p>
                    <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${xpPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement grid */}
              <div className="grid grid-cols-2 gap-3">
                {MOCK_ACHIEVEMENTS.map(a => (
                  <div key={a.id} className={`relative bg-white rounded-2xl p-4 border shadow-sm transition-all ${
                    a.unlocked ? 'border-ink-100' : 'border-ink-100 opacity-60'
                  }`}>
                    {!a.unlocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-3.5 h-3.5 text-ink-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-0.5">
                      {!a.unlocked && <Lock className="w-3 h-3 text-ink-300 mr-1" />}
                      <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">+{a.xp} XP</span>
                    </div>
                    <div className={`text-3xl mb-2 ${!a.unlocked ? 'grayscale' : ''}`}>{a.emoji}</div>
                    <p className="text-sm font-semibold text-ink-900 leading-tight mb-0.5 pr-16">{a.title}</p>
                    <p className="text-xs text-ink-400 leading-snug mb-2">{a.desc}</p>
                    {a.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> Unlocked
                      </span>
                    ) : 'progress' in a && a.progress !== undefined && (
                      <div>
                        <div className="h-1 bg-ink-100 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${a.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-ink-800 mb-1">These are demo achievements</p>
                <p className="text-xs text-ink-400 mb-4">Sign up to track your real progress and earn XP as you read.</p>
                <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors">
                  Start earning XP <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Book bottom sheet ── */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBook(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-t-2xl shadow-2xl p-6">
            <div className="flex gap-5 mb-5">
              <div className="w-20 flex-shrink-0">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md relative">
                  <BookCover src={selectedBook.cover} title={selectedBook.title} authors={[selectedBook.author]} fill className="object-cover" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-bold text-ink-900 leading-tight mb-1">{selectedBook.title}</h3>
                <p className="text-sm text-ink-500 mb-2">{selectedBook.author}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedBook.status === 'reading' ? 'bg-brand-100 text-brand-700' :
                  selectedBook.status === 'read' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-ink-100 text-ink-600'
                }`}>
                  {selectedBook.status === 'reading' ? 'Currently Reading' :
                   selectedBook.status === 'read' ? 'Read' : 'Want to Read'}
                </span>
                {selectedBook.rating && (
                  <div className="flex items-center gap-0.5 mt-2">
                    {Array.from({ length: selectedBook.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors"
            >
              Track this in Chapterly <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const logged = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24];
  const today = 24;
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
      <p className="text-xs text-ink-400 mt-3 text-center">18-day streak — reading on {logged.length} days this month</p>
    </div>
  );
}

function MonthChart() {
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
  const values = [2, 3, 1, 4, 3, 2, 0, 0, 0, 0, 0, 0];
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
              <div className={`w-full h-full ${i === 5 ? 'bg-brand-500' : values[i] > 0 ? 'bg-brand-300' : 'bg-ink-100'}`} />
            </div>
            <span className="text-[9px] text-ink-400">{m}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-400 mt-2">March in progress — 2 books so far</p>
    </div>
  );
}

// Suppress unused import warnings for icons used in type position
const _Book = Book;
const _Target = Target;
const _Loader2 = Loader2;
void _Book; void _Target; void _Loader2;
