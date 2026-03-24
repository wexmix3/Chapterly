'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Flame, BookOpen, FileText, Star, Loader2 } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import ReadingCalendar from '@/components/sessions/ReadingCalendar';
import type { UserStats } from '@/types';

interface DailyCalendarStat {
  date: string;
  pages: number;
  minutes: number;
  is_streak_day: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function monthLabel(isoMonth: string): string {
  const [, m] = isoMonth.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m) - 1] ?? m;
}

function getLast30DaysDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function PagesTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { minutes: number } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const pages = payload[0]?.value ?? 0;
  const minutes = payload[0]?.payload?.minutes ?? 0;
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-ink-800 mb-0.5">{label}</p>
      <p className="text-ink-600">{pages} pages</p>
      {minutes > 0 && <p className="text-ink-400">{minutes} min</p>}
    </div>
  );
}

function BooksTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const books = payload[0]?.value ?? 0;
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-ink-800 mb-0.5">{label}</p>
      <p className="text-ink-600">{books} book{books !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, suffix, label, glow }: {
  icon: React.ReactNode;
  value: string;
  suffix?: string;
  label: string;
  glow?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-5 flex flex-col gap-2 ${glow ? 'border-brand-300 shadow-[0_0_16px_rgba(238,122,30,0.15)]' : 'border-ink-100'}`}>
      <div className="text-ink-300">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-brand-600">{value}</span>
        {suffix && <span className="text-sm text-ink-400">{suffix}</span>}
      </div>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

// ─── Genre donut center label ─────────────────────────────────────────────────

function GenreDonutCenter({ cx, cy, total }: { cx?: number; cy?: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" className="font-bold" style={{ fontSize: '20px', fontWeight: 700, fill: '#1a1a2e' }}>
        {total}
      </tspan>
      <tspan x={cx} dy="20" style={{ fontSize: '11px', fill: '#6b7280' }}>
        books
      </tspan>
    </text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressClient() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyCalendarStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch stats overview
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats(json.data);
        }

        // Fetch last 30 days of daily stats
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [curMonth, lastMonth] = await Promise.allSettled([
          fetch(`/api/stats/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`).then(r => r.ok ? r.json() : { data: [] }),
          fetch(`/api/stats/calendar?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`).then(r => r.ok ? r.json() : { data: [] }),
        ]);

        const combined: DailyCalendarStat[] = [
          ...(lastMonth.status === 'fulfilled' ? lastMonth.value.data ?? [] : []),
          ...(curMonth.status === 'fulfilled' ? curMonth.value.data ?? [] : []),
        ];
        setDailyData(combined);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────

  const last30Dates = getLast30DaysDates();
  const dailyMap = new Map(dailyData.map(d => [d.date, d]));

  const lineChartData = last30Dates.map(date => {
    const d = dailyMap.get(date);
    const dayNum = parseInt(date.split('-')[2]);
    const monthStr = new Date(date).toLocaleDateString('en-US', { month: 'short' });
    return {
      label: dayNum === 1 ? `${monthStr} ${dayNum}` : String(dayNum),
      pages: d?.pages ?? 0,
      minutes: d?.minutes ?? 0,
      date,
    };
  });

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const barChartData = monthLabels.map((label, idx) => {
    const monthKey = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
    const monthData = stats?.reading_by_month.find(m => m.month === monthKey);
    return {
      label,
      books: monthData?.books ?? 0,
      isCurrent: idx === currentMonthIdx,
    };
  });

  const genreData = (stats?.top_genres ?? []).slice(0, 6);
  const genreTotal = genreData.reduce((s, g) => s + g.count, 0);
  const GENRE_COLORS = ['#ee7a1e', '#f5a05a', '#f7c18e', '#c45a0e', '#9c4508', '#7a3406'];

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h > 0 ? `${h}` : `${mins}`;
  };
  const timeSuffix = (mins: number) => {
    const h = Math.floor(mins / 60);
    return h > 0 ? 'hrs' : 'min';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 pt-[52px]">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">

          {/* Page header */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-1">Progress</h1>
            <p className="text-sm text-ink-500">Your reading stats at a glance.</p>
          </div>

          {/* Stat cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                value={String(stats.current_streak)}
                suffix={stats.current_streak === 1 ? 'day' : 'days'}
                label="Current Streak"
                glow={stats.current_streak >= 3}
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                value={String(stats.total_books_read)}
                label="Books Read"
              />
              <StatCard
                icon={<FileText className="w-5 h-5" />}
                value={stats.total_pages >= 1000 ? `${(stats.total_pages / 1000).toFixed(1)}k` : String(stats.total_pages)}
                label="Pages Read"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                value={stats.avg_rating ? stats.avg_rating.toFixed(1) : '\u2014'}
                label="Avg Rating"
              />
            </div>
          )}

          {/* Pages — Line Chart */}
          <div className="bg-white rounded-2xl border border-ink-100 p-5">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Pages Read — Last 30 Days</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={lineChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pagesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ee7a1e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ee7a1e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#9d9d9d' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 9, fill: '#9d9d9d' }} tickLine={false} axisLine={false} />
                <Tooltip content={<PagesTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pages"
                  stroke="#ee7a1e"
                  strokeWidth={2}
                  fill="url(#pagesGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ee7a1e', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Books per month + Genre donut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Books bar chart */}
            <div className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Books per Month — {currentYear}</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9d9d9d' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9d9d9d' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<BooksTooltip />} />
                  <Bar dataKey="books" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCurrent ? '#ee7a1e' : '#f5a05a'}
                        opacity={entry.books === 0 ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Genre donut */}
            <div className="bg-white rounded-2xl border border-ink-100 p-5">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Genre Distribution</p>
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                    >
                      {genreData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                      ))}
                      <GenreDonutCenter cx={undefined} cy={undefined} total={genreTotal} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} books`]} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => <span style={{ fontSize: 10, color: '#6b7280' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-ink-400">
                  No genre data yet
                </div>
              )}
            </div>
          </div>

          {/* Reading Calendar Heatmap */}
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Reading Calendar</h2>
            <ReadingCalendar />
          </div>

        </div>
      </main>
    </div>
  );
}
