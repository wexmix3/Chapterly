'use client';

import { useEffect, useState, useCallback } from 'react';
import Navigation from '@/components/layout/Navigation';
import {
  Trophy, Lock, BookOpen, Flame, Users, Star,
  Book, Coffee, Moon, Zap, Leaf, Target, Check, Loader2,
} from 'lucide-react';
import type { Achievement } from '@/app/api/achievements/route';
import { levelFromXP, levelTitle, progressToNextLevel, xpForNextLevel, xpForLevel } from '@/lib/xp';

// ── Achievement XP rewards (display only — awards happen server-side) ──────────
const ACHIEVEMENT_XP: Record<string, number> = {
  // Reading
  first_book:    5,
  five_books:    50,
  ten_books:     25,
  twenty_five:   100,
  fifty_books:   200,
  hundred_books: 500,
  // Pages
  thousand_pages: 10,
  ten_k_pages:    50,
  // Streaks
  streak_3:   10,
  streak_7:   25,
  streak_30:  100,
  streak_100: 500,
  // Social
  first_review: 25,
  ten_reviews:  50,
  first_follow: 10,
  // Milestones
  early_adopter:   10,
  night_owl:       15,
  morning_pages:   15,
  genre_explorer:  50,
};

// ── Avatar options ─────────────────────────────────────────────────────────────
const AVATAR_OPTIONS: { key: string; icon: React.ElementType; label: string; color: string }[] = [
  { key: 'book',   icon: Book,   label: 'Book',    color: 'bg-brand-100 text-brand-600' },
  { key: 'coffee', icon: Coffee, label: 'Coffee',  color: 'bg-amber-100 text-amber-600' },
  { key: 'moon',   icon: Moon,   label: 'Moon',    color: 'bg-indigo-100 text-indigo-600' },
  { key: 'zap',    icon: Zap,    label: 'Zap',     color: 'bg-yellow-100 text-yellow-600' },
  { key: 'leaf',   icon: Leaf,   label: 'Leaf',    color: 'bg-emerald-100 text-emerald-600' },
  { key: 'flame',  icon: Flame,  label: 'Flame',   color: 'bg-orange-100 text-orange-600' },
  { key: 'star',   icon: Star,   label: 'Star',    color: 'bg-violet-100 text-violet-600' },
  { key: 'target', icon: Target, label: 'Target',  color: 'bg-rose-100 text-rose-600' },
];

const CATEGORY_META = {
  reading:   { label: 'Reading',    icon: BookOpen, color: 'text-brand-600' },
  streak:    { label: 'Streaks',    icon: Flame,    color: 'text-orange-500' },
  social:    { label: 'Social',     icon: Users,    color: 'text-blue-500' },
  milestone: { label: 'Milestones', icon: Star,     color: 'text-amber-500' },
};

type Category = keyof typeof CATEGORY_META;

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Category>('all');

  // XP / level
  const [totalXP, setTotalXP]       = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [avatarType, setAvatarType] = useState('book');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/achievements').then(r => r.ok ? r.json() : { data: [] }),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ]).then(([achJson, profileJson]) => {
      setAchievements(achJson.data ?? []);
      if (profileJson?.data) {
        const xp = (profileJson.data.total_xp as number | null) ?? 0;
        setTotalXP(xp);
        setCurrentLevel(levelFromXP(xp));
        setAvatarType((profileJson.data.avatar_type as string | null) ?? 'book');
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvatarSelect = async (key: string) => {
    setSavingAvatar(true);
    setAvatarType(key);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_type: key }),
    }).catch(() => {});
    setSavingAvatar(false);
  };

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return 0;
  });

  const progressPct = progressToNextLevel(totalXP);
  const levelMin    = xpForLevel(currentLevel);
  const levelMax    = xpForNextLevel(currentLevel);
  const title       = levelTitle(currentLevel);

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-6">

          {/* ── Reader Level card ── */}
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-paper-50">
                    Reader Level {currentLevel}
                  </h1>
                  <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{title}</span>
                </div>
                <p className="text-sm text-ink-500 mb-3">
                  {totalXP.toLocaleString()} XP total
                  {currentLevel < 50 && ` · ${(levelMax - totalXP).toLocaleString()} XP to Level ${currentLevel + 1}`}
                </p>
                <div className="h-2.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-ink-400 mt-1">
                  <span>{levelMin.toLocaleString()} XP</span>
                  {currentLevel < 50 && <span>{levelMax.toLocaleString()} XP</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Avatar selector ── */}
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Reader Avatar</h2>
              {savingAvatar && <Loader2 className="w-4 h-4 animate-spin text-ink-400" />}
              {!savingAvatar && <Check className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map(({ key, icon: Icon, label, color }) => (
                <button
                  key={key}
                  onClick={() => void handleAvatarSelect(key)}
                  title={label}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${color} ${
                    avatarType === key
                      ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-ink-900 scale-110'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Overall progress bar ── */}
          <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-4 shadow-sm">
            <div className="flex justify-between text-xs text-ink-500 mb-2">
              <span>Achievements unlocked</span>
              <span className="font-medium text-ink-800 dark:text-ink-200">
                {loading ? '…' : `${unlocked} / ${total}`}
              </span>
            </div>
            <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
                style={{ width: total > 0 ? `${(unlocked / total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* ── Category filter ── */}
          <div className="flex gap-2 flex-wrap">
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

          {/* ── Achievement grid ── */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />
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
              {sorted.map(a => {
                const xpReward = ACHIEVEMENT_XP[a.id] ?? 10;
                return (
                  <div
                    key={a.id}
                    className={`relative bg-white dark:bg-ink-900 rounded-2xl p-4 border transition-all ${
                      a.unlocked
                        ? 'border-ink-100 dark:border-ink-800 shadow-sm'
                        : 'border-ink-100 dark:border-ink-800 opacity-60'
                    }`}
                  >
                    {/* Lock icon */}
                    {!a.unlocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-3.5 h-3.5 text-ink-300" />
                      </div>
                    )}

                    {/* XP badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-0.5">
                      {!a.unlocked && <Lock className="w-3 h-3 text-ink-300 mr-1" />}
                      <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-full">
                        +{xpReward} XP
                      </span>
                    </div>

                    <div className={`text-3xl mb-2 ${!a.unlocked ? 'grayscale' : ''}`}>
                      {a.emoji}
                    </div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-paper-100 leading-tight mb-0.5 pr-16">
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
                        <Check className="w-2.5 h-2.5" /> Unlocked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
