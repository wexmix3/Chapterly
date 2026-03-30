'use client';
import { Crown } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateProps {
  isPremium: boolean;
  featureName: string;
  children: React.ReactNode;
  compact?: boolean;
}

export default function PremiumGate({ isPremium, featureName, children, compact }: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  if (compact) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-40 select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/premium"
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-amber-200 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-50 transition-colors"
          >
            <Crown className="w-3.5 h-3.5" />
            Unlock {featureName}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
        <Crown className="w-6 h-6 text-amber-600" />
      </div>
      <div>
        <p className="font-semibold text-ink-800 text-sm">{featureName} is a Premium feature</p>
        <p className="text-xs text-ink-500 mt-0.5">Upgrade to unlock unlimited access</p>
      </div>
      <Link
        href="/premium"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow hover:shadow-md transition-all"
      >
        <Crown className="w-4 h-4" />
        Start 7-Day Free Trial
      </Link>
    </div>
  );
}
