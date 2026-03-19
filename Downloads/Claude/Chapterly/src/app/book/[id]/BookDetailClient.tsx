'use client';

import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { BookOpen, Star, ChevronLeft, Plus, Check, AlertCircle, ShoppingBag, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function buildAffiliateLinks(title: string, authors: string[]) {
  const q = encodeURIComponent(`${title} ${authors[0] ?? ''}`.trim());
  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? 'chapterly-20';
  const amazon = `https://www.amazon.com/s?k=${q}&tag=${amazonTag}`;
  const bookshop = `https://bookshop.org/search?keywords=${encodeURIComponent(title)}`;
  return { amazon, bookshop };
}

const SHELF_OPTIONS = [
  { value: 'to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'read', label: 'Read' },
  { value: 'dnf', label: 'Did Not Finish' },
] as const;

const MOOD_TAGS = [
  'cozy', 'dark', 'funny', 'emotional', 'fast-paced',
  'slow-burn', 'mind-bending', 'spicy', 'wholesome', 'unputdownable',
];

interface Book {
  id: string;
  title: string;
  authors: string[];
  cover_url?: string;
  description?: string;
  page_count?: number;
  subjects?: string[];
  source?: string;
}

interface UserBook {
  id: string;
  status: string;
  rating?: number;
  review_text?: string;
  mood?: string[];
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  text?: string;
  contains_spoilers: boolean;
  mood_tags?: string[];
  created_at: string;
  users?: { display_name?: string; avatar_url?: string };
}

interface Props {
  book: Book;
  userBook: UserBook | null;
  reviews: Review[];
  userId: string;
}

export default function BookDetailClient({ book, userBook, reviews, userId }: Props) {
  const [shelfStatus, setShelfStatus] = useState(userBook?.status ?? '');
  const [userRating, setUserRating] = useState<number>(userBook?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState(userBook?.review_text ?? '');
  const [selectedMoods, setSelectedMoods] = useState<string[]>(userBook?.mood ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [error, setError] = useState('');

  const addToShelf = async (status: string) => {
    setSaving(true);
    setError('');
    try {
      const method = userBook ? 'PATCH' : 'POST';
      const body = userBook
        ? { id: userBook.id, status }
        : {
          searchResult: {
            source: book.source ?? 'manual',
            source_id: book.id,
            title: book.title,
            authors: book.authors,
            cover_url: book.cover_url,
            page_count: book.page_count,
            subjects: book.subjects ?? [],
          },
          status,
        };
      const res = await fetch('/api/user-books', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShelfStatus(status);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Could not update shelf');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveReview = async () => {
    if (!userRating) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id,
          user_book_id: userBook?.id,
          rating: userRating,
          text: reviewText,
          mood_tags: selectedMoods,
          contains_spoilers: false,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError('Could not save review');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  // Compute community avg
  const communityRatings = reviews.filter(r => r.rating > 0);
  const avgRating = communityRatings.length
    ? communityRatings.reduce((s, r) => s + r.rating, 0) / communityRatings.length
    : 0;

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          <Link href="/dashboard?tab=search"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>

          {/* Book header */}
          <div className="flex gap-6 mb-8">
            <div className="w-28 md:w-36 flex-shrink-0">
              <div className="aspect-[2/3] bg-paper-200 rounded-2xl overflow-hidden shadow-lg">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-ink-300" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-950 mb-1">{book.title}</h1>
              <p className="text-ink-500 mb-3">{book.authors?.join(', ')}</p>
              {book.page_count && (
                <p className="text-xs text-ink-400 mb-3">{book.page_count} pages</p>
              )}

              {/* Community rating */}
              {communityRatings.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(avgRating) ? 'fill-brand-400 text-brand-400' : 'text-ink-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-ink-800">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-ink-400">({communityRatings.length} rating{communityRatings.length !== 1 ? 's' : ''})</span>
                </div>
              )}

              {/* Shelf picker */}
              <div className="flex flex-wrap gap-2">
                {SHELF_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => addToShelf(opt.value)}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      shelfStatus === opt.value
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300'
                    }`}
                  >
                    {shelfStatus === opt.value ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {opt.label}
                  </button>
                ))}
              </div>

              {saved && <p className="text-xs text-emerald-600 mt-2">✓ Saved to shelf</p>}
              {error && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}

              {/* Affiliate buy links */}
              {(() => {
                const { amazon, bookshop } = buildAffiliateLinks(book.title, book.authors ?? []);
                return (
                  <div className="mt-4 pt-4 border-t border-paper-100">
                    <p className="text-[10px] text-ink-400 mb-2 uppercase tracking-wide font-medium">Buy this book</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={amazon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Amazon
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                      <a
                        href={bookshop}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Bookshop.org
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <section className="mb-8">
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-3">About this book</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{book.description}</p>
            </section>
          )}

          {/* Subjects/genres */}
          {book.subjects && book.subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {book.subjects.slice(0, 8).map(s => (
                <span key={s} className="text-xs bg-paper-100 border border-ink-100 text-ink-600 px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Rate & Review */}
          <section className="bg-white rounded-2xl border border-ink-100 p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Your Review</h2>

            {/* Half-star rating */}
            <div className="mb-4">
              <p className="text-xs text-ink-500 mb-2">Rating (half-star increments)</p>
              <div className="flex items-center gap-1">
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(v => {
                  const isHalf = v % 1 !== 0;
                  const displayV = Math.ceil(v);
                  const active = (hoverRating || userRating) >= v;
                  return (
                    <button
                      key={v}
                      onMouseEnter={() => setHoverRating(v)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(v)}
                      className="focus:outline-none relative"
                      style={{ width: isHalf ? '12px' : '24px' }}
                      title={`${v}★`}
                    >
                      {!isHalf ? (
                        <Star className={`w-6 h-6 ${active ? 'fill-brand-400 text-brand-400' : 'text-ink-200'} transition-colors`} />
                      ) : (
                        <div className="w-3 h-6 overflow-hidden absolute left-0">
                          <Star className={`w-6 h-6 ${active ? 'fill-brand-400 text-brand-400' : 'text-ink-200'} transition-colors`} />
                        </div>
                      )}
                    </button>
                  );
                })}
                {userRating > 0 && (
                  <span className="ml-2 text-sm font-semibold text-brand-600">{userRating}★</span>
                )}
              </div>
            </div>

            {/* Mood tags */}
            <div className="mb-4">
              <p className="text-xs text-ink-500 mb-2">Mood / Vibe tags</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedMoods.includes(mood)
                        ? 'bg-brand-100 text-brand-700 border-brand-300'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Review text */}
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Write your review… (optional)"
              rows={4}
              className="w-full px-4 py-3 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none mb-4"
            />

            <button
              onClick={saveReview}
              disabled={saving || !userRating}
              className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {saved ? '✓ Saved' : 'Save review'}
            </button>
          </section>

          {/* Community reviews */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">
              Community Reviews
              {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-ink-400">({reviews.length})</span>}
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center text-ink-400">
                <p>No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => {
                  const isSpoiler = review.contains_spoilers && !showSpoilers;
                  const initials = (review.users?.display_name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={review.id} className="bg-white rounded-2xl border border-ink-100 p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {review.users?.avatar_url ? (
                          <img src={review.users.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink-900">{review.users?.display_name ?? 'Reader'}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <Star key={n} className={`w-3 h-3 ${n <= review.rating ? 'fill-brand-400 text-brand-400' : 'text-ink-200'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-ink-400">{timeAgo(review.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {review.mood_tags && review.mood_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {review.mood_tags.map(t => (
                            <span key={t} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}

                      {review.text && (
                        <p className={`text-sm text-ink-600 ${isSpoiler ? 'blur-sm select-none' : ''}`}>
                          {review.text}
                        </p>
                      )}

                      {isSpoiler && (
                        <button onClick={() => setShowSpoilers(true)} className="text-xs text-brand-600 hover:underline mt-1">
                          Show spoiler
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
