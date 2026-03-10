'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DailyStats {
  date: string;
  pages: number;
  minutes: number;
  is_streak_day: boolean;
}

export default function ReadingCalendar() {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyStats | null>(null);

  useEffect(() => {
    fetch('/api/stats/calendar?' + new URLSearchParams({
      year: String(current.getFullYear()),
      month: String(current.getMonth() + 1),
    }))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setStats(data?.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [current]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const statsMap = new Map(stats.map(s => [s.date, s]));

  const monthName = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-ink-800 dark:text-paper-100">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} disabled={month === today.getMonth() && year === today.getFullYear()}
            className="p-1.5 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-400 disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[10px] text-ink-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayStats = statsMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const hasReading = dayStats && dayStats.is_streak_day;
          const intensity = dayStats ? Math.min(3, Math.floor(dayStats.pages / 30)) : 0;

          const bgClass = hasReading
            ? intensity >= 3 ? 'bg-brand-600 text-white'
              : intensity === 2 ? 'bg-brand-400 text-white'
              : intensity === 1 ? 'bg-brand-200 text-brand-800'
              : 'bg-brand-100 text-brand-700'
            : 'hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400';

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(dayStats ?? null)}
              className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium transition-all ${bgClass} ${
                isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 p-3 bg-brand-50 dark:bg-ink-800 rounded-xl text-sm">
          <p className="font-medium text-ink-800 dark:text-paper-100 mb-1">{selectedDay.date}</p>
          <p className="text-ink-500 dark:text-ink-400 text-xs">
            {selectedDay.pages} pages · {selectedDay.minutes} min
            {selectedDay.is_streak_day && ' · ✓ streak day'}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ink-100 dark:border-ink-800">
        <span className="text-[10px] text-ink-400">Less</span>
        {['bg-ink-100','bg-brand-100','bg-brand-200','bg-brand-400','bg-brand-600'].map((c,i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-ink-400">More</span>
      </div>
    </div>
  );
}
