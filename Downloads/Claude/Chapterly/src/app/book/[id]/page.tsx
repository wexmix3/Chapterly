'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import QuickLog from '@/components/sessions/QuickLog';
import {
  ArrowLeft, BookOpen, Star, Calendar, Hash, Loader2,
  CheckCircle, Clock, ExternalLink
} from 'lucide-react';
import type { UserBook, ReadingSession } from '@/types';
import { format, parseISO, addDays } from 'date-fns';

type ShelfStatus = 'to_read' | 'reading' | 'read' | 'dnf';

const STATUS_LABELS: Record<ShelfStatus, { label: string; emoji: string; color: string }> = {
  to_read:  { label: 'Want to Read', emoji: '📚', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  reading:  { label: 'Reading',      emoji: '📖', color: 'bg-brand-50 text-brand-700 border-brand-200' },
  read:     { label: 'Read',         emoji: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dnf:      { label: 'Did Not Finish', emoji: '🚫', color: 'bg-ink-50 text-ink-500 border-ink-200' },
};

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
          <Star className={`w-5 h-5 transition-colors ${
            (hover || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-ink-200'
          }`} />
        </button>
      ))}
    </div>
  );
}

function BookDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [communityReviews, setCommunityReviews] = useState<Array<{ id: string; rating: number; text?: string; users?: { display_name: string; avatar_url?: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const fetchUserBook = async () => {
    const res = await fetch(`/api/user-books/${id}`);
    if (!res.ok) { router.push('/dashboard?tab=reading'); return; }
    const json = await res.json();
    setUserBook(json.data);
    setRating(json.data.rating ?? 0);
    setReviewText(json.data.review_text ?? '');
  };

  useEffect(() => {
    const load = async () => {
      await fetchUserBook();
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!userBook?.book_id) return;
    // Fetch sessions
    fetch(`/api/sessions?book_id=${userBook.book_id}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => setSessions(json.data ?? []));
    // Fetch community reviews (graceful — table may not exist)
    fetch(`/api/reviews?book_id=${userBook.book_id}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => setCommunityReviews(json.data ?? []))
      .catch(() => {});
  }, [userBook?.book_id]);

  const saveReview = async () => {
    if (!userBook) return;
    setReviewSaving(true);
    await fetch(`/api/user-books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: rating || null, review_text: reviewText || null }),
    });
    // Also upsert into reviews table if rating set
    if (rating > 0) {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: userBook.book_id, user_book_id: userBook.id, rating, text: reviewText || null }),
      }).catch(() => {});
    }
    setReviewSaving(false);
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 2000);
  };

  const updateStatus = async (newStatus: ShelfStatus) => {
    if (!userBook) return;
    setStatusSaving(true);
    const res = await fetch(`/api/user-books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const json = await res.json();
      setUserBook(json.data);
    }
    setStatusSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  if (!userBook) return null;

  const { book } = userBook;
  const totalPages = book?.page_count ?? null;
  const currentPage = userBook.current_page ?? 0;
  const progress = totalPages ? Math.round((currentPage / totalPages) * 100) : null;
  const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_delta ?? 0), 0);
  const totalMinRead = sessions.reduce((sum, s) => sum + (s.minutes_delta ?? 0), 0);

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6">

          {/* Back */}
          <Link href="/dashboard?tab=reading"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> My Books
          </Link>

          {/* ── Hero ─────────────────────────────────── */}
          <div className="flex gap-5 mb-8">
            <div className="flex-shrink-0 w-28 h-44 bg-paper-200 rounded-xl overflow-hidden shadow-md">
              {book?.cover_url
                ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-ink-300" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50 leading-tight mb-1">
                {book?.title}
              </h1>
              <p className="text-sm text-ink-600 dark:text-ink-400 mb-3">
                {book?.authors?.join(', ')}
              </p>

              {/* Metadata chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {book?.published_year && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-500 bg-ink-50 px-2 py-1 rounded-lg">
                    <Calendar className="w-3 h-3" /> {book.published_year}
                  </span>
                )}
                {totalPages && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-500 bg-ink-50 px-2 py-1 rounded-lg">
                    <Hash className="w-3 h-3" /> {totalPages} pages
                  </span>
                )}
                {book?.isbn13 && (
                  <span className="text-xs text-ink-400 bg-ink-50 px-2 py-1 rounded-lg">
                    ISBN {book.isbn13}
                  </span>
                )}
              </div>

              {/* Shelf status selector */}
              <div className="flex flex-wrap gap-2">
                {(Object.entries(STATUS_LABELS) as [ShelfStatus, typeof STATUS_LABELS[ShelfStatus]][]).map(([s, info]) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    disabled={statusSaving}
                    className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                      userBook.status === s
                        ? `${info.color} border`
                        : 'bg-white border-ink-100 text-ink-500 hover:border-ink-300'
                    }`}>
                    {info.emoji} {info.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subjects */}
          {book?.subjects && (book.subjects as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {(book.subjects as string[]).slice(0, 8).map((s) => (
                <span key={s} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-100">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* ── Progress ─────────────────────────────── */}
          {totalPages !== null && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
              <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">Reading Progress</h2>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ink-600">
                  Page <span className="font-bold text-ink-900">{currentPage}</span> of{' '}
                  <span className="font-bold text-ink-900">{totalPages}</span>
                </span>
                <span className="font-semibold text-brand-600">{progress}% complete</span>
              </div>
              <div className="h-3 bg-ink-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-xs text-ink-500 mb-3 flex-wrap">
                <span><span className="font-semibold text-ink-700">{totalPagesRead}</span> pages logged</span>
                <span><span className="font-semibold text-ink-700">{sessions.length}</span> sessions</span>
                {totalMinRead > 0 && <span><span className="font-semibold text-ink-700">{Math.round(totalMinRead / 60 * 10) / 10}h</span> reading time</span>}
                {totalPages && currentPage > 0 && (
                  <span><span className="font-semibold text-ink-700">{totalPages - currentPage}</span> pages left</span>
                )}
              </div>

              {/* Pace estimate */}
              {(() => {
                if (userBook.status !== 'reading' || sessions.length === 0 || !totalPages || currentPage >= totalPages) return null;
                const readingDays = new Set(sessions.map(s => s.created_at.substring(0, 10))).size;
                const avgPagesPerDay = readingDays > 0 ? totalPagesRead / readingDays : 0;
                if (avgPagesPerDay <= 0) return null;
                const pagesLeft = totalPages - currentPage;
                const daysLeft = Math.ceil(pagesLeft / avgPagesPerDay);
                const finishDate = format(addDays(new Date(), daysLeft), 'MMM d');
                return (
                  <p className="text-xs text-ink-400 mb-3">
                    At your pace (~<span className="font-semibold text-ink-600">{Math.round(avgPagesPerDay)}</span> pages/day),
                    finish by <span className="font-semibold text-brand-600">{finishDate}</span>
                  </p>
                );
              })()}

              {/* Log session */}
              {userBook.status === 'reading' && (
                showLog
                  ? <div className="border-t border-ink-100 pt-4 mt-1">
                      <QuickLog userBook={userBook} onLogged={() => { void fetchUserBook(); }} onComplete={() => setShowLog(false)} />
                    </div>
                  : <button onClick={() => setShowLog(true)}
                      className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
                      Log Reading Session
                    </button>
              )}
            </section>
          )}

          {/* If status is reading but no page_count, still show log button */}
          {totalPages === null && userBook.status === 'reading' && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
              <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">Log Reading</h2>
              {showLog
                ? <QuickLog userBook={userBook} onLogged={() => { void fetchUserBook(); }} onComplete={() => setShowLog(false)} />
                : <button onClick={() => setShowLog(true)}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
                    Log Reading Session
                  </button>
              }
            </section>
          )}

          {/* ── My Rating & Review ───────────────────── */}
          <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
            <h2 className="font-display font-semibold text-ink-800 text-sm mb-4">My Rating & Review</h2>
            <div className="space-y-3">
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your thoughts about this book…"
                rows={3}
                className="w-full px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-300 resize-none transition-colors"
              />
              <button onClick={saveReview} disabled={reviewSaving}
                className="flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {reviewSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : reviewSaved ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                {reviewSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </section>

          {/* ── About ────────────────────────────────── */}
          {book?.description && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
              <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">About</h2>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line line-clamp-6">{book.description}</p>
            </section>
          )}

          {/* ── Session History ──────────────────────── */}
          {sessions.length > 0 && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
              <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">Your Sessions</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                      <span className="text-xs text-ink-500">
                        {format(parseISO(s.created_at), 'MMM d, yyyy')}
                      </span>
                      {s.notes && (
                        <span className="text-xs text-ink-400 italic truncate max-w-[120px]">&ldquo;{s.notes}&rdquo;</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-right">
                      {s.pages_delta > 0 && (
                        <span className="font-medium text-brand-600">+{s.pages_delta} pages</span>
                      )}
                      {s.pages_start != null && s.pages_end != null && (
                        <span className="text-ink-400">pp. {s.pages_start}&ndash;{s.pages_end}</span>
                      )}
                      {s.minutes_delta > 0 && (
                        <span className="text-ink-400">{s.minutes_delta} min</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Community Reviews ────────────────────── */}
          {communityReviews.length > 0 && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
              <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">Community Reviews</h2>
              <div className="space-y-4">
                {communityReviews.map((r) => (
                  <div key={r.id} className="border-b border-ink-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700">
                        {r.users?.display_name?.[0] ?? '?'}
                      </div>
                      <span className="text-xs font-medium text-ink-700">{r.users?.display_name ?? 'Reader'}</span>
                      <StarRating value={r.rating} readonly />
                    </div>
                    {r.text && <p className="text-sm text-ink-600 leading-relaxed">{r.text}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Discussions ──────────────────────────── */}
          <section className="bg-white rounded-2xl border border-ink-100 p-5 mb-5">
            <h2 className="font-display font-semibold text-ink-800 text-sm mb-3">Find Discussions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Reddit', url: `https://www.reddit.com/search/?q=${encodeURIComponent(`${book?.title} ${book?.authors?.[0] ?? ''}`)}` },
                { label: 'Goodreads', url: `https://www.goodreads.com/search?q=${encodeURIComponent(book?.title ?? '')}` },
                { label: 'Open Library', url: book?.source === 'openlibrary' ? `https://openlibrary.org/works/${book.source_id}` : `https://openlibrary.org/search?q=${encodeURIComponent(book?.title ?? '')}` },
                { label: 'Google Books', url: book?.source === 'googlebooks' ? `https://books.google.com/books?id=${book.source_id}` : `https://books.google.com/books?q=${encodeURIComponent(book?.title ?? '')}` },
              ].map(({ label, url }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 bg-ink-50 hover:bg-ink-100 rounded-xl text-xs font-medium text-ink-700 transition-colors">
                  <ExternalLink className="w-3 h-3 text-ink-400" /> {label}
                </a>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <BookDetailContent id={params.id} />
    </Suspense>
  );
}
