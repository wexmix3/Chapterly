'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useShelf } from '@/hooks';
import Navigation from '@/components/layout/Navigation';
import StatsOverview from '@/components/dashboard/StatsOverview';
import BookSearch from '@/components/books/BookSearch';
import BookShelf from '@/components/books/BookShelf';
import QuickLog from '@/components/sessions/QuickLog';
import DailyGoal from '@/components/dashboard/DailyGoal';
import { BookOpen, Loader2, X, Search as SearchIcon, Crown, Camera } from 'lucide-react';
import nextDynamic from 'next/dynamic';

const ISBNScanner = nextDynamic(() => import('@/components/books/ISBNScanner'), { ssr: false });
import Link from 'next/link';
import AIInsights from '@/components/dashboard/AIInsights';
import SocialPulse from '@/components/dashboard/SocialPulse';
import ErrorBoundary from '@/components/ErrorBoundary';
import DailyQuests from '@/components/quests/DailyQuests';
import OnboardingBanner from '@/components/dashboard/OnboardingBanner';
import StreakAtRiskBanner from '@/components/dashboard/StreakAtRiskBanner';

type Tab = 'overview' | 'reading' | 'search';


function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';
  const [logModal, setLogModal] = useState<any>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { books: currentlyReading, fetchBooks: refetchShelf } = useShelf('reading');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 page-enter">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">
              {tab === 'overview' && `Hey, ${user?.user_metadata?.full_name?.split(' ')[0] || 'Reader'}`}
              {tab === 'reading' && 'My Books'}
              {tab === 'search' && 'Find a Book'}
            </h1>
          </div>

          {tab === 'overview' && (
            <ErrorBoundary>
              <div className="space-y-8">
                {/* 0 — Onboarding banner (new users only, self-dismissing) */}
                <OnboardingBanner />

                {/* 1 — AI Insights */}
                <section><AIInsights /></section>

                {/* 1b — Streak at-risk banner (shown when streak is active but no reading logged today) */}
                <StreakAtRiskBanner />

                {/* 2 — Currently reading */}
                {currentlyReading.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Continue Reading</h2>
                    <div className="space-y-3">
                      {currentlyReading.slice(0, 3).map((ub) => (
                        <div key={ub.id} onClick={() => setLogModal(ub)}
                          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-ink-100 hover:border-brand-200 transition-colors cursor-pointer">
                          <div className="w-12 h-18 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
                            {ub.book?.cover_url
                              ? <img src={ub.book.cover_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-ink-300" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-ink-900 truncate">{ub.book?.title}</p>
                            <p className="text-xs text-ink-400 truncate">{ub.book?.authors[0]}</p>
                            {ub.current_page && ub.book?.page_count && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand-400 rounded-full progress-fill"
                                    style={{ width: `${Math.round((ub.current_page / ub.book.page_count) * 100)}%` }} />
                                </div>
                                <span className="text-[10px] text-ink-400 flex-shrink-0">
                                  {Math.round((ub.current_page / ub.book.page_count) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-medium">Log</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state when nothing is being read */}
                {currentlyReading.length === 0 && (
                  <section>
                    <div className="bg-gradient-to-br from-brand-50 to-paper-100 dark:from-brand-950/30 dark:to-ink-900 rounded-2xl border border-brand-100 dark:border-brand-900 p-8 text-center">
                      <h2 className="font-display text-lg font-bold text-ink-900 dark:text-paper-100 mb-2">Start your reading journey</h2>
                      <p className="text-sm text-ink-500 dark:text-ink-400 mb-5 max-w-xs mx-auto">
                        Search for a book to add to your shelf and start tracking your reading.
                      </p>
                      <button
                        onClick={() => router.push('/dashboard?tab=search')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        <SearchIcon className="w-4 h-4" />
                        Find your first book
                      </button>
                    </div>
                  </section>
                )}

                {/* 3 — Daily goal */}
                <section><DailyGoal /></section>

                {/* 4 — Daily quests */}
                <section><DailyQuests /></section>

                {/* 4b — Premium upgrade CTA (client-side, shown to free users) */}
                <UpgradeCTA />

                {/* 5 — Social pulse */}
                <section><SocialPulse /></section>

                {/* 6 — Stats */}
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Your Stats</h2>
                  <StatsOverview />
                </section>

              </div>
            </ErrorBoundary>
          )}

          {tab === 'reading' && <ErrorBoundary><BookShelf /></ErrorBoundary>}
          {tab === 'search' && <ErrorBoundary><BookSearch /></ErrorBoundary>}
        </div>
      </main>

      {/* Scan ISBN FAB — visible on Books tab (mobile-first) */}
      {tab === 'reading' && (
        <button
          onClick={() => setScannerOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all md:hidden"
          title="Scan ISBN barcode"
          aria-label="Scan ISBN barcode"
        >
          <Camera className="w-6 h-6" />
        </button>
      )}

      {scannerOpen && (
        <ISBNScanner
          onDetected={(isbn) => {
            setScannerOpen(false);
            router.push(`/dashboard?tab=search&q=${encodeURIComponent(isbn)}`);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {logModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Log Reading</h3>
              <button onClick={() => setLogModal(null)} className="p-2 rounded-xl hover:bg-ink-50 text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <QuickLog userBook={logModal} onLogged={refetchShelf} onComplete={() => setLogModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeCTA() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => setIsPremium(j?.data?.is_premium ?? false))
      .catch(() => setIsPremium(false));
  }, []);
  if (isPremium !== false) return null; // null = loading, true = premium
  return (
    <section>
      <Link
        href="/premium"
        className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-brand-50 border border-amber-200 rounded-2xl p-4 hover:border-amber-300 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-800 text-sm">Unlock AI-powered reading insights</p>
          <p className="text-xs text-ink-500 mt-0.5">Reading Coach, DNA, Personality + more — free trial</p>
        </div>
        <span className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full group-hover:bg-amber-200 transition-colors">
          Upgrade →
        </span>
      </Link>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
