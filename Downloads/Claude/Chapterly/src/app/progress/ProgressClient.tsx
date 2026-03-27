'use client';

import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts';
import { Flame, BookOpen, FileText, Star, Loader2 } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import ReadingCalendar from '@/components/sessions/ReadingCalendar';
import type { UserStats } from '@/types';
import type { RichStats } from '@/app/api/stats/rich/route';

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

function AuthorTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { author: string; avg_rating?: number | null } }> }) {
  if (!active || !payload?.length) return null;
  const books = payload[0]?.value ?? 0;
  const rating = payload[0]?.payload?.avg_rating;
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-ink-800 mb-0.5">{payload[0]?.payload?.author}</p>
      <p className="text-ink-600">{books} book{books !== 1 ? 's' : ''}</p>
      {rating && <p className="text-brand-500">★ {rating} avg rating</p>}
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
  const [richStats, setRichStats] = useState<RichStats | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [booksPeriod, setBooksPeriod] = useState<'monthly' | 'yearly'>('monthly');

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

        // Rich stats (non-blocking)
        fetch('/api/stats/rich')
          .then(r => r.ok ? r.json() : null)
          .then(j => { if (j?.data) setRichStats(j.data); })
          .catch(() => {});
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
    // Use noon UTC to avoid cross-midnight timezone shifts changing the month
    const monthStr = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short' });
    return {
      label: `${monthStr} ${dayNum}`,
      pages: d?.pages ?? 0,
      minutes: d?.minutes ?? 0,
      date,
    };
  });

  // Weekly chart: aggregate daily data into 7-day buckets (last 8 weeks)
  const weeklyChartData = (() => {
    const today = new Date();
    const weeks: { label: string; pages: number; minutes: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      let pages = 0; let minutes = 0;
      for (let d = 0; d < 7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(weekStart.getDate() + d);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        const stat = dailyMap.get(key);
        if (stat) { pages += stat.pages; minutes += stat.minutes; }
      }
      const label = `${String(weekStart.getMonth() + 1).padStart(2, '0')}/${String(weekStart.getDate()).padStart(2, '0')}`;
      weeks.push({ label, pages, minutes });
    }
    return weeks;
  })();

  // Monthly chart: use reading_by_month pages data for last 12 months
  const monthlyChartData = (() => {
    const today = new Date();
    const months: { label: string; pages: number; minutes: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthData = stats?.reading_by_month.find(m => m.month === key);
      const lbl = new Date(d).toLocaleDateString('en-US', { month: 'short' });
      months.push({ label: lbl, pages: monthData?.pages ?? 0, minutes: 0 });
    }
    return months;
  })();

  // Yearly chart: group reading_by_month by year
  const yearlyChartData = (() => {
    const byYear: Record<string, number> = {};
    for (const m of stats?.reading_by_month ?? []) {
      const yr = m.month.split('-')[0];
      byYear[yr] = (byYear[yr] ?? 0) + (m.pages ?? 0);
    }
    return Object.entries(byYear)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([yr, pages]) => ({ label: yr, pages, minutes: 0 }));
  })();

  const activeChartData =
    period === 'daily'   ? lineChartData :
    period === 'weekly'  ? weeklyChartData :
    period === 'monthly' ? monthlyChartData :
    yearlyChartData;

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

  // Yearly books chart: use all-history data from stats (not limited to last 12 months)
  const yearlyBooksChartData = (stats?.books_by_year ?? []).map(d => ({
    label: d.year,
    books: d.books,
    isCurrent: d.year === String(currentYear),
  }));

  const activeBooksData = booksPeriod === 'monthly' ? barChartData : yearlyBooksChartData;

  // Genre data: prefer stats.top_genres, fall back to richStats.genre_breakdown
  const genreData = (
    stats?.top_genres?.length
      ? stats.top_genres.slice(0, 6)
      : richStats?.genre_breakdown?.slice(0, 6).map(g => ({ name: g.genre, count: g.count })) ?? []
  );
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

          {/* Reading Profile — always open */}
          {richStats && (
            <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-paper-100">
                <Star className="w-4 h-4 text-brand-500" />
                <span className="font-display font-semibold text-ink-800">Reading Profile</span>
              </div>
              <div className="px-6 pb-6 pt-4 space-y-5">

                {/* Format breakdown */}
                {richStats.format_breakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">How you read</p>
                    <div className="flex gap-3 flex-wrap">
                      {richStats.format_breakdown.map(f => (
                        <div key={f.format} className="flex items-center gap-2 bg-paper-50 border border-paper-200 rounded-xl px-3 py-2">
                          <span className="text-lg">
                            {f.format === 'physical' ? '📖' : f.format === 'ebook' ? '📱' : '🎧'}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-ink-700 capitalize">{f.format}</p>
                            <p className="text-[10px] text-ink-400">{f.count} book{f.count !== 1 ? 's' : ''} · {f.pct}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Finishing stats */}
                <div className="grid grid-cols-2 gap-3">
                  {richStats.avg_days_to_finish !== null && (
                    <div className="bg-paper-50 rounded-xl p-3">
                      <p className="text-[10px] text-ink-400 mb-1">Avg days to finish</p>
                      <p className="font-display text-2xl font-bold text-brand-600">{richStats.avg_days_to_finish}</p>
                      <p className="text-[10px] text-ink-400">days per book</p>
                    </div>
                  )}
                  {richStats.dnf_rate !== null && (
                    <div className="bg-paper-50 rounded-xl p-3">
                      <p className="text-[10px] text-ink-400 mb-1">DNF rate</p>
                      <p className="font-display text-2xl font-bold text-brand-600">{richStats.dnf_rate}%</p>
                      <p className="text-[10px] text-ink-400">of started books</p>
                    </div>
                  )}
                </div>

                {/* Longest / shortest book */}
                {(richStats.longest_book_read || richStats.shortest_book_read) && (
                  <div className="space-y-2">
                    {richStats.longest_book_read && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-ink-400 text-xs w-24 flex-shrink-0">Longest read</span>
                        <span className="font-medium text-ink-800 truncate">{richStats.longest_book_read.title}</span>
                        <span className="text-xs text-ink-400 flex-shrink-0">{richStats.longest_book_read.page_count}p</span>
                      </div>
                    )}
                    {richStats.shortest_book_read && richStats.books_read > 1 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-ink-400 text-xs w-24 flex-shrink-0">Shortest read</span>
                        <span className="font-medium text-ink-800 truncate">{richStats.shortest_book_read.title}</span>
                        <span className="text-xs text-ink-400 flex-shrink-0">{richStats.shortest_book_read.page_count}p</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Most productive month */}
                {richStats.most_productive_month && (
                  <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-brand-500 font-semibold uppercase tracking-wide mb-0.5">Best month ever</p>
                    <p className="font-display text-base font-bold text-brand-700">{richStats.most_productive_month.month}</p>
                    <p className="text-xs text-brand-600">{richStats.most_productive_month.books} books finished</p>
                  </div>
                )}

                {/* Top Genres */}
                {richStats.genre_breakdown && richStats.genre_breakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Top Genres</p>
                    <div className="space-y-2">
                      {richStats.genre_breakdown.slice(0, 6).map(g => (
                        <div key={g.genre}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-ink-700 font-medium">{g.genre}</span>
                            <span className="text-ink-400">{g.count} book{g.count !== 1 ? 's' : ''} · {g.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-400 rounded-full" style={{ width: `${g.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authors — horizontal bar chart */}
                {richStats.author_breakdown && richStats.author_breakdown.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Authors You&apos;ve Read</p>
                    <ResponsiveContainer width="100%" height={Math.min(richStats.author_breakdown.length, 6) * 34 + 8}>
                      <BarChart
                        data={richStats.author_breakdown.slice(0, 6)}
                        layout="vertical"
                        margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
                        barSize={14}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="author"
                          tick={{ fontSize: 10, fill: '#374151' }}
                          tickLine={false}
                          axisLine={false}
                          width={96}
                        />
                        <Tooltip content={<AuthorTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {richStats.author_breakdown.slice(0, 6).map((_, i) => (
                            <Cell key={`author-cell-${i}`} fill={i === 0 ? '#ee7a1e' : '#f5a05a'} />
                          ))}
                          <LabelList
                            dataKey="count"
                            position="right"
                            style={{ fontSize: 10, fill: '#9ca3af' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Pages — Line Chart with period selector */}
          <div className="bg-white rounded-2xl border border-ink-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Pages Read</p>
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      period === p
                        ? 'bg-brand-500 text-white'
                        : 'text-ink-400 hover:text-ink-700 hover:bg-paper-100'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activeChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
                  interval={period === 'daily' ? 5 : period === 'monthly' ? 1 : 0}
                  minTickGap={period === 'daily' ? 36 : 8}
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
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                  Books {booksPeriod === 'monthly' ? `per Month — ${currentYear}` : 'per Year'}
                </p>
                <div className="flex gap-1">
                  {(['monthly', 'yearly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setBooksPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        booksPeriod === p
                          ? 'bg-brand-500 text-white'
                          : 'text-ink-400 hover:text-ink-700 hover:bg-paper-100'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={activeBooksData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9d9d9d' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9d9d9d' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<BooksTooltip />} />
                  <Bar dataKey="books" radius={[4, 4, 0, 0]}>
                    {activeBooksData.map((entry, index) => (
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
