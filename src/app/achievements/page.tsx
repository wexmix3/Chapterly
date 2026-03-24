'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Trophy, Lock, BookOpen, Flame, Users, Star } from 'lucide-react';
import type { Achievement } from '@/app/api/achievements/route';

const CATEGORY_META = {
  reading:   { label: 'Reading',   icon: BookOpen, color: 'text-brand-600' },
  streak:    { label: 'Streaks',   icon: Flame,    color: 'text-orange-500' },
  social:    { label: 'Social',    icon: Users,    color: 'text-blue-500' },
  milestone: { label: 'Milestones', icon: Star,   color: 'text-amber-500' },
};

type Category = keyof typeof CATEGORY_META;

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Category>('all');

  useEffect(() => {
    fetch('/api/achievements')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => {
        setAchievements(json.data ?? []);
        setLoading(false);
      });
  }, []);

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-paper-50">Achievements</h1>
              <p className="text-sm text-ink-500">
                {loading ? '…' : `${unlocked} of ${total} unlocked`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {!loading && (
            <div className="mb-6 bg-white dark:bg-ink-900 rounded-2xl p-4 shadow-sm border border-ink-100 dark:border-ink-800">
              <div className="flex justify-between text-xs text-ink-500 mb-2">
                <span>Overall progress</span>
                <span className="font-medium text-ink-800 dark:text-ink-200">{Math.round((unlocked / total) * 100)}%</span>
              </div>
              <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
                  style={{ width: `${(unlocked / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Category filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900'
                  : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 hover:border-ink-400'
              }`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
              const { label, icon: Icon, color } = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === cat
                      ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900'
                      : 'bg-white dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 hover:border-ink-400'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${filter === cat ? '' : color}`} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Achievement grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No achievements here yet</p>
              <p className="text-sm mt-1">Keep reading to unlock them!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sorted.map(a => (
                <div
                  key={a.id}
                  className={`relative bg-white dark:bg-ink-900 rounded-2xl p-4 border transition-all ${
                    a.unlocked
                      ? 'border-ink-100 dark:border-ink-800 shadow-sm'
                      : 'border-ink-100 dark:border-ink-800 opacity-60'
                  }`}
                >
                  {/* Lock icon for locked */}
                  {!a.unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-3.5 h-3.5 text-ink-300" />
                    </div>
                  )}

                  <div className={`text-3xl mb-2 ${!a.unlocked ? 'grayscale' : ''}`}>
                    {a.emoji}
                  </div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-paper-100 leading-tight mb-0.5">
                    {a.title}
                  </p>
                  <p className="text-xs text-ink-400 leading-snug mb-2">{a.description}</p>

                  {/* Progress bar for partially unlocked */}
                  {!a.unlocked && a.target !== undefined && a.current !== undefined && (
                    <div>
                      <div className="h-1 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${a.progress ?? 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-ink-400">
                        {a.current.toLocaleString()} / {a.target.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {a.unlocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
