'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Home, BookOpen, Compass, TrendingUp, Users,
  LogOut, Bell, Settings, type LucideIcon,
} from 'lucide-react';
import { useAuth, useNotifications } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';
import FloatingReadingButton from '@/components/layout/FloatingReadingButton';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tab?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home, tab: 'overview' },
  { href: '/dashboard?tab=reading', label: 'My Books', icon: BookOpen, tab: 'reading' },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/dashboard?tab=streak', label: 'Progress', icon: TrendingUp, tab: 'streak' },
  { href: '/feed', label: 'Social', icon: Users },
];

export default function Navigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();

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
      <FloatingReadingButton />

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white dark:bg-ink-950 border-r border-ink-100 dark:border-ink-800 z-40">

        {/* Logo */}
        <div className="p-6 border-b border-ink-100 dark:border-ink-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-brand-600 dark:text-brand-400">Chapterly</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
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
            <div className="flex items-center gap-1">
              <Link href="/notifications" className="relative p-1.5 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-900 transition-colors">
                <Bell className="w-4 h-4 text-ink-500 dark:text-ink-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <Link
            href="/settings"
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              pathname === '/settings'
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
                : 'text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-900'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </Link>
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
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              pathname === '/dashboard' && currentTab === 'overview' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Books */}
          <Link
            href="/discover"
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              pathname.startsWith('/discover') ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Books</span>
          </Link>

          {/* Centre FAB */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => router.push('/dashboard?tab=search')}
              className="w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all active:scale-95 -mt-6"
            >
              <BookOpen className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <Link
            href="/dashboard?tab=streak"
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              pathname === '/dashboard' && currentTab === 'streak' ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Progress</span>
          </Link>

          {/* Social */}
          <Link
            href="/feed"
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              pathname.startsWith('/feed') ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Social</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
