'use client';

import { useState } from 'react';
import { Flame, BookOpen, TrendingUp, FileText, Clock, Star, Loader2, X, ChevronRight, Calendar, BarChart3, Zap, Target } from 'lucide-react';
import { useStats } from '@/hooks';
import type { UserStats } from '@/types';

interface StatCard {
  key: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  suffix?: string;
  label: string;
  glow?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function streakStartDate(streak: number): string {
  const d = new Date();
  d.setDate(d.getDate() - streak + 1);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function currentMonthBooks(stats: UserStats): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return stats.reading_by_month.find(m => m.month === key)?.books ?? 0;
}

function currentMonthPages(stats: UserStats): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return stats.reading_by_month.find(m => m.month === key)?.pages ?? 0;
}

function monthsElapsed(): number {
  return new Date().getMonth() + 1;
}

function monthLabel(iso: string): string {
  const [, m] = iso.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m) - 1] ?? m;
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function StatDetailSheet({ statKey, stats, onClose }: { statKey: string; stats: UserStats; onClose: () => void }) {
  const months = stats.reading_by_month;
  const maxBooks = Math.max(...months.map(m => m.books), 1);
  const maxPages = Math.max(...months.map(m => m.pages), 1);
  const elapsed = monthsElapsed();
  const avgBooksPerMonth = elapsed > 0 ? (stats.books_this_year / elapsed).toFixed(1) : '0';

  const content: Record<string, React.ReactNode> = {
    'Current Streak': (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-brand-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">Current streak</p>
            <p className="font-display text-3xl font-bold text-ink-900">{stats.current_streak} <span className="text-2xl">🔥</span></p>
            {stats.current_streak > 0 && <p className="text-xs text-ink-400 mt-1">Since {streakStartDate(stats.current_streak)}</p>}
          </div>
          <div className="bg-paper-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">Longest streak</p>
            <p className="font-display text-3xl font-bold text-ink-900">{stats.longest_streak}</p>
            <p className="text-xs text-ink-400 mt-1">{stats.longest_streak === 1 ? 'day' : 'days'} all-time</p>
          </div>
        </div>
        {stats.session_insights.best_day_of_week && (
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Best reading day" value={stats.session_insights.best_day_of_week} />
        )}
        {stats.session_insights.best_time_of_day && (
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Best time of day" value={stats.session_insights.best_time_of_day} />
        )}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
          💡 Reading at the same time each day is the #1 predictor of a long streak.
        </div>
      </div>
    ),

    'Books Read': (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-paper-50 rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-bold text-ink-900">{stats.total_books_read}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">All time</p>
          </div>
          <div className="bg-paper-50 rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-bold text-ink-900">{stats.books_this_year}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">This year</p>
          </div>
          <div className="bg-paper-50 rounded-xl p-3 text-center">
            <p className="font-display text-2xl font-bold text-ink-900">{currentMonthBooks(stats)}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">This month</p>
          </div>
        </div>
        {months.some(m => m.books > 0) && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Books per month</p>
            <div className="flex items-end gap-1.5 h-20">
              {months.map(m => {
                const pct = Math.round((m.books / maxBooks) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full bg-brand-400 rounded-t-md hover:bg-brand-500 transition-colors"
                      style={{ height: `${Math.max(pct, m.books > 0 ? 8 : 0)}%` }} />
                    <span className="text-[9px] text-ink-400">{monthLabel(m.month)}</span>
                    {m.books > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[9px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {m.books} book{m.books !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {stats.top_genres.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Top genres</p>
            <div className="space-y-2">
              {stats.top_genres.slice(0, 5).map((g, i) => (
                <div key={g.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-ink-700">{g.name}</span>
                    <span className="text-ink-400">{g.count} books</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full"
                      style={{ width: `${Math.round((g.count / (stats.top_genres[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),

    'This Year': (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">Books this year</p>
            <p className="font-display text-3xl font-bold text-ink-900">{stats.books_this_year}</p>
            <p className="text-xs text-ink-400 mt-1">in {elapsed} month{elapsed !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-paper-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">Monthly pace</p>
            <p className="font-display text-3xl font-bold text-ink-900">{avgBooksPerMonth}</p>
            <p className="text-xs text-ink-400 mt-1">books / month</p>
          </div>
        </div>
        <DetailRow icon={<FileText className="w-4 h-4" />} label="Pages this month" value={`${stats.pages_this_month.toLocaleString()} pages`} />
        <DetailRow icon={<Zap className="w-4 h-4" />} label="Pages / day (30d)" value={`${stats.session_insights.pages_per_day_30d} pages`} />
        {months.some(m => m.books > 0) && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Monthly breakdown</p>
            <div className="space-y-2">
              {months.filter(m => m.books > 0).map(m => (
                <div key={m.month} className="flex items-center justify-between py-2 border-b border-paper-100 last:border-0">
                  <span className="text-sm font-medium text-ink-700">{monthLabel(m.month)}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-ink-900">{m.books} book{m.books !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-ink-400 ml-2">{m.pages.toLocaleString()} pages</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),

    'Total Pages': (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">All-time pages</p>
            <p className="font-display text-3xl font-bold text-ink-900">
              {stats.total_pages >= 1000 ? `${(stats.total_pages / 1000).toFixed(1)}k` : stats.total_pages}
            </p>
          </div>
          <div className="bg-paper-50 rounded-xl p-4">
            <p className="text-xs text-ink-400 mb-1">This month</p>
            <p className="font-display text-3xl font-bold text-ink-900">{stats.pages_this_month.toLocaleString()}</p>
          </div>
        </div>
        <DetailRow icon={<Zap className="w-4 h-4" />} label="Daily pace (30 days)" value={`${stats.session_insights.pages_per_day_30d} pages/day`} />
        <DetailRow icon={<BarChart3 className="w-4 h-4" />} label="Avg per session" value={`${stats.session_insights.avg_pages_per_session} pages`} />
        {stats.session_insights.longest_session_pages > 0 && (
          <DetailRow icon={<Star className="w-4 h-4" />} label="Longest session" value={`${stats.session_insights.longest_session_pages} pages`} />
        )}
        {months.some(m => m.pages > 0) && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Pages per month</p>
            <div className="flex items-end gap-1.5 h-20">
              {months.map(m => {
                const pct = Math.round((m.pages / maxPages) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full bg-blue-300 rounded-t-md hover:bg-blue-400 transition-colors"
                      style={{ height: `${Math.max(pct, m.pages > 0 ? 8 : 0)}%` }} />
                    <span className="text-[9px] text-ink-400">{monthLabel(m.month)}</span>
                    {m.pages > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[9px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {m.pages.toLocaleString()} pages
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ),

    'Total Time': (
      <div className="space-y-5">
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-xs text-ink-400 mb-1">Total reading time</p>
          <p className="font-display text-3xl font-bold text-ink-900">{formatMinutes(stats.total_minutes)}</p>
          <p className="text-xs text-ink-400 mt-1">across {stats.total_books_read} books</p>
        </div>
        <DetailRow icon={<Clock className="w-4 h-4" />} label="Avg session length" value={`${stats.session_insights.avg_minutes_per_session} min`} />
        <DetailRow icon={<BarChart3 className="w-4 h-4" />} label="Avg pages per session" value={`${stats.session_insights.avg_pages_per_session} pages`} />
        {stats.session_insights.best_day_of_week && (
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Most productive day" value={stats.session_insights.best_day_of_week} />
        )}
        {stats.session_insights.best_time_of_day && (
          <DetailRow icon={<Zap className="w-4 h-4" />} label="Peak reading time" value={stats.session_insights.best_time_of_day} />
        )}
        {stats.session_insights.longest_session_pages > 0 && (
          <DetailRow icon={<Star className="w-4 h-4" />} label="Longest session" value={`${stats.session_insights.longest_session_pages} pages`} />
        )}
      </div>
    ),

    'Avg Rating': (
      <div className="space-y-5">
        <div className="bg-yellow-50 rounded-xl p-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-ink-400 mb-1">Average rating</p>
            <p className="font-display text-4xl font-bold text-ink-900">{stats.avg_rating?.toFixed(2) ?? '—'}</p>
            <p className="text-xs text-ink-400 mt-1">from {stats.total_books_read} books</p>
          </div>
          <div className="flex gap-0.5 ml-auto">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-6 h-6 ${n <= Math.round(stats.avg_rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-ink-200'}`} />
            ))}
          </div>
        </div>
        {stats.top_genres.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Most read genres</p>
            <div className="flex flex-wrap gap-2">
              {stats.top_genres.map((g, i) => {
                const colors = [
                  'bg-brand-50 text-brand-700 border-brand-100',
                  'bg-emerald-50 text-emerald-700 border-emerald-100',
                  'bg-purple-50 text-purple-700 border-purple-100',
                  'bg-blue-50 text-blue-700 border-blue-100',
                  'bg-yellow-50 text-yellow-700 border-yellow-100',
                  'bg-rose-50 text-rose-700 border-rose-100',
                ];
                return (
                  <span key={g.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[i % colors.length]}`}>
                    {g.name}
                    <span className="opacity-60 text-[10px]">{g.count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="bg-paper-50 rounded-xl p-4">
          <p className="text-xs text-ink-500 mb-3 font-medium">What your ratings say</p>
          <p className="text-sm text-ink-600 leading-relaxed">
            {(stats.avg_rating ?? 0) >= 4.5
              ? "You're a selective reader — you only finish books you genuinely love."
              : (stats.avg_rating ?? 0) >= 3.5
              ? "You have a balanced view — you appreciate quality but aren't afraid to be honest."
              : "You give thoughtful, critical ratings. Your 4★+ reviews really mean something."}
          </p>
        </div>
      </div>
    ),
  };

  const titles: Record<string, string> = {
    'Current Streak': '🔥 Streak Details',
    'Books Read': '📚 Books Read',
    'This Year': '📈 This Year',
    'Total Pages': '📄 Pages',
    'Total Time': '⏱ Reading Time',
    'Avg Rating': '⭐ Your Ratings',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-paper-100">
          <h3 className="font-display text-base font-bold text-ink-900">{titles[statKey] ?? statKey}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-paper-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {content[statKey] ?? <p className="text-sm text-ink-400">No additional data available.</p>}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-paper-50 last:border-0">
      <span className="text-ink-300 flex-shrink-0">{icon}</span>
      <span className="text-sm text-ink-500 flex-1">{label}</span>
      <span className="text-sm font-semibold text-ink-800">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StatsOverview() {
  const { stats, loading } = useStats();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h > 0 ? `${h}` : `${mins}`;
  };
  const timeSuffix = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h > 0 ? 'hrs' : 'min';
  };

  const cards: StatCard[] = [
    {
      key: 'Current Streak',
      icon: <Flame className="w-5 h-5" />,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-500',
      value: String(stats.current_streak),
      suffix: stats.current_streak === 1 ? 'day' : 'days',
      label: 'Current Streak',
      glow: stats.current_streak >= 3,
    },
    {
      key: 'Books Read',
      icon: <BookOpen className="w-5 h-5" />,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-600',
      value: String(stats.total_books_read),
      label: 'Books Read',
    },
    {
      key: 'This Year',
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      value: String(stats.books_this_year),
      label: 'This Year',
    },
    {
      key: 'Total Pages',
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: stats.total_pages >= 1000
        ? `${(stats.total_pages / 1000).toFixed(1)}k`
        : String(stats.total_pages),
      label: 'Total Pages',
    },
    {
      key: 'Total Time',
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: formatTime(stats.total_minutes),
      suffix: timeSuffix(stats.total_minutes),
      label: 'Total Time',
    },
    {
      key: 'Avg Rating',
      icon: <Star className="w-5 h-5" />,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: stats.avg_rating ? stats.avg_rating.toFixed(1) : '—',
      label: 'Avg Rating',
    },
  ];

  const maxBooks = Math.max(...stats.reading_by_month.map((m) => m.books), 1);

  return (
    <>
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((card) => (
            <button
              key={card.key}
              onClick={() => setActiveCard(card.key)}
              className={`relative bg-white rounded-2xl border border-ink-100 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all text-left group cursor-pointer ${
                card.glow ? 'animate-streak-glow border-brand-200' : ''
              }`}
            >
              <div className={`w-9 h-9 ${card.iconBg} ${card.iconColor} rounded-xl flex items-center justify-center mb-3`}>
                {card.icon}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-ink-950">{card.value}</span>
                {card.suffix && <span className="text-xs text-ink-400">{card.suffix}</span>}
              </div>
              <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
              {/* Hover chevron */}
              <ChevronRight className="absolute top-3.5 right-3.5 w-3.5 h-3.5 text-ink-200 group-hover:text-ink-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Books-per-month chart */}
        {stats.reading_by_month.some((m) => m.books > 0 || m.pages > 0) && (
          <div className="bg-white rounded-2xl border border-ink-100 p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Books per Month</p>
            <div className="flex items-end gap-1.5 h-20">
              {stats.reading_by_month.map((m) => {
                const pct = Math.round((m.books / maxBooks) * 100);
                const label = m.month.substring(5);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-brand-400 rounded-t-md transition-all hover:bg-brand-500"
                      style={{ height: `${Math.max(pct, m.books > 0 ? 8 : 0)}%` }}
                    />
                    <span className="text-[9px] text-ink-400">{label}</span>
                    {m.books > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[9px] rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {m.books} book{m.books !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top genres */}
        {stats.top_genres.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Top Genres</p>
            <div className="flex flex-wrap gap-2">
              {stats.top_genres.map((g, i) => {
                const colors = [
                  'bg-brand-50 text-brand-700 border-brand-100',
                  'bg-emerald-50 text-emerald-700 border-emerald-100',
                  'bg-purple-50 text-purple-700 border-purple-100',
                  'bg-blue-50 text-blue-700 border-blue-100',
                  'bg-yellow-50 text-yellow-700 border-yellow-100',
                  'bg-rose-50 text-rose-700 border-rose-100',
                  'bg-cyan-50 text-cyan-700 border-cyan-100',
                  'bg-orange-50 text-orange-700 border-orange-100',
                ];
                return (
                  <span key={g.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[i % colors.length]}`}>
                    {g.name}
                    <span className="opacity-60 text-[10px]">{g.count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Reading habits */}
        {(stats.session_insights.avg_pages_per_session > 0 || stats.session_insights.best_day_of_week) && (
          <div className="bg-white rounded-2xl border border-ink-100 p-4">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Reading Habits</p>
            <div className="grid grid-cols-2 gap-4">
              {stats.session_insights.avg_pages_per_session > 0 && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Avg per session</p>
                  <p className="font-display text-xl font-bold text-ink-900">
                    {stats.session_insights.avg_pages_per_session}
                    <span className="text-xs font-normal text-ink-400 ml-1">pages</span>
                  </p>
                </div>
              )}
              {stats.session_insights.avg_minutes_per_session > 0 && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Avg session length</p>
                  <p className="font-display text-xl font-bold text-ink-900">
                    {stats.session_insights.avg_minutes_per_session}
                    <span className="text-xs font-normal text-ink-400 ml-1">min</span>
                  </p>
                </div>
              )}
              {stats.session_insights.pages_per_day_30d > 0 && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Pages/day (30d)</p>
                  <p className="font-display text-xl font-bold text-ink-900">
                    {stats.session_insights.pages_per_day_30d}
                  </p>
                </div>
              )}
              {stats.session_insights.longest_session_pages > 0 && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Longest session</p>
                  <p className="font-display text-xl font-bold text-ink-900">
                    {stats.session_insights.longest_session_pages}
                    <span className="text-xs font-normal text-ink-400 ml-1">pages</span>
                  </p>
                </div>
              )}
              {stats.session_insights.best_day_of_week && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Best reading day</p>
                  <p className="text-sm font-semibold text-ink-800">{stats.session_insights.best_day_of_week}</p>
                </div>
              )}
              {stats.session_insights.best_time_of_day && (
                <div>
                  <p className="text-xs text-ink-400 mb-0.5">Best time of day</p>
                  <p className="text-sm font-semibold text-ink-800">{stats.session_insights.best_time_of_day}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {activeCard && (
        <StatDetailSheet
          statKey={activeCard}
          stats={stats}
          onClose={() => setActiveCard(null)}
        />
      )}
    </>
  );
}
