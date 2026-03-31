'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Zap } from 'lucide-react';
import { track } from '@/lib/analytics';
import CelebrationModal, { type CelebrationEvent } from '@/components/ui/CelebrationModal';

interface Quest {
  key: string;
  label: string;
  xp: number;
  icon: string;
  completed: boolean;
}

const MAX_XP_TODAY = 70; // 25 + 15 + 30

export default function DailyQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    fetch('/api/quests')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.quests) setQuests(d.quests);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const xpToday = quests
    .filter((q) => q.completed)
    .reduce((sum, q) => sum + q.xp, 0);

  const handleComplete = async (questKey: string) => {
    if (completing) return;
    setCompleting(questKey);

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quest_key: questKey }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const xpAwarded: number = data.xp_awarded ?? quests.find(q => q.key === questKey)?.xp ?? 0;
        track({ event: 'quest_completed', properties: { quest_key: questKey, xp_awarded: xpAwarded } });
        setQuests((prev) =>
          prev.map((q) => (q.key === questKey ? { ...q, completed: true } : q))
        );
        if (data.prev_level != null && data.new_level != null && data.new_level > data.prev_level) {
          setCelebration({ type: 'level_up', level: data.new_level });
        }
      } else if (res.status === 409) {
        // Already completed today
        setQuests((prev) =>
          prev.map((q) => (q.key === questKey ? { ...q, completed: true } : q))
        );
      }
    } catch {
      // Network failure — silently ignore
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center justify-center h-28">
        <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
      </div>
    );
  }

  if (quests.length === 0) return null;

  const allDone = quests.every((q) => q.completed);

  return (
    <>
    <CelebrationModal event={celebration} onClose={() => setCelebration(null)} />
    <div className="bg-white rounded-2xl border border-ink-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="font-display text-sm font-semibold text-ink-800">Daily Quests</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          allDone
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-amber-50 text-amber-600'
        }`}>
          {xpToday}/{MAX_XP_TODAY} XP today
        </span>
      </div>

      {/* Quest list */}
      <ul className="space-y-2">
        {quests.map((quest) => (
          <li
            key={quest.key}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              quest.completed
                ? 'bg-emerald-50/60'
                : 'bg-paper-50 hover:bg-paper-100'
            }`}
          >
            {/* Icon */}
            <span className={`text-base leading-none flex-shrink-0 ${quest.completed ? 'opacity-40' : ''}`}>
              {quest.icon}
            </span>

            {/* Label + XP */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${
                quest.completed ? 'text-ink-400 line-through' : 'text-ink-800'
              }`}>
                {quest.label}
              </p>
            </div>

            {/* XP badge */}
            <span className={`flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              quest.completed
                ? 'bg-emerald-100 text-emerald-500'
                : 'bg-brand-50 text-brand-600'
            }`}>
              +{quest.xp} XP
            </span>

            {/* Action */}
            {quest.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <button
                onClick={() => handleComplete(quest.key)}
                disabled={completing === quest.key}
                className="flex-shrink-0 px-3 py-1 text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {completing === quest.key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Complete'
                )}
              </button>
            )}
          </li>
        ))}
      </ul>

      {allDone && (
        <p className="mt-3 text-center text-xs text-emerald-600 font-medium">
          All quests done — come back tomorrow for more!
        </p>
      )}
    </div>
    </>
  );
}
