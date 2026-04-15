'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { BookOpen, Star, ChevronLeft, Plus, Check, AlertCircle, ShoppingBag, ExternalLink, MessageSquare, Trash2, Share2, Headphones, Tablet, Book, X, Users } from 'lucide-react';
import BookCover from '@/components/ui/BookCover';
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

// Mood/vibe tags saved directly to user_books (for AI recommendations)
const BOOK_VIBE_TAGS = [
  'adventurous', 'dark', 'emotional', 'hopeful', 'funny',
  'tense', 'slow-paced', 'fast-paced', 'thought-provoking', 'heartwarming',
];

const FORMAT_OPTIONS = [
  { value: 'physical', label: 'Physical', icon: Book },
  { value: 'ebook', label: 'E-book', icon: Tablet },
  { value: 'audiobook', label: 'Audiobook', icon: Headphones },
] as const;

type FormatType = 'physical' | 'ebook' | 'audiobook';

const DIMENSION_LABELS: Record<string, string> = {
  plot: 'Plot',
  characters: 'Characters',
  writing: 'Writing',
  pacing: 'Pacing',
};

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
  mood_tags?: string[];
  format?: FormatType;
  dimension_ratings?: Record<string, number>;
  started_at?: string | null;
  finished_at?: string | null;
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

interface QuoteEntry {
  id: string;
  text: string;
  page_number?: number | null;
  created_at: string;
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

  // Format, vibe tags, dimension ratings
  const [selectedFormat, setSelectedFormat] = useState<FormatType | ''>(userBook?.format ?? '');
  const [bookVibes, setBookVibes] = useState<string[]>(userBook?.mood_tags ?? []);
  const [dimensionRatings, setDimensionRatings] = useState<Record<string, number>>(userBook?.dimension_ratings ?? {});
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSaved, setDetailSaved] = useState(false);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [sessionStats, setSessionStats] = useState<{ count: number; minutes: number } | null>(null);

  // Buddy read invite modal
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [buddyFriends, setBuddyFriends] = useState<{ id: string; display_name: string; avatar_url?: string | null; handle: string }[]>([]);
  const [buddyInviteeId, setBuddyInviteeId] = useState('');
  const [buddyTargetDate, setBuddyTargetDate] = useState('');
  const [buddySending, setBuddySending] = useState(false);
  const [buddySent, setBuddySent] = useState(false);

  // Quotes state
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);

  // Load quotes once if book is on shelf
  useEffect(() => {
    if (!userBook) return;
    fetch(`/api/quotes?book_id=${book.id}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setQuotes(j.data ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load session stats for share modal
  const openShareModal = async () => {
    setShowShareModal(true);
    if (!userBook || sessionStats !== null) return;
    try {
      const r = await fetch(`/api/sessions?book_id=${book.id}`);
      if (r.ok) {
        const j = await r.json();
        const sessions = j.data ?? [];
        const count = sessions.length;
        const minutes = sessions.reduce((s: number, sess: { minutes_delta?: number }) => s + (sess.minutes_delta ?? 0), 0);
        setSessionStats({ count, minutes });
      }
    } catch { /* ignore */ }
  };

  const openBuddyModal = async () => {
    setShowBuddyModal(true);
    if (buddyFriends.length === 0) {
      try {
        const r = await fetch('/api/social');
        if (r.ok) {
          const j = await r.json();
          setBuddyFriends(j.data ?? []);
        }
      } catch { /* ignore */ }
    }
  };

  const sendBuddyInvite = async () => {
    if (!buddyInviteeId) return;
    setBuddySending(true);
    try {
      const res = await fetch('/api/buddy-reads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: book.id, invitee_id: buddyInviteeId, target_date: buddyTargetDate || undefined }),
      });
      if (res.ok || res.status === 409) {
        setBuddySent(true);
        setTimeout(() => { setShowBuddyModal(false); setBuddySent(false); setBuddyInviteeId(''); setBuddyTargetDate(''); }, 1500);
      }
    } finally {
      setBuddySending(false);
    }
  };

  const handleShare = async () => {
    const days = userBook?.started_at && userBook?.finished_at
      ? Math.max(1, Math.round((new Date(userBook.finished_at).getTime() - new Date(userBook.started_at).getTime()) / 86400000))
      : null;
    const parts = [
      `Just finished "${book.title}" by ${book.authors?.[0] ?? 'Unknown'}`,
      days ? `Completed in ${days} day${days !== 1 ? 's' : ''}` : '',
      sessionStats?.count ? `across ${sessionStats.count} reading session${sessionStats.count !== 1 ? 's' : ''}` : '',
      userRating ? `⭐ ${userRating}/5` : '',
    ].filter(Boolean);
    const text = parts.join(' · ') + '\n\nTracked with Chapterly 📚 https://chapterly.app';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    alert('Copied to clipboard!');
  };

  // Save format / vibes / dimension ratings to user_books
  const saveBookDetails = async () => {
    if (!userBook) return;
    setDetailSaving(true);
    try {
      await fetch('/api/user-books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userBook.id,
          ...(selectedFormat ? { format: selectedFormat } : {}),
          mood_tags: bookVibes,
          ...(Object.keys(dimensionRatings).length > 0 ? { dimension_ratings: dimensionRatings } : {}),
        }),
      });
      setDetailSaved(true);
      setTimeout(() => setDetailSaved(false), 2000);
    } finally {
      setDetailSaving(false);
    }
  };

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

  const saveQuote = async () => {
    if (!quoteText.trim()) return;
    setSavingQuote(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id,
          text: quoteText.trim(),
          page_number: quotePage ? parseInt(quotePage, 10) : null,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        setQuotes(prev => [j.data, ...prev]);
        setQuoteText('');
        setQuotePage('');
      }
    } finally {
      setSavingQuote(false);
    }
  };

  const deleteQuote = async (id: string) => {
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (res.ok) setQuotes(prev => prev.filter(q => q.id !== id));
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
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          <Link href="/dashboard?tab=search"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>

          {/* Book header */}
          <div className="flex gap-6 mb-8">
            <div className="w-28 md:w-36 flex-shrink-0">
              <div className="aspect-[2/3] bg-paper-200 rounded-2xl overflow-hidden shadow-lg relative">
                <BookCover
                  src={book.cover_url}
                  title={book.title}
                  authors={book.authors}
                  fill
                  className="object-cover"
                />
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

              {/* Format selector — shown when book is on shelf */}
              {shelfStatus && (
                <div className="mt-4 pt-4 border-t border-paper-100">
                  <p className="text-[10px] text-ink-400 mb-2 uppercase tracking-wide font-medium">Reading format</p>
                  <div className="flex gap-2 flex-wrap">
                    {FORMAT_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedFormat(v => v === value ? '' : value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedFormat === value
                            ? 'bg-brand-100 text-brand-700 border-brand-300'
                            : 'bg-white border-ink-200 text-ink-600 hover:border-brand-200'
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Share button — shown when book is finished */}
              {shelfStatus === 'read' && (
                <div className="mt-3">
                  <button
                    onClick={openShareModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-50 border border-ink-200 text-ink-600 hover:border-brand-300 hover:text-brand-700 transition-all"
                  >
                    <Share2 className="w-3 h-3" /> Share this book
                  </button>
                </div>
              )}

              {/* Buddy Read button — shown when book is on shelf */}
              {shelfStatus && (
                <div className="mt-3">
                  <button
                    onClick={openBuddyModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all"
                  >
                    <Users className="w-3 h-3" /> Buddy Read
                  </button>
                </div>
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

            {/* Mood tags (for review) */}
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

            {/* Dimension ratings */}
            <div className="mb-4">
              <p className="text-xs text-ink-500 mb-2">Dimension ratings <span className="text-ink-300">(optional)</span></p>
              <div className="space-y-2">
                {Object.keys(DIMENSION_LABELS).map(dim => (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="text-xs text-ink-600 w-20 flex-shrink-0">{DIMENSION_LABELS[dim]}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          onClick={() => setDimensionRatings(prev => ({ ...prev, [dim]: prev[dim] === n ? 0 : n }))}
                          className="focus:outline-none"
                          title={`${n}★`}
                        >
                          <Star className={`w-4 h-4 ${(dimensionRatings[dim] ?? 0) >= n ? 'fill-brand-300 text-brand-300' : 'text-ink-200'} transition-colors`} />
                        </button>
                      ))}
                    </div>
                    {dimensionRatings[dim] > 0 && (
                      <span className="text-xs text-brand-500">{dimensionRatings[dim]}★</span>
                    )}
                  </div>
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

          {/* Book Vibes (saved to user_books for AI recs) — shown when on shelf */}
          {userBook && (
            <section className="bg-white rounded-2xl border border-ink-100 p-6 mb-8">
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-1">Book Vibes</h2>
              <p className="text-xs text-ink-400 mb-4">Tag this book to improve your AI recommendations</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {BOOK_VIBE_TAGS.map(vibe => (
                  <button
                    key={vibe}
                    onClick={() => setBookVibes(prev =>
                      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
                    )}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      bookVibes.includes(vibe)
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-purple-200'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
              <button
                onClick={saveBookDetails}
                disabled={detailSaving}
                className="px-4 py-2 bg-ink-800 hover:bg-ink-900 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {detailSaved ? '✓ Saved' : detailSaving ? 'Saving…' : 'Save vibes & format'}
              </button>
            </section>
          )}

          {/* Quotes — only shown when book is on shelf */}
          {userBook && (
            <section className="bg-white rounded-2xl border border-ink-100 p-6 mb-8">
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-400" /> My Quotes
              </h2>

              {/* Input */}
              <div className="space-y-2 mb-5">
                <textarea
                  value={quoteText}
                  onChange={e => setQuoteText(e.target.value)}
                  placeholder="Paste a quote you want to remember…"
                  rows={3}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quotePage}
                    onChange={e => setQuotePage(e.target.value)}
                    placeholder="Page # (optional)"
                    min={1}
                    className="w-36 px-3 py-2 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    onClick={saveQuote}
                    disabled={savingQuote || !quoteText.trim()}
                    className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {savingQuote ? 'Saving…' : 'Save quote'}
                  </button>
                </div>
              </div>

              {/* Saved quotes list */}
              {quotes.length === 0 ? (
                <p className="text-sm text-ink-400 italic">No quotes saved yet.</p>
              ) : (
                <ul className="space-y-3">
                  {quotes.map(q => (
                    <li key={q.id} className="flex items-start gap-3 bg-paper-50 rounded-xl px-4 py-3">
                      <blockquote className="flex-1 text-sm text-ink-700 italic leading-relaxed">
                        &ldquo;{q.text}&rdquo;
                        {q.page_number && (
                          <span className="not-italic text-ink-400 text-xs ml-2">— p.{q.page_number}</span>
                        )}
                      </blockquote>
                      <button
                        onClick={() => deleteQuote(q.id)}
                        className="flex-shrink-0 text-ink-300 hover:text-red-400 transition-colors mt-0.5"
                        title="Delete quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

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

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-ink-900">Share this book</h3>
              <button onClick={() => setShowShareModal(false)} className="text-ink-400 hover:text-ink-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Book info */}
            <div className="flex items-center gap-3 bg-paper-50 rounded-xl px-4 py-3 mb-4">
              <BookOpen className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{book.title}</p>
                <p className="text-xs text-ink-400">{book.authors?.[0]}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {userRating > 0 && (
                <div className="bg-paper-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-base font-bold text-brand-600">{userRating}★</p>
                  <p className="text-[10px] text-ink-400">Rating</p>
                </div>
              )}
              {sessionStats && sessionStats.count > 0 && (
                <div className="bg-paper-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-base font-bold text-ink-800">{sessionStats.count}</p>
                  <p className="text-[10px] text-ink-400">Sessions</p>
                </div>
              )}
              {sessionStats && sessionStats.minutes > 0 && (
                <div className="bg-paper-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-base font-bold text-ink-800">{Math.round(sessionStats.minutes / 60)}h</p>
                  <p className="text-[10px] text-ink-400">Reading time</p>
                </div>
              )}
            </div>

            <button
              onClick={handleShare}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      )}

      {/* Buddy Read invite modal */}
      {showBuddyModal && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-ink-900">Invite to Buddy Read</h3>
              <button onClick={() => setShowBuddyModal(false)} className="text-ink-400 hover:text-ink-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-ink-500 mb-4">Read <span className="font-medium text-ink-800">{book.title}</span> together with a friend.</p>

            {buddyFriends.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-4">No friends to invite yet — follow people to get started.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {buddyFriends.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setBuddyInviteeId(id => id === f.id ? '' : f.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      buddyInviteeId === f.id
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-ink-200 hover:border-purple-200'
                    }`}
                  >
                    {f.avatar_url
                      ? <img src={f.avatar_url} alt={f.display_name} className="w-8 h-8 rounded-full object-cover" />
                      : <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">{f.display_name[0]}</span>
                    }
                    <div>
                      <p className="text-sm font-medium text-ink-800">{f.display_name}</p>
                      <p className="text-xs text-ink-400">@{f.handle}</p>
                    </div>
                    {buddyInviteeId === f.id && <Check className="w-4 h-4 text-purple-600 ml-auto" />}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-ink-500 mb-1 block">Target finish date (optional)</label>
              <input
                type="date"
                value={buddyTargetDate}
                onChange={e => setBuddyTargetDate(e.target.value)}
                className="w-full border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-800 focus:outline-none focus:border-purple-400"
              />
            </div>

            <button
              onClick={sendBuddyInvite}
              disabled={!buddyInviteeId || buddySending || buddySent}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {buddySent ? <><Check className="w-4 h-4" /> Invite sent!</> : buddySending ? 'Sending…' : <><Users className="w-4 h-4" /> Send invite</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


