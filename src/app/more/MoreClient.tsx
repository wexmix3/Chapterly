'use client';

import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  BookOpen, TrendingUp, Trophy, Target, Quote,
  Users, Search, BookMarked, BarChart2, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { useEffect, useState } from 'react';

const PERSONAL_ITEMS = [
  { href: '/dashboard?tab=reading', label: 'My Books',     icon: BookOpen },
  { href: '/progress',              label: 'Progress',      icon: TrendingUp },
  { href: '/achievements',          label: 'Achievements',  icon: Trophy },
  { href: '/challenge',             label: 'Reading Goals', icon: Target },
  { href: '/quotes',                label: 'My Quotes',     icon: Quote },
];

const SOCIAL_ITEMS = [
  { href: '/feed',        label: 'Feed',         icon: Users },
  { href: '/people',      label: 'Find Readers', icon: Search },
  { href: '/clubs',       label: 'Book Clubs',   icon: BookMarked },
  { href: '/leaderboard', label: 'Leaderboard',  icon: BarChart2 },
];

export default function MoreClient() {
  const { user, signOut } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';
  const [userHandle, setUserHandle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data?.handle) setUserHandle(j.data.handle as string); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-16">
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

          <h1 className="font-display text-2xl font-bold text-ink-900">Menu</h1>

          {/* Personal */}
          <section>
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3">Personal</p>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAL_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-white border border-ink-100 text-sm font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors shadow-sm"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 text-ink-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Social */}
          <section>
            <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-3">Social</p>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-white border border-ink-100 text-sm font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors shadow-sm"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 text-ink-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Account */}
          <section className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-ink-100">
              <Link href={userHandle ? `/u/${userHandle}` : '/settings'} className="flex items-center gap-3 flex-1 min-w-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                    {name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{name}</p>
                  {userHandle && <p className="text-xs text-ink-400 truncate">@{userHandle}</p>}
                </div>
              </Link>
              <ThemeToggle />
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink-600 hover:bg-paper-50 hover:text-ink-900 transition-colors border-b border-ink-100"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium text-ink-600 hover:bg-paper-50 hover:text-ink-900 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </section>

        </div>
      </main>
    </div>
  );
}
