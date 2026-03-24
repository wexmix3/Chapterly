'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  Home, BookOpen, Compass, TrendingUp, Users, Sparkles,
  LogOut, Bell, Settings, Menu, X, type LucideIcon,
} from 'lucide-react';
import { useAuth, useNotifications } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tab?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home, tab: 'overview' },
  { href: '/dashboard?tab=reading', label: 'My Books', icon: BookOpen, tab: 'reading' },
  { href: '/ai', label: 'AI Insights', icon: Sparkles },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/feed', label: 'Social', icon: Users },
];

export default function Navigation() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const currentTab = searchParams.get('tab') || 'overview';

  const isItemActive = (item: NavItem) => {
    if (item.href === '/dashboard' && !item.tab) {
      return pathname === '/dashboard' && currentTab === 'overview';
    }
    if (item.tab) return currentTab === item.tab && pathname === '/dashboard';
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

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

          {/* Center: Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950'
                      : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-ink-100 dark:ring-ink-800" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-400 text-sm font-bold ring-2 ring-ink-100 dark:ring-ink-800">
                    {name[0]}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-ink-900 rounded-xl border border-ink-100 dark:border-ink-800 shadow-lg shadow-ink-900/10 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800">
                      <p className="text-sm font-semibold text-ink-900 dark:text-paper-100 truncate">{name}</p>
                      <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); void signOut(); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed top-[52px] inset-x-0 z-40 bg-white dark:bg-ink-950 border-b border-ink-100 dark:border-ink-800 md:hidden shadow-lg">
            <nav className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950'
                        : 'text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-900 hover:text-ink-900 dark:hover:text-ink-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

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
