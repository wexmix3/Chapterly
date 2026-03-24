'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, TrendingUp, Trophy, Target, Sparkles, Users, Search,
  BookMarked, BarChart2, Compass, Bell, Settings, LogOut, Menu, X,
  ChevronDown,
} from 'lucide-react';
import { useAuth, useNotifications } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';

// ── Nav structure ──────────────────────────────────────────────────────────────

const PERSONAL_ITEMS = [
  { href: '/dashboard?tab=reading', label: 'My Books',      icon: BookOpen },
  { href: '/progress',              label: 'Progress',       icon: TrendingUp },
  { href: '/achievements',          label: 'Achievements',   icon: Trophy },
  { href: '/challenge',             label: 'Reading Goals',  icon: Target },
];

const SOCIAL_ITEMS = [
  { href: '/feed',        label: 'Feed',         icon: Users },
  { href: '/people',      label: 'Find Readers', icon: Search },
  { href: '/clubs',       label: 'Book Clubs',   icon: BookMarked },
  { href: '/leaderboard', label: 'Leaderboard',  icon: BarChart2 },
];

// Which paths make each top-level item "active"
function isPersonalActive(pathname: string): boolean {
  return ['/dashboard', '/progress', '/achievements', '/challenge'].some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
}

function isSocialActive(pathname: string): boolean {
  return ['/feed', '/people', '/clubs', '/leaderboard'].some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
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
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [socialOpen,   setSocialOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  // Fetch XP/level for the level badge
  const [readerLevel, setReaderLevel] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j?.data?.reader_level) setReaderLevel(j.data.reader_level as number);
      })
      .catch(() => {});
  }, []);

  const isAIActive     = pathname === '/ai' || pathname.startsWith('/ai/');
  const isDiscoverActive = pathname === '/discover' || pathname.startsWith('/discover/');

  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!userMenuOpen) return;
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [userMenuOpen]);

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
            {/* Personal (dropdown) */}
            <NavDropdown
              label="Personal"
              items={PERSONAL_ITEMS}
              active={isPersonalActive(pathname)}
              open={personalOpen}
              onToggle={() => { setPersonalOpen(v => !v); setSocialOpen(false); }}
              onClose={() => setPersonalOpen(false)}
            />

            {/* AI (direct link) */}
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

            {/* Social (dropdown) */}
            <NavDropdown
              label="Social"
              items={SOCIAL_ITEMS}
              active={isSocialActive(pathname)}
              open={socialOpen}
              onToggle={() => { setSocialOpen(v => !v); setPersonalOpen(false); }}
              onClose={() => setSocialOpen(false)}
            />

            {/* Discover (direct link) */}
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

            {/* User avatar + dropdown (desktop) */}
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative flex items-center"
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
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-ink-900 rounded-xl border border-ink-100 dark:border-ink-800 shadow-lg shadow-ink-900/10 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800">
                    <p className="text-sm font-semibold text-ink-900 dark:text-paper-100 truncate">{name}</p>
                    <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100 transition-colors rounded-lg"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <div className="px-3 py-1.5">
                      <ThemeToggle />
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); void signOut(); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100 transition-colors rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors"
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5 text-ink-600 dark:text-ink-400" />
                : <Menu className="w-5 h-5 text-ink-600 dark:text-ink-400" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu sheet ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-[52px] inset-x-0 z-40 bg-white dark:bg-ink-950 border-b border-ink-100 dark:border-ink-800 md:hidden shadow-lg overflow-y-auto max-h-[calc(100vh-52px)]">
            <div className="px-4 py-3 space-y-4">

              {/* PERSONAL section */}
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">Personal</p>
                {PERSONAL_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* AI section */}
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">AI</p>
                <Link
                  href="/ai"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  AI Insights
                </Link>
              </div>

              {/* SOCIAL section */}
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">Social</p>
                {SOCIAL_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* DISCOVER section */}
              <div>
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-1">Discover</p>
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                >
                  <Compass className="w-4 h-4 flex-shrink-0" />
                  Discover Books
                </Link>
              </div>
            </div>

            {/* Mobile user section */}
            <div className="px-4 py-3 border-t border-ink-100 dark:border-ink-800 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-400 text-sm font-bold">
                    {name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-paper-100 truncate">{name}</p>
                </div>
                <ThemeToggle />
              </div>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); void signOut(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
