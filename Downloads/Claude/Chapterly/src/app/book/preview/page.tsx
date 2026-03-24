'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import {
  ArrowLeft, BookOpen, Star, Loader2, Plus, Check,
  ExternalLink, MessageSquare, Users
} from 'lucide-react';

interface BookData {
  id: string | null;
  title: string;
  authors: string[];
  cover_url?: string | null;
  page_count?: number | null;
  published_year?: number | null;
  isbn13?: string | null;
  source: string;
  source_id: string;
}

interface Review {
  id: string;
  rating: number;
  text?: string;
  mood_tags?: string[];
  created_at: string;
  users?: { display_name: string; avatar_url?: string };
}

const MOOD_LABELS: Record<string, string> = {
  loved_it: '🌟 Loved it', emotional: '😢 Emotional', funny: '😂 Funny',
  mind_bending: '🤯 Mind-bending', romantic: '💕 Romantic', addictive: '🔥 Addictive',
  educational: '🧠 Educational', slow_start: '😴 Slow start',
};

const STATUS_OPTIONS = [
  { value: 'to_read',  label: 'Want to Read', emoji: '📚' },
  { value: 'reading',  label: 'Reading Now',  emoji: '📖' },
  { value: 'read',     label: 'Read It',      emoji: '✅' },
];

function BookPreviewContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [book, setBook] = useState<BookData | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userBook, setUserBook] = useState<{ id: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  const isbn    = params.get('isbn');
  const source  = params.get('source');
  const sourceId = params.get('id');
  const titleParam  = params.get('title') ?? '';
  const authorParam = params.get('author') ?? '';

  useEffect(() => {
    const query = new URLSearchParams();
    if (isbn)     { query.set('isbn', isbn); }
    else if (source && sourceId) { query.set('source', source); query.set('id', sourceId); }
    if (titleParam)  query.set('title', titleParam);
    if (authorParam) query.set('author', authorParam);

    fetch(`/api/books/preview?${query}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.book) setBook(data.book);
        if (data?.description) setDescription(data.description);
        if (data?.reviews) setReviews(data.reviews);
        if (data?.userBook) setUserBook(data.userBook);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToShelf = async (status: string) => {
    if (!book) return;
    setAdding(status);
    const searchResult = {
      source: book.source,
      source_id: book.source_id,
      title: book.title,
      authors: book.authors,
      cover_url: book.cover_url ?? null,
      published_year: book.published_year ?? null,
      isbn13: book.isbn13 ?? null,
      page_count: book.page_count ?? null,
    };
    const res = await fetch('/api/user-books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchResult, status }),
    });
    if (res.ok || res.status === 409) {
      const json = res.ok ? await res.json() : null;
      setUserBook({ id: json?.data?.id ?? 'added', status });
    }
    setAdding(null);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 pt-[52px]">
        <Navigation />
        <main className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </main>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-paper-50 pt-[52px]">
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <BookOpen className="w-12 h-12 text-ink-200" />
          <p className="text-ink-500">Book not found.</p>
          <button onClick={() => router.back()} className="text-sm text-brand-600 hover:underline">Go back</button>
        </main>
      </div>
    );
  }

  const title   = book.title || titleParam;
  const authors = book.authors?.length ? book.authors : authorParam ? [authorParam] : [];
  const cover   = book.cover_url ?? (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null);

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-8">

          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Hero */}
          <div className="flex gap-6 items-start">
            <div className="w-28 flex-shrink-0">
              <div className="aspect-[2/3] bg-paper-200 rounded-2xl overflow-hidden shadow-md">
                {cover ? (
                  <img src={cover} alt={title} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-ink-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-display text-xl md:text-2xl font-bold text-ink-900 leading-tight mb-1">{title}</h1>
              <p className="text-ink-500 text-sm mb-3">{authors.join(', ')}</p>

              <div className="flex flex-wrap gap-3 text-xs text-ink-400 mb-4">
                {book.published_year && <span>📅 {book.published_year}</span>}
                {book.page_count && <span>📄 {book.page_count} pages</span>}
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>

              {/* Shelf status / Add to shelf */}
              {userBook ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium">
                    <Check className="w-3 h-3" />
                    {STATUS_OPTIONS.find(s => s.value === userBook.status)?.label ?? 'On Shelf'}
                  </span>
                  {userBook.id && userBook.id !== 'added' && (
                    <Link href={`/book/${userBook.id}`}
                      className="text-xs text-brand-600 hover:underline font-medium">
                      View details →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => addToShelf(opt.value)}
                      disabled={!!adding}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-60 bg-white border-ink-200 text-ink-700 hover:border-brand-400 hover:bg-brand-50">
                      {adding === opt.value
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><span>{opt.emoji}</span> {opt.label}</>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {description && (
            <section className="bg-white rounded-2xl border border-ink-100 p-5">
              <h2 className="font-display font-semibold text-ink-800 mb-3 text-sm uppercase tracking-wide">About this book</h2>
              <p className="text-sm text-ink-600 leading-relaxed line-clamp-[12]">{description}</p>
            </section>
          )}

          {/* Find on social */}
          <section className="bg-white rounded-2xl border border-ink-100 p-5">
            <h2 className="font-display font-semibold text-ink-800 mb-3 text-sm uppercase tracking-wide">Find on Social</h2>
            <div className="flex flex-wrap gap-2">
              <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(`${title} booktok`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-xl text-xs font-medium hover:opacity-80 transition-opacity">
                🎵 BookTok
                <ExternalLink className="w-3 h-3" />
              </a>
              {book.source === 'openlibrary' && book.source_id && (
                <a href={`https://openlibrary.org/works/${book.source_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity">
                  📖 Open Library
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(title.replace(/\s+/g, '').toLowerCase())}/`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 text-pink-700 rounded-xl text-xs font-medium hover:opacity-80 transition-opacity">
                📸 Bookstagram
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>

          {/* Community reviews */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <h2 className="font-display text-lg font-semibold text-ink-800">
                Chapterly Reviews {reviews.length > 0 && <span className="text-ink-400 font-normal text-base">({reviews.length})</span>}
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
                <Users className="w-8 h-8 text-ink-200 mx-auto mb-3" />
                <p className="text-sm text-ink-500">No reviews yet on Chapterly.</p>
                <p className="text-xs text-ink-400 mt-1">Add this book to your shelf and be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.users?.display_name
    ?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4">
      <div className="flex items-start gap-3">
        {review.users?.avatar_url ? (
          <img src={review.users.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-ink-900">{review.users?.display_name ?? 'Reader'}</p>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-ink-200'}`} />
              ))}
            </div>
          </div>
          {review.mood_tags && review.mood_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {review.mood_tags.map(t => (
                <span key={t} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  {MOOD_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          )}
          {review.text && <p className="text-sm text-ink-600 leading-relaxed">{review.text}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BookPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <BookPreviewContent />
    </Suspense>
  );
}
