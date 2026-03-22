'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search, Share2, Upload, LogOut, Plus, Flame, LayoutDashboard,
  BookMarked, Compass, Users, Trophy, Rss, BookOpen, Crown,
  CalendarDays, Sparkles, Brain, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';

type Section = 'shelf' | 'circle' | 'explore';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tab?: string;
}

const SHELF_NAV: NavItem[] = [
  { href: '/dashboard?tab=overview', label: 'Home', icon: LayoutDashboard, tab: 'overview' },
  { href: '/dashboard?tab=reading', label: 'My Books', icon: BookMarked, tab: 'reading' },
  { href: '/dashboard?tab=search', label: 'Search Books', icon: Search, tab: 'search' },
  { href: '/dashboard?tab=streak', label: 'Stats & Streak', icon: Flame, tab: 'streak' },
  { href: '/ai', label: 'AI Insights', icon: Brain },
  { href: '/challenge', label: 'Reading Goals', icon: Trophy },
  { href: '/wrapped', label: 'Year in Books', icon: CalendarDays },
  { href: '/dashboard?tab=share', label: 'Share Cards', icon: Share2, tab: 'share' },
  { href: '/dashboard?tab=import', label: 'Import Library', icon: Upload, tab: 'import' },
];

const CIRCLE_NAV: NavItem[] = [
  { href: '/feed', label: 'Friends Feed', icon: Rss },
  { href: '/people', label: 'Find Readers', icon: Users },
  { href: '/clubs', label: 'Book Clubs', icon: BookOpen },
  { href: '/creators', label: 'Creators', icon: Sparkles },
];

const EXPLORE_NAV: NavItem[] = [
  { href: '/discover', label: 'Browse Books', icon: Compass },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/premium', label: 'Go Premium ✨', icon: Crown },
];

const SECTION_NAV: Record<Section, NavItem[]> = {
  shelf: SHELF_NAV,
  circle: CIRCLE_NAV,
  explore: EXPLORE_NAV,
};

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'shelf', label: 'My Shelf', icon: BookMarked },
  { id: 'circle', label: 'Circle', icon: Users },
  { id: 'explore', label: 'Explore', icon: Compass },
];

function detectSection(pathname: string, tab: string | null): Section {
  if (
    pathname.startsWith('/feed') ||
    pathname.startsWith('/people') ||
    pathname.startsWith('/clubs') ||
    pathname.startsWith('/creators')
  ) return 'circle';
  if (
    pathname.startsWith('/discover') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/premium')
  ) return 'explore';
  return 'shelf';
}

export default function Navigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const currentTab = searchParams.get('tab') || 'overview';
  const detectedSection = detectSection(pathname, currentTab);
  const [activeSection, setActiveSection] = useState<Section>(detectedSection);

  // Sync section when route changes (e.g. back/forward navigation)
  useEffect(() => {
    setActiveSection(detectSection(pathname, currentTab));
  }, [pathname, currentTab]);

  const navItems = SECTION_NAV[activeSection];

  const isItemActive = (item: NavItem) => {
    if (item.tab) return currentTab === item.tab && pathname === '/dashboard';
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800 z-40">

        {/* Logo */}
        <div className="p-6 border-b border-ink-100 dark:border-ink-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="font-display text-xl font-bold text-ink-950 dark:text-paper-50">Chapterly</span>
          </Link>
        </div>

        {/* Section toggle */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex rounded-xl bg-ink-50 dark:bg-ink-900 p-1 gap-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                  activeSection === id
                    ? 'bg-white dark:bg-ink-800 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav items for active section */}
        <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900'
                    : 'text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                {name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-paper-100 truncate">{name}</p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-ink-950 border-t border-ink-100 dark:border-ink-800 z-40 pb-safe">
        <div className="flex items-center h-16 px-2 relative">
          {/* My Shelf */}
          <button
            onClick={() => { setActiveSection('shelf'); router.push('/dashboard?tab=overview'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              activeSection === 'shelf' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Shelf</span>
          </button>

          {/* Circle */}
          <button
            onClick={() => { setActiveSection('circle'); router.push('/feed'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              activeSection === 'circle' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Circle</span>
          </button>

          {/* Centre add button */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => router.push('/dashboard?tab=search')}
              className="w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all active:scale-95 -mt-6"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Explore */}
          <button
            onClick={() => { setActiveSection('explore'); router.push('/discover'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              activeSection === 'explore' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>

          {/* AI shortcut */}
          <button
            onClick={() => { setActiveSection('shelf'); router.push('/ai'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              pathname === '/ai' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px] font-medium">AI</span>
          </button>
        </div>
      </nav>
    </>
  );
}
