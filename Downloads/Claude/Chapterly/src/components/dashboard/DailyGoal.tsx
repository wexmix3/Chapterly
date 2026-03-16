'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

const GOAL_KEY = 'chapterly_daily_goal';
const DEFAULT_GOAL = 30;
const RING_R = 36;
const RING_CIRC = 2 * Math.PI * RING_R;

export default function DailyGoal() {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [pagesRead, setPagesRead] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(GOAL_KEY);
    if (stored) setGoal(parseInt(stored));
  }, []);

  useEffect(() => {
    fetch('/api/today')
      .then((r) => (r.ok ? r.json() : { pages_today: 0 }))
      .then((d) => setPagesRead(d.pages_today ?? 0))
      .catch(() => {});
  }, []);

  const pct = Math.min(100, Math.round((pagesRead / goal) * 100));
  const done = pagesRead >= goal;
  const dashoffset = RING_CIRC * (1 - pct / 100);

  const saveGoal = () => {
    const v = parseInt(draft);
    if (v > 0) {
      setGoal(v);
      localStorage.setItem(GOAL_KEY, String(v));
    }
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4">
      {/* SVG ring */}
      <div className="relative flex-shrink-0 w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={RING_R} fill="none" strokeWidth="8" stroke="#f0ede8" />
          <circle
            cx="44" cy="44" r={RING_R} fill="none" strokeWidth="8"
            stroke={done ? '#10b981' : '#7c6af7'}
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={dashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-bold text-ink-900 leading-none">{pct}%</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Target className="w-3.5 h-3.5 text-brand-500" />
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Daily Goal</p>
        </div>
        <p className="font-display text-xl font-bold text-ink-900">
          {pagesRead} <span className="text-sm font-normal text-ink-400">/ {goal} pages</span>
        </p>
        <p className="text-xs text-ink-400 mt-0.5">
          {done ? '🎉 Goal reached!' : `${goal - pagesRead} pages to go`}
        </p>
      </div>

      {/* Edit goal */}
      <div className="flex-shrink-0">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <input
              type="number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
              placeholder={String(goal)}
              autoFocus
              className="w-16 px-2 py-1 text-xs border border-brand-200 rounded-lg focus:outline-none focus:border-brand-400 text-center"
            />
            <button onClick={saveGoal} className="text-[10px] text-brand-600 font-medium text-center">
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(goal)); setEditing(true); }}
            className="text-xs text-ink-400 hover:text-brand-600 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
