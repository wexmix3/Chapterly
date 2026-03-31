'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Share2, Loader2, BookOpen, FileText, Layers, Target, ChevronDown, Check } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type GoalType = 'yearly_books' | 'weekly_pages' | 'monthly_genres';

interface GoalProgress {
  id: string;
  year: number;
  goal_type: GoalType;
  goal_target: number;
  goal_books: number;
  goal_pages: number | null;
  current_value: number;
  current_books: number;
  current_pages: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_CONFIG: Record<GoalType, {
  label: string;
  icon: React.ElementType;
  unit: string;
  unitPlural: string;
  description: string;
  presets: number[];
  defaultTarget: number;
}> = {
  yearly_books: {
    label: 'Books per Year',
    icon: BookOpen,
    unit: 'book',
    unitPlural: 'books',
    description: 'Finish books by December 31st',
    presets: [12, 24, 36, 52, 100],
    defaultTarget: 24,
  },
  weekly_pages: {
    label: 'Pages per Week',
    icon: FileText,
    unit: 'page',
    unitPlural: 'pages',
    description: 'Read pages every Monday–Sunday',
    presets: [50, 100, 200, 350, 500],
    defaultTarget: 150,
  },
  monthly_genres: {
    label: 'Genres per Month',
    icon: Layers,
    unit: 'genre',
    unitPlural: 'genres',
    description: 'Explore distinct genres each month',
    presets: [1, 2, 3, 4, 5],
    defaultTarget: 2,
  },
};

const MILESTONES = [
  { books: 1,   emoji: '📖', label: 'First Chapter',  desc: 'Read your first book' },
  { books: 5,   emoji: '🌟', label: '5 Books',         desc: 'Getting into the groove' },
  { books: 10,  emoji: '🔥', label: '10 Books',        desc: 'On fire!' },
  { books: 25,  emoji: '💯', label: '25 Books',        desc: 'Quarter century' },
  { books: 50,  emoji: '⭐', label: '50 Books',        desc: 'Half-century legend' },
  { books: 100, emoji: '🏆', label: '100 Books',       desc: 'Century achievement' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctOf(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, current, goal, unit }: { pct: number; current: number; goal: number; unit: string }) {
  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3ede2" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke="#ee7a1e" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${pct * 2.513} 251.3`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink-950">{current}</span>
        <span className="text-xs text-ink-400">of {goal}</span>
        <span className="text-xs text-brand-600 font-semibold">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Goal Selector Dropdown ───────────────────────────────────────────────────

function GoalTypeSelector({
  selected,
  goals,
  onSelect,
}: {
  selected: GoalType;
  goals: GoalProgress[];
  onSelect: (t: GoalType) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = GOAL_CONFIG[selected];
  const Icon = cfg.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:border-brand-300 transition-colors"
      >
        <Icon className="w-4 h-4 text-brand-500" />
        {cfg.label}
        <ChevronDown className={`w-3.5 h-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-ink-100 rounded-xl shadow-lg p-1.5 min-w-[200px]">
          {(Object.keys(GOAL_CONFIG) as GoalType[]).map(type => {
            const c = GOAL_CONFIG[type];
            const Ic = c.icon;
            const exists = goals.find(g => g.goal_type === type);
            return (
              <button
                key={type}
                onClick={() => { onSelect(type); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  type === selected ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                <Ic className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium leading-tight">{c.label}</p>
                  <p className="text-[10px] text-ink-400 leading-tight">{c.description}</p>
                </div>
                {type === selected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                {exists && type !== selected && (
                  <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pace Badge ───────────────────────────────────────────────────────────────

function PaceBadge({ goalType, current, target }: { goalType: GoalType; current: number; target: number }) {
  const year = new Date().getFullYear();
  const now = new Date();

  if (goalType === 'yearly_books') {
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
    const expected = Math.floor((dayOfYear / 365) * target);
    const pace = current - expected;
    const ahead = pace >= 0;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
        ahead ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {ahead ? '✓' : '⚡'} {ahead
          ? `${pace} book${pace !== 1 ? 's' : ''} ahead of pace`
          : `${Math.abs(pace)} book${Math.abs(pace) !== 1 ? 's' : ''} behind pace`}
      </div>
    );
  }

  if (goalType === 'weekly_pages') {
    const pct = pctOf(current, target);
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Mon=1…Sun=7
    const expectedPct = Math.round((dayOfWeek / 7) * 100);
    const ahead = pct >= expectedPct;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
        ahead ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {ahead ? '✓' : '⚡'} {current} / {target} pages this week
      </div>
    );
  }

  if (goalType === 'monthly_genres') {
    const remaining = Math.max(0, target - current);
    const achieved = current >= target;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
        achieved ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'
      }`}>
        {achieved ? '✓ Monthly genre goal reached' : `${remaining} more genre${remaining !== 1 ? 's' : ''} to go this month`}
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChallengeClient() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [activeType, setActiveType] = useState<GoalType>('yearly_books');
  const [loading, setLoading] = useState(true);
  const [editGoal, setEditGoal] = useState(false);
  const [newTarget, setNewTarget] = useState(24);
  const [saving, setSaving] = useState(false);
  const [monthlyBooks, setMonthlyBooks] = useState<number[]>(new Array(12).fill(0));

  useEffect(() => {
    Promise.all([
      fetch('/api/challenges').then(r => r.ok ? r.json() : null),
      fetch('/api/challenges/monthly').then(r => r.ok ? r.json() : null),
    ]).then(([challengeData, monthlyData]) => {
      if (challengeData?.goals?.length) {
        setGoals(challengeData.goals);
        // Default to yearly_books if present, otherwise first goal
        const firstType = (challengeData.goals as GoalProgress[]).find(g => g.goal_type === 'yearly_books')?.goal_type
          ?? (challengeData.goals as GoalProgress[])[0]?.goal_type
          ?? 'yearly_books';
        setActiveType(firstType);
        const active = (challengeData.goals as GoalProgress[]).find(g => g.goal_type === firstType);
        setNewTarget(active?.goal_target ?? GOAL_CONFIG[firstType].defaultTarget);
      } else if (challengeData?.data) {
        // Legacy fallback
        const legacy: GoalProgress = {
          ...challengeData.data,
          goal_type: 'yearly_books',
          goal_target: challengeData.data.goal_books ?? 24,
          current_value: challengeData.data.current_books ?? 0,
        };
        setGoals([legacy]);
        setNewTarget(legacy.goal_target);
      }
      if (monthlyData?.data) setMonthlyBooks(monthlyData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeGoal = goals.find(g => g.goal_type === activeType) ?? null;
  const cfg = GOAL_CONFIG[activeType];

  const current = activeGoal?.current_value ?? 0;
  const target  = activeGoal?.goal_target ?? cfg.defaultTarget;
  const pct     = pctOf(current, target);

  const year = new Date().getFullYear();
  const now  = new Date();

  const earnedMilestones = MILESTONES.filter(m => (activeGoal?.current_books ?? 0) >= m.books);
  const maxMonth = Math.max(...monthlyBooks, 1);

  // When changing active type, prefill the editor with the existing target (or default)
  const handleTypeChange = (type: GoalType) => {
    setActiveType(type);
    const existing = goals.find(g => g.goal_type === type);
    setNewTarget(existing?.goal_target ?? GOAL_CONFIG[type].defaultTarget);
    setEditGoal(false);
  };

  const saveGoal = async () => {
    setSaving(true);
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year,
        goal_type: activeType,
        goal_target: newTarget,
        // legacy compat
        goal_books: activeType === 'yearly_books' ? newTarget : (goals.find(g => g.goal_type === 'yearly_books')?.goal_target ?? 0),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        const updated: GoalProgress = {
          ...data.data,
          current_value: goals.find(g => g.goal_type === activeType)?.current_value ?? 0,
          current_books: goals.find(g => g.goal_type === 'yearly_books')?.current_books ?? 0,
          current_pages: goals.find(g => g.goal_type === 'yearly_books')?.current_pages ?? 0,
        };
        setGoals(prev => {
          const without = prev.filter(g => g.goal_type !== activeType);
          return [...without, updated];
        });
      }
      setEditGoal(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 pt-[52px]">
        <Navigation />
        <main className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">{year} Reading Goals</h1>
              <p className="text-ink-500 text-sm mt-1">Track your goals by books, pages, or genres.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <GoalTypeSelector selected={activeType} goals={goals} onSelect={handleTypeChange} />
              <button
                onClick={() => setEditGoal(!editGoal)}
                className="text-sm text-brand-600 hover:underline font-medium px-3 py-1.5 bg-brand-50 rounded-xl"
              >
                {editGoal ? 'Cancel' : activeGoal ? 'Edit goal' : 'Set goal'}
              </button>
            </div>
          </div>

          {/* Goal type info banner */}
          <div className="flex items-center gap-2 bg-white border border-ink-100 rounded-xl px-4 py-3">
            <cfg.icon className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink-800">{cfg.label}</p>
              <p className="text-xs text-ink-400">{cfg.description}</p>
            </div>
          </div>

          {/* Edit goal panel */}
          {editGoal && (
            <div className="bg-white rounded-2xl border border-ink-100 p-6">
              <p className="text-sm font-medium text-ink-800 mb-4">
                Set your {cfg.label.toLowerCase()} goal for {year}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setNewTarget(Math.max(1, newTarget - 1))}
                  className="w-10 h-10 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:bg-ink-50 text-lg font-bold"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-ink-900 w-20 text-center">{newTarget}</span>
                <button
                  onClick={() => setNewTarget(newTarget + 1)}
                  className="w-10 h-10 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:bg-ink-50 text-lg font-bold"
                >
                  +
                </button>
                <span className="text-ink-500 text-sm">{newTarget === 1 ? cfg.unit : cfg.unitPlural}</span>
              </div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {cfg.presets.map(n => (
                  <button
                    key={n}
                    onClick={() => setNewTarget(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      newTarget === n
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'border-ink-200 text-ink-600 hover:border-brand-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={saveGoal}
                disabled={saving}
                className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save goal
              </button>
            </div>
          )}

          {/* No goal set CTA */}
          {!editGoal && !activeGoal && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
              <Target className="w-8 h-8 text-brand-400 mx-auto mb-3" />
              <p className="text-ink-700 font-medium mb-1">Set your {cfg.label.toLowerCase()} goal for {year}</p>
              <p className="text-sm text-ink-500 mb-4">{cfg.description}.</p>
              <button
                onClick={() => setEditGoal(true)}
                className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Set a goal →
              </button>
            </div>
          )}

          {/* Progress ring */}
          {!editGoal && activeGoal && (
            <div className="bg-white rounded-2xl border border-ink-100 p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ProgressRing pct={pct} current={current} goal={target} unit={cfg.unit} />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-display text-lg font-bold text-ink-900">
                      {current} of {target} {current === 1 ? cfg.unit : cfg.unitPlural}
                    </p>
                    <p className="text-sm text-ink-500">
                      {current >= target
                        ? <span className="text-emerald-600 font-medium">Goal achieved!</span>
                        : `${target - current} ${target - current === 1 ? cfg.unit : cfg.unitPlural} to go`}
                    </p>
                  </div>
                  <PaceBadge goalType={activeType} current={current} target={target} />
                  {activeType === 'yearly_books' && (
                    <p className="text-xs text-ink-400">
                      On pace to finish {(() => {
                        const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
                        const expected = Math.floor((dayOfYear / 365) * target);
                        return current >= expected ? 'before' : 'after';
                      })()} December 31st, {year}
                    </p>
                  )}
                  <button className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
                    <Share2 className="w-4 h-4" /> Share progress
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All goals summary chips */}
          {goals.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">All Goals</p>
              <div className="flex flex-wrap gap-3">
                {goals.map(g => {
                  const c = GOAL_CONFIG[g.goal_type];
                  const Ic = c.icon;
                  const p = pctOf(g.current_value, g.goal_target);
                  return (
                    <button
                      key={g.goal_type}
                      onClick={() => handleTypeChange(g.goal_type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                        g.goal_type === activeType
                          ? 'bg-brand-50 border-brand-200 text-brand-700'
                          : 'bg-white border-ink-100 text-ink-600 hover:border-brand-200'
                      }`}
                    >
                      <Ic className="w-3.5 h-3.5" />
                      <span className="font-medium">{c.label}</span>
                      <span className={`text-[11px] font-bold ${p >= 100 ? 'text-emerald-600' : 'text-ink-400'}`}>
                        {p}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly breakdown — only for yearly_books view */}
          {activeType === 'yearly_books' && (
            <section>
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Monthly Breakdown</h2>
              <div className="bg-white rounded-2xl border border-ink-100 p-5">
                <div className="flex items-end gap-2 h-28">
                  {MONTH_NAMES.map((m, i) => {
                    const val = monthlyBooks[i] ?? 0;
                    const isCurrent = i === now.getMonth();
                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-ink-600 font-medium">{val || ''}</span>
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className={`w-full rounded-t-sm transition-all ${isCurrent ? 'bg-brand-500' : val ? 'bg-brand-200' : 'bg-ink-100'}`}
                            style={{ height: `${val ? (val / maxMonth) * 80 : 4}px` }}
                          />
                        </div>
                        <span className={`text-[9px] ${isCurrent ? 'text-brand-600 font-bold' : 'text-ink-400'}`}>{m}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Milestone badges — always visible, tied to total books read */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Milestone Badges</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {MILESTONES.map(m => {
                const earned = (activeGoal?.current_books ?? 0) >= m.books;
                return (
                  <div
                    key={m.books}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      earned ? 'bg-white border-brand-200 shadow-sm' : 'bg-paper-50 border-ink-100 opacity-50'
                    }`}
                  >
                    <span className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>{m.emoji}</span>
                    <p className="text-[10px] font-bold text-ink-800">{m.label}</p>
                    <p className="text-[9px] text-ink-400 mt-0.5">{m.desc}</p>
                    {earned && <span className="mt-1 text-[9px] text-brand-600 font-semibold">Earned</span>}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
