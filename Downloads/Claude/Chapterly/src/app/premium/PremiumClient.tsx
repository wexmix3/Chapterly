'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { Sparkles, Check, Zap, Crown, BookOpen, BarChart3, Palette, Shield, Loader2 } from 'lucide-react';
import { PREMIUM_FEATURES, PREMIUM_PRICE_DISPLAY } from '@/lib/stripe';

const FEATURE_ICONS = [BookOpen, BarChart3, Palette, Zap, Shield, Crown];

export default function PremiumClient({
  isPremium,
  expiresAt,
  hasCustomer,
}: {
  isPremium: boolean;
  expiresAt: string | null;
  hasCustomer: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get('success') === 'true';
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setCheckoutError('Could not connect. Please try again.');
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setCheckoutError('Could not connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-lg mx-auto px-4 md:px-8 pt-6 space-y-6">

          {justSubscribed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-emerald-800 font-semibold text-sm">Welcome to Chapterly Premium!</p>
              <p className="text-emerald-600 text-xs mt-0.5">Your subscription is now active. Enjoy all features.</p>
            </div>
          )}

          {/* Hero */}
          <div className="bg-gradient-to-br from-brand-500 to-amber-500 rounded-3xl p-8 text-center text-white shadow-lg">
            <Crown className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <h1 className="font-display text-3xl font-bold mb-2">Chapterly Premium</h1>
            <p className="text-white/80 text-sm">The reading experience you deserve.</p>
            {!isPremium && (
              <p className="mt-4 text-2xl font-bold">
                {PREMIUM_PRICE_DISPLAY}
                <span className="text-sm font-normal text-white/70 ml-1">after 7-day free trial</span>
              </p>
            )}
          </div>

          {/* Status card for existing subscribers */}
          {isPremium && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">You&apos;re a Premium member</p>
                  {expiresAt && (
                    <p className="text-xs text-ink-400">
                      Renews {new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Features list */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-paper-200">
            <h2 className="font-display text-base font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              What&apos;s included
            </h2>
            <div className="space-y-3">
              {PREMIUM_FEATURES.map((feature, i) => {
                const Icon = FEATURE_ICONS[i] ?? Check;
                return (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <p className="text-sm text-ink-700">{feature}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          {!isPremium ? (
            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                Start 7-Day Free Trial
              </button>
              <p className="text-center text-xs text-ink-400">
                Cancel anytime. No charge for 7 days.
              </p>
              {checkoutError && (
                <p className="text-center text-xs text-red-500">{checkoutError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full bg-paper-100 text-ink-700 py-3 rounded-2xl font-medium text-sm border border-paper-200 hover:bg-paper-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Manage subscription
              </button>
              {checkoutError && (
                <p className="text-center text-xs text-red-500">{checkoutError}</p>
              )}
            </div>
          )}

          {/* Free tier reminder */}
          <div className="bg-paper-100 rounded-xl p-4 border border-paper-200">
            <p className="text-xs font-semibold text-ink-600 mb-2">Free plan always includes:</p>
            <div className="space-y-1">
              {['Unlimited book tracking', 'Reading streaks & stats', 'Share cards', 'Goodreads import', '1 book club'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-ink-500">
                  <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
