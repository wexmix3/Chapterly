'use client';

/**
 * PremiumNudgeModal
 * A lightweight overlay shown at premium friction points.
 * Triggered when a free user hits a usage limit.
 *
 * Usage:
 *   <PremiumNudgeModal
 *     open={showNudge}
 *     onClose={() => setShowNudge(false)}
 *     reason="shelf_limit"        // determines headline + copy
 *   />
 *
 * Reasons:
 *   shelf_limit      — tried to add book #51+
 *   ai_recs_limit    — viewed AI recs 3+ times today
 *   advanced_stats   — wants advanced stats
 *   club_limit       — tried to join club #4+
 */

import { X, Crown, BookOpen, Sparkles, BarChart2, Users } from 'lucide-react';
import Link from 'next/link';

export type PremiumNudgeReason = 'shelf_limit' | 'ai_recs_limit' | 'advanced_stats' | 'club_limit';

const COPY: Record<PremiumNudgeReason, {
  icon: React.ReactNode;
  headline: string;
  body: string;
  cta: string;
}> = {
  shelf_limit: {
    icon: <BookOpen className="w-6 h-6 text-amber-600" />,
    headline: 'Shelf limit reached',
    body: 'Free accounts can track up to 50 books. Upgrade to Premium for an unlimited shelf — no caps, ever.',
    cta: 'Unlock Unlimited Shelf',
  },
  ai_recs_limit: {
    icon: <Sparkles className="w-6 h-6 text-amber-600" />,
    headline: 'Daily AI limit reached',
    body: "You've used your 3 free AI recommendation lookups for today. Upgrade to Premium for unlimited daily AI insights.",
    cta: 'Unlock Unlimited AI',
  },
  advanced_stats: {
    icon: <BarChart2 className="w-6 h-6 text-amber-600" />,
    headline: 'Advanced stats are Premium',
    body: 'Reading DNA, genre distribution over time, pace analytics, and yearly comparisons are Premium features.',
    cta: 'Unlock Advanced Stats',
  },
  club_limit: {
    icon: <Users className="w-6 h-6 text-amber-600" />,
    headline: 'Club limit reached',
    body: 'Free accounts can join up to 3 book clubs. Upgrade to Premium to join unlimited clubs and create your own.',
    cta: 'Unlock Unlimited Clubs',
  },
};

interface PremiumNudgeModalProps {
  open: boolean;
  onClose: () => void;
  reason: PremiumNudgeReason;
}

export default function PremiumNudgeModal({ open, onClose, reason }: PremiumNudgeModalProps) {
  if (!open) return null;

  const copy = COPY[reason];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 px-5 pt-5 pb-4 border-b border-amber-200 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-200/50 text-amber-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
              {copy.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Premium Feature</p>
              <h3 className="font-display font-bold text-ink-900 text-base leading-tight">{copy.headline}</h3>
            </div>
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">{copy.body}</p>
        </div>

        {/* Feature bullets */}
        <div className="px-5 py-4 space-y-2">
          {[
            'Unlimited shelf & book clubs',
            'Unlimited AI recommendations daily',
            'Advanced reading stats & DNA',
            'Reading streaks + freeze tokens',
            'Premium badge on your profile',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-xs text-ink-600">
              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 space-y-2">
          <Link
            href="/premium"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white text-sm font-bold rounded-xl shadow transition-all"
          >
            <Crown className="w-4 h-4" />
            {copy.cta} — 7-Day Free Trial
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-ink-400 hover:text-ink-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
