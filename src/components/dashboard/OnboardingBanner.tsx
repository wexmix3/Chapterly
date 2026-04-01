'use client';

/**
 * OnboardingBanner
 * Shown to users created within the last 7 days.
 * Tracks 4 getting-started steps; dismissible.
 * Completion state persisted in localStorage so it survives page reloads.
 */

import { useState, useEffect } from 'react';
import { X, BookOpen, BookMarked, Target, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Step {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  action: { label: string; href: string } | null;
}

const STEPS: Step[] = [
  {
    id: 'add_book',
    icon: <BookOpen className="w-4 h-4" />,
    label: 'Add your first book',
    description: 'Search for any book and add it to your shelf.',
    action: { label: 'Find a book', href: '/dashboard?tab=search' },
  },
  {
    id: 'log_session',
    icon: <BookMarked className="w-4 h-4" />,
    label: 'Log a reading session',
    description: 'Track pages or time for any book you\'re reading.',
    action: { label: 'Go to shelf', href: '/dashboard?tab=reading' },
  },
  {
    id: 'set_goal',
    icon: <Target className="w-4 h-4" />,
    label: 'Set a reading goal',
    description: 'Choose a yearly, monthly, or daily goal.',
    action: { label: 'Set goals', href: '/challenge' },
  },
  {
    id: 'follow_reader',
    icon: <Users className="w-4 h-4" />,
    label: 'Follow someone',
    description: 'See what your friends are reading.',
    action: { label: 'Find readers', href: '/feed' },
  },
];

const STORAGE_KEY = 'chapterly_onboarding_steps';
const DISMISSED_KEY = 'chapterly_onboarding_dismissed';

export default function OnboardingBanner() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [createdRecently, setCreatedRecently] = useState(false);

  // Check if user is new (created within last 7 days) and load completion state
  useEffect(() => {
    // Check dismissed flag first
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(DISMISSED_KEY) === '1') {
        setDismissed(true);
        return;
      }
    }

    // Fetch profile to check created_at
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.data) return;
        const createdAt = json.data.created_at;
        if (!createdAt) return;
        const ageMs = Date.now() - new Date(createdAt).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (ageMs > sevenDaysMs) return; // older than 7 days — don't show
        setCreatedRecently(true);
        setVisible(true);

        // Load saved completion state
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { setCompleted(new Set(JSON.parse(saved) as string[])); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Auto-detect completed steps by polling relevant data
  useEffect(() => {
    if (!visible) return;

    const detect = async () => {
      try {
        const [booksRes, sessionsRes, challengeRes, socialRes] = await Promise.all([
          fetch('/api/user-books?limit=1'),
          fetch('/api/sessions?limit=1'),
          fetch('/api/challenges'),
          fetch('/api/social'),
        ]);

        const newCompleted = new Set(completed);

        if (booksRes.ok) {
          const j = await booksRes.json();
          if ((j.data ?? []).length > 0) newCompleted.add('add_book');
        }
        if (sessionsRes.ok) {
          const j = await sessionsRes.json();
          if ((j.data ?? []).length > 0) newCompleted.add('log_session');
        }
        if (challengeRes.ok) {
          const j = await challengeRes.json();
          if (j.data?.goal_books > 0 || j.data?.length > 0) newCompleted.add('set_goal');
        }
        if (socialRes.ok) {
          const j = await socialRes.json();
          if ((j.data ?? []).length > 0) newCompleted.add('follow_reader');
        }

        setCompleted(newCompleted);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...newCompleted]));
      } catch {}
    };

    detect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible || dismissed || !createdRecently) return null;

  const completedCount = completed.size;
  const totalCount = STEPS.length;
  const allDone = completedCount === totalCount;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <section>
      <div className="bg-gradient-to-br from-brand-50 to-paper-100 border border-brand-200 rounded-2xl p-5 relative">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-brand-100 text-ink-400 hover:text-ink-600 transition-colors"
          aria-label="Dismiss getting started guide"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display font-bold text-ink-900 text-sm">
              {allDone ? 'You\'re all set!' : 'Getting started'}
            </h2>
            <span className="text-xs font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-xs text-ink-500">
            {allDone
              ? 'Welcome to Chapterly — enjoy tracking your reading journey.'
              : 'Complete these steps to get the most out of Chapterly.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-brand-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step) => {
            const done = completed.has(step.id);
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  done
                    ? 'bg-white/60 border-brand-100 opacity-60'
                    : 'bg-white border-ink-100'
                }`}
              >
                {/* Icon / check */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  done ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${done ? 'text-ink-400 line-through' : 'text-ink-800'}`}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-[11px] text-ink-400 truncate">{step.description}</p>
                  )}
                </div>

                {/* CTA */}
                {!done && step.action && (
                  <Link
                    href={step.action.href}
                    className="flex-shrink-0 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {step.action.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {allDone && (
          <button
            onClick={handleDismiss}
            className="w-full mt-3 py-2 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </section>
  );
}
