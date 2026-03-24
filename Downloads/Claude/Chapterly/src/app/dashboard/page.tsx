'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useShelf } from '@/hooks';
import Navigation from '@/components/layout/Navigation';
import StatsOverview from '@/components/dashboard/StatsOverview';
import BookSearch from '@/components/books/BookSearch';
import BookShelf from '@/components/books/BookShelf';
import QuickLog from '@/components/sessions/QuickLog';
import ShareCardPreview from '@/components/share/ShareCardPreview';
import LibraryImport from '@/components/books/GoodreadsImport';
import ReadNext from '@/components/books/ReadNext';
import ReadingCalendar from '@/components/sessions/ReadingCalendar';
import DailyGoal from '@/components/dashboard/DailyGoal';
import { BookOpen, Loader2, X, Plus, Search as SearchIcon } from 'lucide-react';
import AIInsights from '@/components/dashboard/AIInsights';
import SocialPulse from '@/components/dashboard/SocialPulse';
import ErrorBoundary from '@/components/ErrorBoundary';

type Tab = 'overview' | 'reading' | 'search' | 'streak' | 'share' | 'import';


function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'overview';
  const [logModal, setLogModal] = useState<any>(null);
  const [userHandle, setUserHandle] = useState<string | undefined>(undefined);
  const { books: currentlyReading, fetchBooks: refetchShelf } = useShelf('reading');

  // Fetch handle for share card watermark
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data?.handle) setUserHandle(j.data.handle); })
      .catch(() => {});
  }, []);

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
              {tab === 'streak' && 'Your Streak'}
              {tab === 'share' && 'Share Cards'}
              {tab === 'import' && 'Import Library'}
            </h1>
          </div>

          {tab === 'overview' && (
            <ErrorBoundary>
              <div className="space-y-8">
                {/* 1 — AI Insights */}
                <section><AIInsights /></section>

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

                {/* 4 — Social pulse */}
                <section><SocialPulse /></section>

                {/* 5 — Stats */}
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Your Stats</h2>
                  <StatsOverview />
                </section>

                {/* 6 — Read next */}
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Read Next</h2>
                  <ReadNext />
                </section>
              </div>
            </ErrorBoundary>
          )}

          {tab === 'reading' && <ErrorBoundary><BookShelf /></ErrorBoundary>}
          {tab === 'search' && <ErrorBoundary><BookSearch /></ErrorBoundary>}
          {tab === 'streak' && (
            <ErrorBoundary>
              <div className="space-y-8">
                <StatsOverview />
                <section>
                  <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Reading Calendar</h2>
                  <ReadingCalendar />
                </section>
                {currentlyReading.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Log a Session</h2>
                    <div className="bg-white rounded-2xl border border-ink-100 p-6">
                      <QuickLog userBook={currentlyReading[0]} onLogged={refetchShelf} />
                    </div>
                  </section>
                )}
              </div>
            </ErrorBoundary>
          )}
          {tab === 'share' && (
            <ErrorBoundary>
              <div className="bg-white rounded-2xl border border-ink-100 p-6">
                <ShareCardPreview
                  bookTitle={currentlyReading[0]?.book?.title}
                  bookAuthor={currentlyReading[0]?.book?.authors[0]}
                  coverUrl={currentlyReading[0]?.book?.cover_url}
                  currentPage={currentlyReading[0]?.current_page ?? 0}
                  totalPages={currentlyReading[0]?.book?.page_count ?? 0}
                  handle={userHandle}
                />
              </div>
            </ErrorBoundary>
          )}
          {tab === 'import' && (
            <ErrorBoundary>
              <div className="bg-white rounded-2xl border border-ink-100 p-6">
                <LibraryImport />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </main>

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
