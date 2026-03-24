'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Share2, Loader2, BookOpen } from 'lucide-react';

interface Challenge {
  id: string;
  year: number;
  goal_books: number;
  goal_pages: number | null;
  current_books: number;
  current_pages: number;
}

const MILESTONES = [
  { books: 1, emoji: '📖', label: 'First Chapter', desc: 'Read your first book' },
  { books: 5, emoji: '🌟', label: '5 Books', desc: 'Getting into the groove' },
  { books: 10, emoji: '🔥', label: '10 Books', desc: 'On fire!' },
  { books: 25, emoji: '💯', label: '25 Books', desc: 'Quarter century' },
  { books: 50, emoji: '⭐', label: '50 Books', desc: 'Half-century legend' },
  { books: 100, emoji: '🏆', label: '100 Books', desc: 'Century achievement' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ChallengeClient() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [editGoal, setEditGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(24);
  const [saving, setSaving] = useState(false);
  const [monthlyBooks, setMonthlyBooks] = useState<number[]>(new Array(12).fill(0));

  useEffect(() => {
    Promise.all([
      fetch('/api/challenges').then(r => r.ok ? r.json() : null),
      fetch('/api/challenges/monthly').then(r => r.ok ? r.json() : null),
    ]).then(([challengeData, monthlyData]) => {
      if (challengeData?.data) {
        setChallenge(challengeData.data);
        setNewGoal(challengeData.data.goal_books);
      }
      if (monthlyData?.data) setMonthlyBooks(monthlyData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveGoal = async () => {
    setSaving(true);
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: new Date().getFullYear(), goal_books: newGoal }),
    });
    if (res.ok) {
      const data = await res.json();
      setChallenge(data.data);
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

  const year = new Date().getFullYear();
  const current = challenge?.current_books ?? 0;
  const goal = challenge?.goal_books ?? 24;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  // Pace calculation
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
  const daysInYear = 365;
  const expectedByNow = Math.floor((dayOfYear / daysInYear) * goal);
  const pace = current - expectedByNow;
  const paceText = pace >= 0
    ? `${pace} book${pace !== 1 ? 's' : ''} ahead of schedule`
    : `${Math.abs(pace)} book${Math.abs(pace) !== 1 ? 's' : ''} behind schedule`;

  const maxMonth = Math.max(...monthlyBooks, 1);

  const earnedMilestones = MILESTONES.filter(m => current >= m.books);

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">{year} Reading Challenge</h1>
              <p className="text-ink-500 text-sm mt-1">Your goal, your pace, your achievement.</p>
            </div>
            <button
              onClick={() => setEditGoal(!editGoal)}
              className="text-sm text-brand-600 hover:underline font-medium px-3 py-1.5 bg-brand-50 rounded-xl"
            >
              {editGoal ? 'Cancel' : 'Edit goal'}
            </button>
          </div>

          {/* Edit goal */}
          {editGoal && (
            <div className="bg-white rounded-2xl border border-ink-100 p-6">
              <p className="text-sm font-medium text-ink-800 mb-4">Set your {year} reading goal</p>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setNewGoal(Math.max(1, newGoal - 1))}
                  className="w-10 h-10 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:bg-ink-50 text-lg font-bold">−</button>
                <span className="text-2xl font-bold text-ink-900 w-16 text-center">{newGoal}</span>
                <button onClick={() => setNewGoal(newGoal + 1)}
                  className="w-10 h-10 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:bg-ink-50 text-lg font-bold">+</button>
                <span className="text-ink-500 text-sm">books in {year}</span>
              </div>
              <div className="flex gap-2 mb-4">
                {[12, 24, 36, 52, 100].map(n => (
                  <button key={n} onClick={() => setNewGoal(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${newGoal === n ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 text-ink-600 hover:border-brand-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={saveGoal} disabled={saving}
                className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save goal
              </button>
            </div>
          )}

          {/* Progress ring */}
          {!editGoal && (
            <div className="bg-white rounded-2xl border border-ink-100 p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* SVG ring */}
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

                {/* Stats */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-display text-lg font-bold text-ink-900">
                      {current} of {goal} books
                    </p>
                    <p className="text-sm text-ink-500">{goal - current} books to go</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                    pace >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {pace >= 0 ? '✓' : '⚡'} {paceText}
                  </div>
                  <p className="text-xs text-ink-400">On pace to finish {pace >= 0 ? 'before' : 'after'} December 31st, {year}</p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
                    <Share2 className="w-4 h-4" /> Share progress
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Monthly breakdown */}
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

          {/* Milestone badges */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Milestone Badges</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {MILESTONES.map(m => {
                const earned = current >= m.books;
                return (
                  <div key={m.books} className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                    earned ? 'bg-white border-brand-200 shadow-sm' : 'bg-paper-50 border-ink-100 opacity-50'
                  }`}>
                    <span className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>{m.emoji}</span>
                    <p className="text-[10px] font-bold text-ink-800">{m.label}</p>
                    <p className="text-[9px] text-ink-400 mt-0.5">{m.desc}</p>
                    {earned && <span className="mt-1 text-[9px] text-brand-600 font-semibold">Earned ✓</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* No challenge set */}
          {!challenge && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
              <BookOpen className="w-8 h-8 text-brand-400 mx-auto mb-3" />
              <p className="text-ink-700 font-medium mb-1">Set your {year} reading goal</p>
              <p className="text-sm text-ink-500 mb-4">Challenge yourself to read more this year.</p>
              <button onClick={() => setEditGoal(true)}
                className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
                Set a goal →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
