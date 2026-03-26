'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Trophy, Flame, BookOpen, FileText, Loader2, Crown, Medal } from 'lucide-react';
import { LeaderRowSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

type LeaderType = 'streak' | 'books' | 'pages';
type ScopeType = 'global' | 'friends';

interface LeaderEntry {
  rank: number;
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  value: number;
  is_me: boolean;
}

const TYPE_CONFIG = {
  streak: { label: 'Streak', icon: Flame, unit: 'days', color: 'text-amber-500' },
  books: { label: 'Books Read', icon: BookOpen, unit: 'books', color: 'text-brand-500' },
  pages: { label: 'Pages', icon: FileText, unit: 'pages', color: 'text-emerald-500' },
} as const;

const RANK_MEDAL: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1: { icon: Crown, color: 'text-amber-400' },
  2: { icon: Medal, color: 'text-slate-400' },
  3: { icon: Medal, color: 'text-amber-600' },
};

export default function LeaderboardClient() {
  const [type, setType] = useState<LeaderType>('streak');
  const [scope, setScope] = useState<ScopeType>('global');
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myValue, setMyValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Fetch following list once so we can label global entries
  useEffect(() => {
    fetch('/api/social')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setFollowingIds(new Set((j.data ?? []).map((u: { id: string }) => u.id))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?type=${type}&scope=${scope}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => {
        setEntries(j.data ?? []);
        setMyRank(j.my_rank ?? null);
        setMyValue(j.my_value ?? 0);
      })
      .finally(() => setLoading(false));
  }, [type, scope]);

  const cfg = TYPE_CONFIG[type];

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900">Leaderboard</h1>
              <p className="text-xs text-ink-400">See how you stack up against other readers</p>
            </div>
          </div>

          {/* Type tabs */}
          <div className="bg-white rounded-2xl border border-paper-200 p-1 flex gap-1">
            {(Object.keys(TYPE_CONFIG) as LeaderType[]).map(t => {
              const { label, icon: Icon } = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    type === t ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Scope toggle */}
          <div className="flex gap-2">
            {(['global', 'friends'] as ScopeType[]).map(s => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  scope === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-paper-200 text-ink-500 hover:text-ink-800'
                }`}
              >
                {s === 'global' ? 'Global' : 'Following'}
              </button>
            ))}
          </div>

          {/* My rank banner (if outside top 20) */}
          {myRank && myRank > 20 && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-600 font-medium">Your rank</p>
                <p className="font-display text-2xl font-bold text-brand-700">#{myRank}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brand-500">Your {cfg.unit}</p>
                <p className="font-bold text-brand-700">{myValue.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Leaderboard list */}
          <div className="bg-white rounded-2xl border border-paper-200 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-ink-50 p-2 space-y-1">
                {Array.from({ length: 8 }).map((_, i) => <LeaderRowSkeleton key={i} />)}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Trophy className="w-10 h-10 text-ink-200 mx-auto" />
                <p className="text-sm text-ink-400">
                  {scope === 'friends' ? 'Follow some readers to see their stats here.' : 'No data yet — start reading to appear here!'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-paper-100">
                {entries.map((entry) => {
                  const medal = RANK_MEDAL[entry.rank];
                  const MedalIcon = medal?.icon;
                  return (
                    <li
                      key={entry.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        entry.is_me ? 'bg-brand-50' : 'hover:bg-paper-50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 flex items-center justify-center">
                        {MedalIcon ? (
                          <MedalIcon className={`w-5 h-5 ${medal.color}`} />
                        ) : (
                          <span className="text-sm font-bold text-ink-300">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
                          {(entry.display_name || entry.handle || '?')[0].toUpperCase()}
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/u/${entry.handle}`} className="block">
                          <p className={`text-sm font-semibold truncate ${entry.is_me ? 'text-brand-700' : 'text-ink-900'}`}>
                            {entry.display_name || entry.handle}
                            {entry.is_me && <span className="ml-1 text-xs font-normal text-brand-400">(you)</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-ink-400">@{entry.handle}</p>
                            {scope === 'global' && !entry.is_me && followingIds.has(entry.id) && (
                              <span className="text-[9px] font-medium bg-brand-50 text-brand-600 border border-brand-100 rounded-full px-1.5 py-0.5 leading-none">
                                Following
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <p className={`font-bold text-sm ${entry.rank <= 3 ? cfg.color : 'text-ink-700'}`}>
                          {entry.value.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-ink-400">{cfg.unit}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Time context */}
          <p className="text-center text-xs text-ink-400">
            {type === 'streak' ? 'Based on last 30 days of activity' : `Based on ${new Date().getFullYear()} data`}
          </p>

        </div>
      </main>
    </div>
  );
}
