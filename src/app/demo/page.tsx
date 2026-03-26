'use client';

import { useState, useRef, useEffect } from 'react';
import {
  BookOpen, TrendingUp, Trophy, Target, Sparkles, Users, Search,
  BookMarked, BarChart2, Compass, Bell, Menu, X, ChevronDown,
  Quote, Flame, Star, Plus, Check, Brain, Zap, Dna,
  RefreshCw, ArrowRight, Clock, Heart, MessageCircle,
} from 'lucide-react';
import BookCover from '@/components/ui/BookCover';

// ── Types ─────────────────────────────────────────────────────────────────────

type Page =
  | 'overview' | 'my-books' | 'progress' | 'achievements'
  | 'reading-goals' | 'my-quotes' | 'ai' | 'feed'
  | 'find-readers' | 'book-clubs' | 'leaderboard' | 'discover';

type ShelfTab = 'reading' | 'to_read' | 'completed';
type AiTab = 'picks' | 'insights' | 'personality' | 'mood';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = { name: 'Alex', initials: 'AR', streak: 18, level: 7, xp: 1840 };

const MOCK_BOOKS = [
  { id: '1',  title: 'Fourth Wing',            author: 'Rebecca Yarros',   cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', status: 'reading',    page: 312, pages: 528, genre: 'Fantasy' },
  { id: '2',  title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin',  cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg', status: 'reading',    page: 87,  pages: 480, genre: 'Literary Fiction' },
  { id: '3',  title: 'The Women',              author: 'Kristin Hannah',   cover: 'https://covers.openlibrary.org/b/id/14791289-M.jpg', status: 'reading',    page: 145, pages: 464, genre: 'Historical Fiction' },
  { id: '4',  title: 'Iron Flame',             author: 'Rebecca Yarros',   cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', status: 'to_read',   page: 0,   pages: 640, genre: 'Fantasy' },
  { id: '5',  title: 'The Silent Patient',     author: 'Alex Michaelides', cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg',  status: 'to_read',   page: 0,   pages: 336, genre: 'Thriller' },
  { id: '6',  title: 'Lessons in Chemistry',  author: 'Bonnie Garmus',    cover: 'https://covers.openlibrary.org/b/id/12474616-M.jpg', status: 'to_read',   page: 0,   pages: 390, genre: 'Historical Fiction' },
  { id: '7',  title: 'Atomic Habits',         author: 'James Clear',      cover: 'https://covers.openlibrary.org/b/id/10523680-M.jpg', status: 'completed', page: 320, pages: 320, genre: 'Self-Help', rating: 5 },
  { id: '8',  title: 'The Midnight Library',  author: 'Matt Haig',        cover: 'https://covers.openlibrary.org/b/id/10706242-M.jpg', status: 'completed', page: 288, pages: 288, genre: 'Fiction',   rating: 4 },
  { id: '9',  title: 'Educated',              author: 'Tara Westover',    cover: 'https://covers.openlibrary.org/b/id/8583269-M.jpg',  status: 'completed', page: 334, pages: 334, genre: 'Memoir',    rating: 5 },
  { id: '10', title: 'The Seven Husbands',    author: 'Taylor Jenkins Reid', cover: 'https://covers.openlibrary.org/b/id/9748394-M.jpg', status: 'completed', page: 356, pages: 356, genre: 'Fiction',  rating: 4 },
];

const MOCK_RECS = [
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas',    cover: 'https://covers.openlibrary.org/b/id/10596748-M.jpg', genre: 'Fantasy',   vibe: 'Epic',      why: 'You loved Fourth Wing — same romantic fantasy energy with equally addictive world-building.' },
  { title: 'Normal People',               author: 'Sally Rooney',      cover: 'https://covers.openlibrary.org/b/id/10300997-M.jpg', genre: 'Literary',  vibe: 'Emotional', why: 'Matches your taste for Zevin\'s quiet, character-driven prose and emotional complexity.' },
  { title: 'The Kite Runner',             author: 'Khaled Hosseini',   cover: 'https://covers.openlibrary.org/b/id/7394958-M.jpg',  genre: 'Historical', vibe: 'Powerful', why: 'Your affinity for Hannah\'s historical fiction pairs perfectly with this unforgettable story.' },
];

const MOCK_INSIGHTS = [
  { emoji: '📅', title: 'Weekend Reader', body: 'You read 3× more on weekends. Your sessions average 52 minutes on Saturdays vs 18 on weekdays.', type: 'pattern' },
  { emoji: '🔥', title: '18-Day Streak!', body: 'Your longest streak ever. You\'ve read every day this month — that\'s in the top 5% of Chapterly readers.', type: 'achievement' },
  { emoji: '💡', title: 'Finish Line Approaching', body: 'At your current pace, you\'ll finish Fourth Wing in 6 days. Consider pushing to 40 pages/day to finish this week.', type: 'suggestion' },
];

const MOCK_PERSONALITY = { type: 'The Escapist', badge: '🔮', tagline: 'You read to disappear into other worlds — and you\'re very good at it.', element: 'moon', traits: ['Gravitates toward immersive fantasy and historical fiction', 'Reads in long sessions rather than short bursts', 'Prefers character-driven stories over plot-heavy thrillers', 'Tends to reread favorites when stressed'] };

const MOCK_DISCOVER = [
  { title: 'Intermezzo',                  author: 'Sally Rooney',        cover: 'https://covers.openlibrary.org/b/id/14850040-M.jpg', genre: 'Literary Fiction', trending: true },
  { title: 'James',                       author: 'Percival Everett',    cover: 'https://covers.openlibrary.org/b/id/14905800-M.jpg', genre: 'Historical Fiction', trending: true },
  { title: 'The God of the Woods',        author: 'Liz Moore',           cover: 'https://covers.openlibrary.org/b/id/14780020-M.jpg', genre: 'Thriller', trending: false },
  { title: 'All Fours',                   author: 'Miranda July',        cover: 'https://covers.openlibrary.org/b/id/14820010-M.jpg', genre: 'Literary Fiction', trending: false },
  { title: 'The Life Impossible',         author: 'Matt Haig',           cover: 'https://covers.openlibrary.org/b/id/14900500-M.jpg', genre: 'Fiction', trending: true },
  { title: 'Orbital',                     author: 'Samantha Harvey',     cover: 'https://covers.openlibrary.org/b/id/14860030-M.jpg', genre: 'Literary Fiction', trending: false },
  { title: 'The Women',                   author: 'Kristin Hannah',      cover: 'https://covers.openlibrary.org/b/id/14791289-M.jpg', genre: 'Historical Fiction', trending: true },
  { title: 'Demon Copperhead',            author: 'Barbara Kingsolver',  cover: 'https://covers.openlibrary.org/b/id/13273270-M.jpg', genre: 'Literary Fiction', trending: false },
];

const MOCK_FEED = [
  { user: 'Jordan K.', initials: 'JK', action: 'finished', book: 'Atomic Habits', rating: 5, time: '2h ago' },
  { user: 'Sam R.',    initials: 'SR', action: 'added',    book: 'Fourth Wing',  rating: null, time: '4h ago' },
  { user: 'Taylor M.', initials: 'TM', action: 'finished', book: 'The Midnight Library', rating: 4, time: '1d ago' },
  { user: 'Morgan L.', initials: 'ML', action: 'started',  book: 'The Silent Patient', rating: null, time: '1d ago' },
];

const MOCK_PEOPLE = [
  { name: 'Jordan Kim',   initials: 'JK', handle: 'jordanreads', books: 34, mutual: 3 },
  { name: 'Sam Rivera',   initials: 'SR', handle: 'sambooks',    books: 51, mutual: 1 },
  { name: 'Taylor Morgan',initials: 'TM', handle: 'taylorlibrary', books: 28, mutual: 2 },
  { name: 'Morgan Lee',   initials: 'ML', handle: 'morganpages', books: 19, mutual: 0 },
];

const MOCK_CLUBS = [
  { name: 'Fantasy Lovers',     members: 142, currentBook: 'A Court of Thorns and Roses', cover: 'https://covers.openlibrary.org/b/id/10596748-M.jpg' },
  { name: 'Literary Fiction',   members: 89,  currentBook: 'Normal People',               cover: 'https://covers.openlibrary.org/b/id/10300997-M.jpg' },
  { name: 'Thriller Thursday',  members: 203, currentBook: 'The Silent Patient',          cover: 'https://covers.openlibrary.org/b/id/8744696-M.jpg' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Sam Rivera',   initials: 'SR', books: 51, streak: 42, points: 2840 },
  { rank: 2, name: 'Taylor Morgan',initials: 'TM', books: 43, streak: 31, points: 2410 },
  { rank: 3, name: 'Alex Reader',  initials: 'AR', books: 37, streak: 18, points: 1840, isYou: true },
  { rank: 4, name: 'Jordan Kim',   initials: 'JK', books: 34, streak: 14, points: 1620 },
  { rank: 5, name: 'Morgan Lee',   initials: 'ML', books: 28, streak: 9,  points: 1190 },
];

const MOCK_ACHIEVEMENTS = [
  { emoji: '🔥', title: 'On Fire',       desc: '7-day reading streak',        earned: true  },
  { emoji: '📚', title: 'Bookworm',      desc: 'Read 10 books',               earned: true  },
  { emoji: '🌙', title: 'Night Owl',     desc: 'Log a session after midnight', earned: true  },
  { emoji: '⚡', title: 'Speed Reader', desc: 'Read 100 pages in one session', earned: true  },
  { emoji: '🏆', title: 'Champion',      desc: 'Reach the top of leaderboard', earned: false },
  { emoji: '🎯', title: 'Goal Setter',   desc: 'Complete a yearly challenge',  earned: false },
  { emoji: '🌍', title: 'Globe Trotter', desc: 'Read books from 5 countries',  earned: false },
  { emoji: '💎', title: 'Diamond',       desc: '365-day streak',               earned: false },
];

const MOCK_QUOTES = [
  { text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.', book: 'The Little Prince', author: 'Antoine de Saint-Exupéry', page: 63 },
  { text: 'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go.', book: 'I Can Read With My Eyes Shut!', author: 'Dr. Seuss', page: 12 },
  { text: 'She is too fond of books, and it has turned her brain.', book: 'Alcott Journals', author: 'Louisa May Alcott', page: null },
];

const MOODS = [
  { label: 'Adventurous', emoji: '🗺️' }, { label: 'Cozy',      emoji: '☕' },
  { label: 'Thoughtful',  emoji: '🧠' }, { label: 'Thrilled',  emoji: '😱' },
  { label: 'Romantic',    emoji: '💕' }, { label: 'Inspired',  emoji: '✨' },
  { label: 'Escapist',    emoji: '🔮' }, { label: 'Funny',     emoji: '😂' },
];

const ELEMENT_STYLES: Record<string, { gradient: string; ring: string; text: string; badge: string }> = {
  moon: { gradient: 'from-ink-50 to-brand-50', ring: 'ring-brand-200', text: 'text-ink-700', badge: 'bg-ink-700 text-white' },
  fire: { gradient: 'from-brand-100 to-brand-200', ring: 'ring-brand-400', text: 'text-brand-700', badge: 'bg-brand-500 text-white' },
};

// ── Nav dropdown ──────────────────────────────────────────────────────────────

function NavDropdown({ label, items, active, open, onToggle, onClose, onNavigate }: {
  label: string;
  items: { href: Page; label: string; icon: React.ElementType }[];
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
          active || open
            ? 'text-brand-600 bg-brand-50'
            : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
        }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-ink-100 rounded-xl shadow-lg p-2 min-w-[200px]">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => { onNavigate(item.href); onClose(); }}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main demo component ───────────────────────────────────────────────────────

export default function DemoPage() {
  const [page, setPage]               = useState<Page>('overview');
  const [shelfTab, setShelfTab]       = useState<ShelfTab>('reading');
  const [aiTab, setAiTab]             = useState<AiTab>('picks');
  const [personalOpen, setPersonalOpen] = useState(false);
  const [socialOpen, setSocialOpen]     = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [addedBooks, setAddedBooks]     = useState<Set<string>>(new Set());

  const PERSONAL_ITEMS = [
    { href: 'my-books'      as Page, label: 'My Books',     icon: BookOpen  },
    { href: 'progress'      as Page, label: 'Progress',     icon: TrendingUp },
    { href: 'achievements'  as Page, label: 'Achievements', icon: Trophy    },
    { href: 'reading-goals' as Page, label: 'Reading Goals',icon: Target    },
    { href: 'my-quotes'     as Page, label: 'My Quotes',    icon: Quote     },
  ];

  const SOCIAL_ITEMS = [
    { href: 'feed'         as Page, label: 'Feed',         icon: Users     },
    { href: 'find-readers' as Page, label: 'Find Readers', icon: Search    },
    { href: 'book-clubs'   as Page, label: 'Book Clubs',   icon: BookMarked },
    { href: 'leaderboard'  as Page, label: 'Leaderboard',  icon: BarChart2 },
  ];

  const isPersonalActive = ['my-books','progress','achievements','reading-goals','my-quotes','overview'].includes(page);
  const isSocialActive   = ['feed','find-readers','book-clubs','leaderboard'].includes(page);
  const isAIActive       = page === 'ai';
  const isDiscoverActive = page === 'discover';

  const navigate = (p: Page) => { setPage(p); setMobileOpen(false); };

  const shelfBooks = MOCK_BOOKS.filter(b => b.status === shelfTab);

  return (
    <div className="min-h-screen bg-paper-50">

      {/* ── Top nav bar ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-[52px] bg-white/90 backdrop-blur-xl border-b border-ink-100/50">
        <div className="flex items-center justify-between h-full px-6">

          {/* Logo */}
          <button onClick={() => navigate('overview')} className="flex-shrink-0">
            <span className="font-display text-lg font-semibold text-brand-600 tracking-tight">Chapterly</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavDropdown
              label="Personal"
              items={PERSONAL_ITEMS}
              active={isPersonalActive}
              open={personalOpen}
              onToggle={() => { setPersonalOpen(v => !v); setSocialOpen(false); }}
              onClose={() => setPersonalOpen(false)}
              onNavigate={navigate}
            />
            <button
              onClick={() => navigate('ai')}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isAIActive ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI
            </button>
            <NavDropdown
              label="Social"
              items={SOCIAL_ITEMS}
              active={isSocialActive}
              open={socialOpen}
              onToggle={() => { setSocialOpen(v => !v); setPersonalOpen(false); }}
              onClose={() => setSocialOpen(false)}
              onNavigate={navigate}
            />
            <button
              onClick={() => navigate('discover')}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isDiscoverActive ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Discover
            </button>
          </nav>

          {/* Right: bell + avatar + hamburger */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-ink-50 transition-colors">
              <Bell className="w-4 h-4 text-ink-500" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="hidden md:flex w-8 h-8 rounded-full bg-brand-100 items-center justify-center text-brand-700 text-sm font-bold ring-2 ring-ink-100">
              {MOCK_USER.initials}
              {/* level badge */}
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-ink-50 transition-colors">
              {mobileOpen ? <X className="w-5 h-5 text-ink-600" /> : <Menu className="w-5 h-5 text-ink-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-[52px] inset-x-0 z-40 bg-white border-b border-ink-100 md:hidden shadow-lg overflow-y-auto max-h-[calc(100vh-52px)]">
            <div className="px-4 py-3 space-y-4">
              {[{ label: 'Personal', items: PERSONAL_ITEMS }, { label: 'Social', items: SOCIAL_ITEMS }].map(section => (
                <div key={section.label}>
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">{section.label}</p>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.href} onClick={() => navigate(item.href)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors">
                        <Icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">AI</p>
                <button onClick={() => navigate('ai')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors">
                  <Sparkles className="w-4 h-4 flex-shrink-0" /> AI Insights
                </button>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">Discover</p>
                <button onClick={() => navigate('discover')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors">
                  <Compass className="w-4 h-4 flex-shrink-0" /> Discover Books
                </button>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-ink-100">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">{MOCK_USER.initials}</div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{MOCK_USER.name}</p>
                  <p className="text-xs text-ink-400">Level {MOCK_USER.level} · {MOCK_USER.streak} day streak</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Demo banner ── */}
      <div className="fixed top-[52px] inset-x-0 z-30 bg-brand-500 text-white text-center text-xs py-1.5 font-medium">
        👋 This is an interactive demo — explore the full product
        <button onClick={() => navigate('overview')} className="ml-3 underline opacity-80 hover:opacity-100">Back to Home</button>
      </div>

      {/* ── Main content ── */}
      <main className="pt-[52px] pb-12 mt-[28px]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          {/* ── OVERVIEW (Dashboard) ── */}
          {page === 'overview' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">Hey, {MOCK_USER.name}</h1>

              {/* AI Insights widget */}
              <section>
                <div className="bg-gradient-to-br from-brand-50 to-paper-100 rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-ink-800">AI Insights</span>
                  </div>
                  <div className="space-y-2">
                    {MOCK_INSIGHTS.slice(0, 2).map((ins, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-lg leading-none mt-0.5">{ins.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{ins.title}</p>
                          <p className="text-xs text-ink-500 leading-relaxed">{ins.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('ai')} className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    See all AI insights <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </section>

              {/* Continue Reading */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Continue Reading</h2>
                <div className="space-y-3">
                  {MOCK_BOOKS.filter(b => b.status === 'reading').map(book => (
                    <div key={book.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 transition-colors cursor-pointer">
                      <div className="w-12 flex-shrink-0 relative" style={{ height: 72 }}>
                        <BookCover src={book.cover} title={book.title} authors={[book.author]} width={48} height={72} className="rounded-lg object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink-900 truncate">{book.title}</p>
                        <p className="text-xs text-ink-400 truncate">{book.author}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.round((book.page / book.pages) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-ink-400 flex-shrink-0">{Math.round((book.page / book.pages) * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-medium">Log</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Daily Goal */}
              <section>
                <div className="bg-white rounded-2xl border border-ink-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-base font-semibold text-ink-800">Daily Goal</h2>
                    <div className="flex items-center gap-1 text-brand-500 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5" /> {MOCK_USER.streak} day streak
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Ring */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#f0ebe3" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#ee7a1e" strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(35/30, 1))}`}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-brand-600">35</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Goal complete! 🎉</p>
                      <p className="text-xs text-ink-400 mt-0.5">35 of 30 pages read today</p>
                      <p className="text-xs text-ink-300 mt-1">5 pages over your daily goal</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Social Pulse */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Social Pulse</h2>
                <div className="space-y-2">
                  {MOCK_FEED.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-ink-100">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">{item.initials}</div>
                      <p className="text-sm text-ink-700 flex-1 min-w-0">
                        <span className="font-semibold">{item.user}</span>
                        {' '}{item.action}{' '}
                        <span className="font-medium text-ink-900">{item.book}</span>
                        {item.rating && <span className="ml-1 text-brand-500">{'★'.repeat(item.rating)}</span>}
                      </p>
                      <span className="text-[10px] text-ink-300 flex-shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Stats */}
              <section>
                <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Your Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Books This Year', value: '12',    icon: BookOpen },
                    { label: 'All-Time Books',  value: '47',    icon: BookMarked },
                    { label: 'Day Streak',       value: '18🔥',  icon: Flame },
                    { label: 'Pages Read',       value: '12.4k', icon: TrendingUp },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-ink-100 p-4 text-center">
                      <p className="font-display text-2xl font-bold text-ink-900">{stat.value}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ── MY BOOKS ── */}
          {page === 'my-books' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">My Books</h1>
              {/* Sub-tabs */}
              <div className="flex gap-1 bg-white border border-ink-100 rounded-2xl p-1 mb-6 shadow-sm">
                {(['reading','to_read','completed'] as ShelfTab[]).map(tab => (
                  <button key={tab} onClick={() => setShelfTab(tab)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${shelfTab === tab ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}>
                    {tab === 'reading' ? 'Reading' : tab === 'to_read' ? 'To Read' : 'Completed'}
                    <span className="ml-1.5 opacity-70">({MOCK_BOOKS.filter(b => b.status === tab).length})</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {shelfBooks.map(book => (
                  <div key={book.id} className="group cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden aspect-[2/3] shadow-sm group-hover:shadow-md transition-shadow">
                      <BookCover src={book.cover} title={book.title} authors={[book.author]} fill className="object-cover" />
                      {shelfTab === 'reading' && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm px-2 py-1.5">
                          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: `${Math.round((book.page / book.pages) * 100)}%` }} />
                          </div>
                          <p className="text-[9px] text-white/80 text-right mt-0.5">{Math.round((book.page / book.pages) * 100)}%</p>
                        </div>
                      )}
                      {shelfTab === 'completed' && (book as any).rating && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-1.5 py-0.5">
                          <span className="text-[10px] text-brand-300">{'★'.repeat((book as any).rating)}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-ink-900 truncate">{book.title}</p>
                    <p className="text-[10px] text-ink-400 truncate">{book.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROGRESS ── */}
          {page === 'progress' && (
            <div className="space-y-8">
              <h1 className="font-display text-2xl font-bold text-ink-900">Progress</h1>
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Books This Year', value: '12' },
                  { label: 'Pages Read',       value: '12,400' },
                  { label: 'Avg per Day',      value: '34 pg' },
                  { label: 'Sessions',         value: '89' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-ink-100 p-4 text-center">
                    <p className="font-display text-2xl font-bold text-ink-900">{s.value}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Monthly chart */}
              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <h2 className="font-display text-base font-semibold text-ink-800 mb-4">Books per Month</h2>
                <div className="flex items-end gap-2 h-28">
                  {[1,2,3,2,0,1,3,2,4,2,1,1].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md bg-brand-400 transition-all"
                        style={{ height: `${v * 24}px`, opacity: i === 10 ? 1 : 0.6 }} />
                      <span className="text-[8px] text-ink-300">
                        {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Genre breakdown */}
              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <h2 className="font-display text-base font-semibold text-ink-800 mb-4">Reading DNA</h2>
                <div className="space-y-3">
                  {[
                    { genre: 'Fantasy', pct: 38 },
                    { genre: 'Historical Fiction', pct: 26 },
                    { genre: 'Literary Fiction', pct: 18 },
                    { genre: 'Thriller', pct: 12 },
                    { genre: 'Self-Help', pct: 6 },
                  ].map(g => (
                    <div key={g.genre}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-ink-700">{g.genre}</span>
                        <span className="text-ink-400">{g.pct}%</span>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full" style={{ width: `${g.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {page === 'achievements' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Achievements</h1>
              <p className="text-sm text-ink-400 mb-6">Level {MOCK_USER.level} · {MOCK_USER.xp} XP</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {MOCK_ACHIEVEMENTS.map((a, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                    a.earned ? 'bg-white border-brand-100 shadow-sm' : 'bg-ink-50 border-ink-100 opacity-50'
                  }`}>
                    <span className="text-3xl">{a.emoji}</span>
                    <p className="text-xs font-bold text-ink-900">{a.title}</p>
                    <p className="text-[10px] text-ink-400 leading-snug">{a.desc}</p>
                    {a.earned && <span className="text-[9px] bg-brand-50 text-brand-600 border border-brand-100 rounded-full px-2 py-0.5 font-semibold">Earned</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── READING GOALS ── */}
          {page === 'reading-goals' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-ink-900">Reading Goals</h1>
              {/* Year challenge */}
              <div className="bg-gradient-to-br from-brand-50 to-paper-100 rounded-2xl border border-brand-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-900">2025 Reading Challenge</h2>
                    <p className="text-sm text-ink-400">12 of 24 books read</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-brand-600">50%</p>
                    <p className="text-xs text-ink-400">on track</p>
                  </div>
                </div>
                <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: '50%' }} />
                </div>
                <p className="text-xs text-ink-400 mt-2">12 more to go · 9 months remaining</p>
              </div>
              {/* Monthly goal */}
              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <h2 className="font-display text-base font-semibold text-ink-800 mb-3">March Goal</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-ink-600">2 of 3 books</span>
                      <span className="text-ink-400">66%</span>
                    </div>
                    <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full" style={{ width: '66%' }} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Daily goal */}
              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-base font-semibold text-ink-800">Daily Page Goal</h2>
                  <span className="text-sm font-bold text-brand-600">30 pages/day</span>
                </div>
                <p className="text-xs text-ink-400">You&apos;ve hit your goal 14 of the last 18 days</p>
              </div>
            </div>
          )}

          {/* ── MY QUOTES ── */}
          {page === 'my-quotes' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">My Quotes</h1>
              <div className="space-y-4">
                {MOCK_QUOTES.map((q, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-ink-100 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Quote className="w-5 h-5 text-brand-300 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-ink-700 leading-relaxed italic">{q.text}</p>
                    </div>
                    <div className="flex items-center justify-between pl-8">
                      <div>
                        <p className="text-xs font-semibold text-ink-600">{q.book}</p>
                        <p className="text-[10px] text-ink-400">{q.author}{q.page ? ` · p. ${q.page}` : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI HUB ── */}
          {page === 'ai' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-ink-900">AI Reading Hub</h1>
                </div>
                <p className="text-sm text-ink-400 ml-12">Powered by Claude — personalized to your reading life</p>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-white border border-ink-100 rounded-2xl p-1 mb-6 shadow-sm">
                {([
                  { id: 'picks' as AiTab, label: 'For You',  icon: Star    },
                  { id: 'insights' as AiTab, label: 'Insights', icon: TrendingUp },
                  { id: 'personality' as AiTab, label: 'My Type',  icon: Brain   },
                  { id: 'mood' as AiTab, label: 'By Mood',  icon: Zap     },
                ]).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setAiTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${aiTab === id ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-400 hover:text-ink-700'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* For You */}
              {aiTab === 'picks' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-800">Picked For You</h2>
                    <p className="text-xs text-ink-400">Claude analyzed your shelf to find these</p>
                  </div>
                  {MOCK_RECS.map((rec, i) => {
                    const key = `${rec.title}-${rec.author}`;
                    return (
                      <div key={i} className="bg-white rounded-2xl border border-ink-100 overflow-hidden hover:border-brand-200 hover:shadow-sm transition-all">
                        <div className="flex gap-4 p-4">
                          <div className="flex-shrink-0 w-16 relative" style={{ height: 96 }}>
                            <BookCover src={rec.cover} title={rec.title} authors={[rec.author]} width={64} height={96} className="rounded-xl shadow-sm object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm text-ink-900 leading-snug">{rec.title}</p>
                              <span className="text-[10px] bg-brand-50 border border-brand-100 text-brand-700 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">{rec.vibe}</span>
                            </div>
                            <p className="text-xs text-ink-400 mb-2">{rec.author} <span className="text-ink-300">· {rec.genre}</span></p>
                            <p className="text-xs text-ink-600 italic border-l-2 border-brand-200 pl-2 leading-relaxed mb-2">&ldquo;{rec.why}&rdquo;</p>
                            <button
                              onClick={() => setAddedBooks(prev => new Set(prev).add(key))}
                              disabled={addedBooks.has(key)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${addedBooks.has(key) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100'}`}>
                              {addedBooks.has(key) ? <><Check className="w-3 h-3" /> Added to shelf</> : <><Plus className="w-3 h-3" /> Add to shelf</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Insights */}
              {aiTab === 'insights' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-800">Reading Insights</h2>
                    <p className="text-xs text-ink-400">Patterns and coaching from your last 30 days</p>
                  </div>
                  <div className="space-y-3">
                    {MOCK_INSIGHTS.map((ins, i) => (
                      <div key={i} className="rounded-2xl p-4 border-l-2 border-l-brand-300 bg-white border border-ink-100">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{ins.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm text-ink-900">{ins.title}</p>
                            <p className="text-xs text-ink-500 leading-relaxed mt-1">{ins.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Finish Line */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-brand-500" />
                      <h2 className="font-display text-base font-semibold text-ink-800">Finish Line</h2>
                    </div>
                    <p className="text-xs text-ink-400 -mt-1 mb-3">At your current pace, you&apos;ll finish these by…</p>
                    {MOCK_BOOKS.filter(b => b.status === 'reading').map(book => (
                      <div key={book.id} className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4 mb-2">
                        <div className="flex-shrink-0 w-10 relative" style={{ height: 56 }}>
                          <BookCover src={book.cover} title={book.title} authors={[book.author]} width={40} height={56} className="rounded-lg shadow-sm object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{book.title}</p>
                          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden my-1.5">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.round((book.page/book.pages)*100)}%` }} />
                          </div>
                          <p className="text-xs text-ink-500"><span className="font-semibold text-brand-600">{Math.round((book.pages - book.page) / 34)} days</span> — {book.pages - book.page} pages left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Reading DNA */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Dna className="w-4 h-4 text-brand-500" />
                      <h2 className="font-display text-base font-semibold text-ink-800">Reading DNA</h2>
                    </div>
                    <div className="bg-white rounded-2xl border border-ink-100 p-5 space-y-3">
                      <p className="text-sm text-ink-600 italic border-l-2 border-brand-200 pl-3 leading-relaxed">&ldquo;You gravitate toward immersive, character-driven narratives with strong female protagonists and a dash of magic or history.&rdquo;</p>
                      {[['Fantasy',38],['Historical Fiction',26],['Literary Fiction',18]].map(([g,p]) => (
                        <div key={g}>
                          <div className="flex justify-between text-xs mb-1"><span className="font-medium text-ink-700">{g}</span><span className="text-ink-400">{p}%</span></div>
                          <div className="h-2 bg-ink-100 rounded-full overflow-hidden"><div className="h-full bg-brand-400 rounded-full" style={{ width: `${p}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* My Type */}
              {aiTab === 'personality' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-800">Your Reading Type</h2>
                    <p className="text-xs text-ink-400">Claude&apos;s take on what kind of reader you are</p>
                  </div>
                  {/* Hero card */}
                  <div className="rounded-3xl bg-gradient-to-br from-ink-50 to-brand-50 p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-3xl ring-2 ring-brand-200 shadow-md">
                        {MOCK_PERSONALITY.badge}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-ink-700 opacity-70">Your Reading Type</p>
                        <h3 className="font-display text-xl font-bold text-ink-700 leading-tight">{MOCK_PERSONALITY.type}</h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed italic text-ink-700 opacity-80">&ldquo;{MOCK_PERSONALITY.tagline}&rdquo;</p>
                  </div>
                  {/* Traits */}
                  <div className="bg-white rounded-2xl border border-ink-100 p-5">
                    <p className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" /> Your Reading Traits
                    </p>
                    <div className="space-y-2.5">
                      {MOCK_PERSONALITY.traits.map((trait, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-lg bg-ink-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold">{i + 1}</span>
                          </div>
                          <p className="text-sm text-ink-700 leading-snug">{trait}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-paper-50 rounded-2xl border border-paper-200 p-4 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                    <p className="text-xs text-ink-500">Your personality is recalculated based on your latest reading data — come back after more sessions to see how you evolve.</p>
                  </div>
                </div>
              )}

              {/* By Mood */}
              {aiTab === 'mood' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink-800">What&apos;s Your Mood?</h2>
                    <p className="text-xs text-ink-400">Pick a vibe and Claude will find the perfect read</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {MOODS.map(mood => (
                      <button key={mood.label} onClick={() => setSelectedMood(mood.label)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border text-center transition-all ${
                          selectedMood === mood.label
                            ? 'bg-brand-500 border-transparent text-white shadow-md shadow-brand-500/20'
                            : 'bg-white border-ink-100 text-ink-700 hover:border-brand-200 hover:bg-brand-50'
                        }`}>
                        <span className="text-xl">{mood.emoji}</span>
                        <span className="text-[10px] font-semibold leading-tight">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedMood ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
                        {MOODS.find(m => m.label === selectedMood)?.emoji} {selectedMood} picks
                      </p>
                      {MOCK_RECS.map((rec, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-12 relative" style={{ height: 72 }}>
                              <BookCover src={rec.cover} title={rec.title} authors={[rec.author]} width={48} height={72} className="rounded-lg shadow-sm object-cover" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-ink-900">{rec.title}</p>
                              <p className="text-xs text-ink-400">{rec.author}</p>
                              <p className="text-xs text-ink-500 italic mt-1">&ldquo;{rec.why}&rdquo;</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-ink-300">
                      <span className="text-5xl block mb-3">🎭</span>
                      <p className="text-sm text-ink-400">Tap a mood above to get your picks</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FEED ── */}
          {page === 'feed' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Feed</h1>
              <div className="space-y-3">
                {MOCK_FEED.map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">{item.initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900">{item.user}</p>
                        <p className="text-xs text-ink-400">{item.action === 'finished' ? 'finished reading' : item.action === 'added' ? 'added to shelf' : 'started reading'} · {item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-paper-50 rounded-xl">
                      <p className="text-sm font-semibold text-ink-900">{item.book}</p>
                      {item.rating && <span className="text-brand-400 text-xs">{'★'.repeat(item.rating)}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-ink-50">
                      <button className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-brand-500 transition-colors"><Heart className="w-3.5 h-3.5" /> Like</button>
                      <button className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-brand-500 transition-colors"><MessageCircle className="w-3.5 h-3.5" /> Comment</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FIND READERS ── */}
          {page === 'find-readers' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Find Readers</h1>
              <p className="text-sm text-ink-400 mb-6">Discover readers with similar taste</p>
              <div className="space-y-3">
                {MOCK_PEOPLE.map((person, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100">
                    <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">{person.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-900">{person.name}</p>
                      <p className="text-xs text-ink-400">@{person.handle} · {person.books} books · {person.mutual > 0 ? `${person.mutual} mutual` : 'No mutuals yet'}</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-semibold border border-brand-100 hover:bg-brand-100 transition-colors">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOOK CLUBS ── */}
          {page === 'book-clubs' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Book Clubs</h1>
              <div className="space-y-4">
                {MOCK_CLUBS.map((club, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 flex-shrink-0 relative" style={{ height: 84 }}>
                        <BookCover src={club.cover} title={club.currentBook} authors={[]} width={56} height={84} className="rounded-lg shadow-sm object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-ink-900">{club.name}</p>
                        <p className="text-xs text-ink-400 mb-1">{club.members} members</p>
                        <p className="text-xs text-ink-500">Now reading: <span className="font-medium text-ink-700">{club.currentBook}</span></p>
                      </div>
                      <button className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-semibold border border-brand-100 hover:bg-brand-100 transition-colors">Join</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LEADERBOARD ── */}
          {page === 'leaderboard' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-6">Leaderboard</h1>
              <div className="space-y-2">
                {MOCK_LEADERBOARD.map(entry => (
                  <div key={entry.rank} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    entry.isYou ? 'bg-brand-50 border-brand-200' : 'bg-white border-ink-100'
                  }`}>
                    <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${entry.rank <= 3 ? 'text-brand-500' : 'text-ink-400'}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">{entry.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-900">{entry.name}{entry.isYou && <span className="ml-1.5 text-[10px] bg-brand-500 text-white rounded-full px-1.5 py-0.5 font-bold">You</span>}</p>
                      <p className="text-xs text-ink-400">{entry.books} books · {entry.streak}🔥 streak</p>
                    </div>
                    <span className="font-bold text-sm text-ink-700 flex-shrink-0">{entry.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DISCOVER ── */}
          {page === 'discover' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">Discover</h1>
              <p className="text-sm text-ink-400 mb-6">Trending books in your community</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {MOCK_DISCOVER.map((book, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden aspect-[2/3] shadow-sm group-hover:shadow-md transition-shadow">
                      <BookCover src={book.cover} title={book.title} authors={[book.author]} fill className="object-cover" />
                      {book.trending && (
                        <div className="absolute top-2 left-2 bg-brand-500 text-white text-[9px] font-bold rounded-full px-2 py-0.5">Trending</div>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-ink-900 truncate">{book.title}</p>
                    <p className="text-[10px] text-ink-400 truncate">{book.author}</p>
                    <p className="text-[10px] text-ink-300">{book.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
