'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, TrendingUp, Trophy, Target, Sparkles, Users, Search,
  BookMarked, BarChart2, Compass, Bell, Settings,
  ChevronDown, Quote, MoreHorizontal,
} from 'lucide-react';
import { useAuth, useNotifications } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';

// ── Nav structure ──────────────────────────────────────────────────────────────

const PERSONAL_ITEMS = [
  { href: '/dashboard?tab=reading', label: 'My Books',      icon: BookOpen },
  { href: '/progress',              label: 'Progress',       icon: TrendingUp },
  { href: '/achievements',          label: 'Achievements',   icon: Trophy },
  { href: '/challenge',             label: 'Reading Goals',  icon: Target },
  { href: '/quotes',                label: 'My Quotes',      icon: Quote },
];

const SOCIAL_ITEMS = [
  { href: '/feed',        label: 'Feed',         icon: Users },
  { href: '/people',      label: 'Find Readers', icon: Search },
  { href: '/clubs',       label: 'Book Clubs',   icon: BookMarked },
  { href: '/leaderboard', label: 'Leaderboard',  icon: BarChart2 },
];

// Bottom tab bar items (mobile only) — the 4 primary + More
const BOTTOM_TABS = [
  { href: '/dashboard?tab=reading', label: 'Books',    icon: BookOpen,       match: ['/dashboard', '/book'] },
  { href: '/discover',              label: 'Discover', icon: Compass,        match: ['/discover'] },
  { href: '/ai',                    label: 'AI',       icon: Sparkles,       match: ['/ai'] },
  { href: '/feed',                  label: 'Social',   icon: Users,          match: ['/feed', '/people', '/clubs', '/leaderboard'] },
  { href: '/more',                  label: 'More',     icon: MoreHorizontal, match: ['/more', '/progress', '/achievements', '/challenge', '/quotes', '/settings'] },
];

// Which paths make each top-level item "active"
function isPersonalActive(pathname: string): boolean {
  return ['/dashboard', '/progress', '/achievements', '/challenge', '/quotes'].some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
}

function isSocialActive(pathname: string): boolean {
  return ['/feed', '/people', '/clubs', '/leaderboard'].some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
}

function isTabActive(pathname: string, match: string[]): boolean {
  return match.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'));
}

// ── Dropdown component ─────────────────────────────────────────────────────────

interface DropdownItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function NavDropdown({
  label,
  items,
  active,
  open,
  onToggle,
  onClose,
}: {
  label: string;
  items: DropdownItem[];
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
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
            ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950'
            : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900'
        }`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 rounded-xl shadow-lg p-2 min-w-[200px]">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Navigation ────────────────────────────────────────────────────────────

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [socialOpen,   setSocialOpen]   = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  // Fetch XP/level and handle for avatar link
  const [readerLevel, setReaderLevel] = useState<number | null>(null);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j?.data?.reader_level) setReaderLevel(j.data.reader_level as number);
        if (j?.data?.handle) setUserHandle(j.data.handle as string);
      })
      .catch(() => {});
  }, []);

  const isAIActive       = pathname === '/ai' || pathname.startsWith('/ai/');
  const isDiscoverActive = pathname === '/discover' || pathname.startsWith('/discover/');

  return (
    <>
      {/* ── Fixed top navigation bar ── */}
      <header className="fixed top-0 inset-x-0 z-40 h-[52px] bg-white/80 dark:bg-ink-950/80 backdrop-blur-xl border-b border-ink-100/50 dark:border-ink-800/50">
        <div className="flex items-center justify-between h-full px-6">

          {/* Left: Logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <span className="font-display text-lg font-semibold text-brand-600 dark:text-brand-400 tracking-tight">
              Chapterly
            </span>
          </Link>

          {/* Center: Desktop nav — 4 categories */}
          <nav className="hidden md:flex items-center gap-1">
            <NavDropdown
              label="Personal"
              items={PERSONAL_ITEMS}
              active={isPersonalActive(pathname)}
              open={personalOpen}
              onToggle={() => { setPersonalOpen(v => !v); setSocialOpen(false); }}
              onClose={() => setPersonalOpen(false)}
            />
            <Link
              href="/ai"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isAIActive
                  ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI
            </Link>
            <NavDropdown
              label="Social"
              items={SOCIAL_ITEMS}
              active={isSocialActive(pathname)}
              open={socialOpen}
              onToggle={() => { setSocialOpen(v => !v); setPersonalOpen(false); }}
              onClose={() => setSocialOpen(false)}
            />
            <Link
              href="/discover"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isDiscoverActive
                  ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Discover
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
            >
              <Bell className="w-4 h-4 text-ink-500 dark:text-ink-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme toggle (desktop only) */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Settings icon (desktop) */}
            <Link
              href="/settings"
              className="hidden md:flex p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-[18px] h-[18px] text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors" />
            </Link>

            {/* User avatar → direct profile link (desktop) */}
            <Link
              href={userHandle ? `/u/${userHandle}` : '/settings'}
              className="relative hidden md:flex items-center"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-ink-100 dark:ring-ink-800" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-400 text-sm font-bold ring-2 ring-ink-100 dark:ring-ink-800">
                  {name[0]}
                </div>
              )}
              {readerLevel !== null && (
                <span className="absolute -bottom-1 -right-1 bg-brand-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {readerLevel}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-ink-950/95 backdrop-blur-xl border-t border-ink-100/60 dark:border-ink-800/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {BOTTOM_TABS.map(tab => {
            const Icon = tab.icon;
            const active = isTabActive(pathname, tab.match);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-ink-400 dark:text-ink-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}

        </div>
      </nav>
    </>
  );
}
