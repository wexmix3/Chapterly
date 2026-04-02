'use client';

import { useState, useEffect } from 'react';
import { Flame, Shield, Loader2, X } from 'lucide-react';
import Link from 'next/link';

interface StreakData {
  current_streak: number;
  today_logged: boolean;
  streak_freeze_available: boolean;
}

/**
 * Shown on the dashboard when:
 *  - user has an active streak (current_streak > 1)
 *  - user has NOT logged any reading today
 *  - there is still time to protect (we show all day)
 *
 * Allows the user to use a streak freeze directly from the banner,
 * or navigate to log a session.
 */
export default function StreakAtRiskBanner() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j?.data) {
          setData({
            current_streak: j.data.current_streak ?? 0,
            today_logged: j.data.today_logged ?? false,
            streak_freeze_available: j.data.streak_freeze_available ?? false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUseFreeze = async () => {
    setFreezing(true);
    try {
      const res = await fetch('/api/streak/freeze', { method: 'POST' });
      if (res.ok) {
        setFreezeUsed(true);
        setData(prev => prev ? { ...prev, streak_freeze_available: false } : prev);
      }
    } finally {
      setFreezing(false);
    }
  };

  // Don't render if: still loading, no data, streak <= 1, already logged today, or dismissed
  if (loading || !data) return null;
  if (data.current_streak <= 1) return null;
  if (data.today_logged && !freezeUsed) return null;
  if (dismissed && !freezeUsed) return null;

  // After freeze is used, show a success state briefly
  if (freezeUsed) {
    return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800">Streak protected!</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Your {data.current_streak}-day streak is safe for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-900">
            Your {data.current_streak}-day streak is at risk
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            You haven&apos;t logged any reading today. Log a session or use a freeze to protect it.
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Link
              href="/dashboard?tab=overview"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors"
              onClick={() => {
                // Scroll to currently-reading section
                setTimeout(() => {
                  document.querySelector('[data-section="currently-reading"]')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              Log reading
            </Link>
            {data.streak_freeze_available && (
              <button
                onClick={handleUseFreeze}
                disabled={freezing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors"
              >
                {freezing
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Shield className="w-3 h-3" />}
                Use streak freeze
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-ink-300 hover:text-ink-500 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
