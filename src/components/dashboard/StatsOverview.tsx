'use client';

import { Flame, BookOpen, TrendingUp, FileText, Clock, Star, Loader2 } from 'lucide-react';
import { useStats } from '@/hooks';

interface StatCard {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  suffix?: string;
  label: string;
  glow?: boolean;
}

export default function StatsOverview() {
  const { stats, loading } = useStats();

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
    if (mins === 0) return '0';
    const h = Math.floor(mins / 60);
    return h > 0 ? `${h}` : `${mins}`;
  };
  const timeSuffix = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h > 0 ? 'hrs' : 'min';
  };

  const cards: StatCard[] = [
    {
      icon: <Flame className="w-5 h-5" />,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-500',
      value: String(stats.current_streak),
      suffix: stats.current_streak === 1 ? 'day' : 'days',
      label: 'Current Streak',
      glow: stats.current_streak >= 3,
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-600',
      value: String(stats.total_books_read),
      label: 'Books Read',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      value: String(stats.books_this_year),
      label: 'This Year',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: stats.total_pages >= 1000
        ? `${(stats.total_pages / 1000).toFixed(1)}k`
        : String(stats.total_pages),
      label: 'Total Pages',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: formatTime(stats.total_minutes),
      suffix: timeSuffix(stats.total_minutes),
      label: 'Total Time',
    },
    {
      icon: <Star className="w-5 h-5" />,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: stats.avg_rating ? stats.avg_rating.toFixed(1) : '—',
      label: 'Avg Rating',
    },
  ];

  const maxBooks = Math.max(...stats.reading_by_month.map((m) => m.books), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label}
            className={`bg-white rounded-2xl border border-ink-100 p-4 hover:-translate-y-0.5 hover:shadow-sm transition-all ${
              card.glow ? 'animate-streak-glow border-brand-200' : ''
            }`}>
            <div className={`w-9 h-9 ${card.iconBg} ${card.iconColor} rounded-xl flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink-950">{card.value}</span>
              {card.suffix && <span className="text-xs text-ink-400">{card.suffix}</span>}
            </div>
            <p className="text-xs text-ink-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {stats.reading_by_month.some((m) => m.books > 0 || m.pages > 0) && (
        <div className="bg-white rounded-2xl border border-ink-100 p-4">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Books per Month</p>
          <div className="flex items-end gap-1.5 h-20">
            {stats.reading_by_month.map((m) => {
              const pct = Math.round((m.books / maxBooks) * 100);
              const label = m.month.substring(5); // MM
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
  );
}
