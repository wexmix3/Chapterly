'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface MilestoneModalProps {
  open: boolean;
  onClose: () => void;
  achievement: {
    emoji: string;
    title: string;
    description: string;
    xpEarned: number;
  } | null;
}

export default function MilestoneModal({ open, onClose, achievement }: MilestoneModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !achievement) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-ink-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in border border-ink-100 dark:border-ink-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Achievement icon */}
        <div className="text-6xl mb-4 leading-none">{achievement.emoji}</div>

        {/* XP badge */}
        <div className="inline-flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          +{achievement.xpEarned} XP earned
        </div>

        <h2 className="font-display text-xl font-bold text-ink-950 dark:text-paper-50 mb-2">
          {achievement.title}
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
          {achievement.description}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Keep going!
        </button>
      </div>
    </div>
  );
}

// ── Hook for milestone detection via localStorage ──────────────────────────────

const STORAGE_KEY = 'chapterly_shown_milestones';

export function useNewMilestones(achievementIds: string[]): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  const seen: string[] = stored ? (JSON.parse(stored) as string[]) : [];
  const newOnes = achievementIds.filter(id => !seen.includes(id));
  if (newOnes.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, ...newOnes]));
  }
  return newOnes;
}
