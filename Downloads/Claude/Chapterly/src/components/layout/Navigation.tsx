'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { BookOpen, Search, BarChart3, Share2, Upload, LogOut, Plus, Flame, LayoutDashboard, BookMarked, Compass, Users, Trophy, Rss } from 'lucide-react';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NAV_ITEMS = [
  { href: '/dashboard?tab=overview', label: 'Overview', icon: LayoutDashboard, tab: 'overview' },
  { href: '/dashboard?tab=reading', label: 'My Books', icon: BookMarked, tab: 'reading' },
  { href: '/dashboard?tab=search', label: 'Search', icon: Search, tab: 'search' },
  { href: '/dashboard?tab=streak', label: 'Stats & Streak', icon: Flame, tab: 'streak' },
  { href: '/dashboard?tab=share', label: 'Share Cards', icon: Share2, tab: 'share' },
  { href: '/dashboard?tab=import', label: 'Import', icon: Upload, tab: 'import' },
];

const DISCOVER_NAV = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/creators', label: 'Creator Hub 🔥', icon: Users },
  { href: '/challenge', label: 'My Challenge', icon: Trophy },
  { href: '/feed', label: 'Friends', icon: Rss },
];

const MOBILE_NAV = [
  { href: '/dashboard?tab=overview', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard?tab=reading', label: 'Books', icon: BookMarked },
  { href: '/dashboard?tab=search', label: 'Search', icon: Search },
  { href: '/dashboard?tab=share', label: 'Share', icon: Share2 },
];

export default function Navigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const currentTab = searchParams.get('tab') || 'overview';
  const isActive = (tab: string) => currentTab === tab;
  const isPathActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-ink-100 z-40">
        <div className="p-6 border-b border-ink-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="font-display text-xl font-bold text-ink-950">Chapterly</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Library section */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold px-3 mb-1">Library</p>
            <div className="space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon, tab }) => {
                const active = isActive(tab);
                return (
                  <Link key={tab} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Discover section */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold px-3 mb-1">Discover</p>
            <div className="space-y-0.5">
              {DISCOVER_NAV.map(({ href, label, icon: Icon }) => {
                const active = isPathActive(href);
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-ink-100">
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                {name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">{name}</p>
            </div>
            <ThemeToggle />
          </div>
          <button onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-ink-100 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {MOBILE_NAV.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-ink-400 hover:text-brand-600 transition-colors">
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}

          {/* Floating add button */}
          <button onClick={() => router.push('/dashboard?tab=search')}
            className="w-14 h-14 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all active:scale-95 -mt-6">
            <Plus className="w-6 h-6" />
          </button>

          {MOBILE_NAV.slice(2).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-ink-400 hover:text-brand-600 transition-colors">
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
