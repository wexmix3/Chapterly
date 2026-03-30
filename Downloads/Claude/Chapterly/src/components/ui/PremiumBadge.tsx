'use client';
import { Crown } from 'lucide-react';
import Link from 'next/link';

export default function PremiumBadge({ label = 'Premium' }: { label?: string }) {
  return (
    <Link
      href="/premium"
      className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-semibold hover:bg-amber-200 transition-colors"
    >
      <Crown className="w-3 h-3" />
      {label}
    </Link>
  );
}
