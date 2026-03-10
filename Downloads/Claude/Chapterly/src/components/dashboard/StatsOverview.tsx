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

  return (
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
  );
}
