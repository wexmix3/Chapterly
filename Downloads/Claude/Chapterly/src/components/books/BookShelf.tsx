'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Star, Loader2, X, Check, AlertCircle, Pencil, Search, Library, Bookmark, CheckCircle, Plus, XCircle } from 'lucide-react';
import BookCover from '@/components/ui/BookCover';
import { BookCardSkeleton } from '@/components/ui/Skeleton';
import { useShelf } from '@/hooks';
import type { ShelfStatus, UserBook, BookSearchResult } from '@/types';

const TABS: { value: ShelfStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Library className="w-3.5 h-3.5" /> },
  { value: 'reading', label: 'Reading', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { value: 'to_read', label: 'Want to Read', icon: <Bookmark className="w-3.5 h-3.5" /> },
  { value: 'read', label: 'Read', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  { value: 'dnf', label: 'Did Not Finish', icon: <XCircle className="w-3.5 h-3.5" /> },
];

const SHELF_OPTIONS: { value: ShelfStatus; label: string }[] = [
  { value: 'to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'read', label: 'Read' },
  { value: 'dnf', label: 'Did Not Finish' },
];

export default function BookShelf() {
  const [activeTab, setActiveTab] = useState<ShelfStatus | 'all'>('all');
  const { books, loading, fetchBooks } = useShelf(activeTab === 'all' ? undefined : activeTab);
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Inline search state (Reading tab)
  const [inlineQuery, setInlineQuery] = useState('');
  const [inlineResults, setInlineResults] = useState<BookSearchResult[]>([]);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const inlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced inline search
  useEffect(() => {
    if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current);
    if (!inlineQuery.trim() || inlineQuery.trim().length < 2) {
      setInlineResults([]);
      return;
    }
    inlineTimerRef.current = setTimeout(async () => {
      setInlineLoading(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(inlineQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setInlineResults((json.data ?? []).slice(0, 5));
        }
      } finally {
        setInlineLoading(false);
      }
    }, 500);
    return () => {
      if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current);
    };
  }, [inlineQuery]);

  const handleInlineAdd = async (result: BookSearchResult) => {
    const key = result.source_id;
    setAddingId(key);
    try {
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResult: result, status: 'reading' }),
      });
      if (res.ok || res.status === 409) {
        setAddedIds(prev => new Set([...prev, key]));
        // Clear added state after 2 seconds, then refresh shelf
        setTimeout(() => {
          setAddedIds(prev => { const n = new Set(prev); n.delete(key); return n; });
          setInlineQuery('');
          setInlineResults([]);
          fetchBooks();
        }, 1500);
      }
    } finally {
      setAddingId(null);
    }
  };

  // Reset search when switching tabs
  const handleTabChange = (value: ShelfStatus | 'all') => {
    setActiveTab(value);
    setSearchQuery('');
    setInlineQuery('');
    setInlineResults([]);
  };

  // Client-side filtering by title or author
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter((ub) => {
      const title = ub.book?.title?.toLowerCase() ?? '';
      const authors = (ub.book?.authors ?? []).join(' ').toLowerCase();
      return title.includes(q) || authors.includes(q);
    });
  }, [books, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ value, label, icon }) => (
          <button key={value} onClick={() => handleTabChange(value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === value
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-ink-100 text-ink-600 hover:border-brand-200 hover:bg-brand-50/50'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Per-shelf search bar — only show when books are loaded */}
      {!loading && books.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title or author…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-ink-100 rounded-xl text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 hover:text-ink-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <BookCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty shelf (no books at all) */}
      {!loading && books.length === 0 && (
        <div className="space-y-4">
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-brand-400" />
            </div>
            <p className="font-semibold text-ink-700 dark:text-ink-300 mb-2">
              {activeTab === 'all' ? 'Your shelf is empty' :
               activeTab === 'reading' ? 'Not reading anything yet' :
               activeTab === 'to_read' ? 'No books in your want-to-read list' :
               'No finished books yet'}
            </p>
            <p className="text-sm text-ink-400 dark:text-ink-500 mb-5">
              {activeTab === 'all' || activeTab === 'to_read'
                ? 'Search for a book to add it to your shelf'
                : activeTab === 'reading'
                ? 'Use the search below to find and add a book'
                : 'Books you mark will appear here'}
            </p>
            {(activeTab === 'all' || activeTab === 'to_read') && (
              <a
                href="/dashboard?tab=search"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Search className="w-4 h-4" />
                Search books
              </a>
            )}
          </div>
          {activeTab === 'reading' && (
            <InlineBookSearch
              query={inlineQuery}
              setQuery={setInlineQuery}
              results={inlineResults}
              loading={inlineLoading}
              addingId={addingId}
              addedIds={addedIds}
              onAdd={handleInlineAdd}
            />
          )}
        </div>
      )}

      {/* No results after filtering */}
      {!loading && books.length > 0 && filteredBooks.length === 0 && searchQuery && (
        <div className="text-center py-10 px-4">
          <Search className="w-8 h-8 text-ink-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-500">No books match &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Book grid */}
      {!loading && filteredBooks.length > 0 && (
        <>
          {searchQuery && (
            <p className="text-xs text-ink-400">
              {filteredBooks.length} of {books.length} book{books.length !== 1 ? 's' : ''}
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredBooks.map((ub) => (
              <BookCard key={ub.id} userBook={ub} onEdit={() => setSelectedBook(ub)} />
            ))}
          </div>
          {/* Inline search widget — only on Reading tab */}
          {activeTab === 'reading' && (
            <InlineBookSearch
              query={inlineQuery}
              setQuery={setInlineQuery}
              results={inlineResults}
              loading={inlineLoading}
              addingId={addingId}
              addedIds={addedIds}
              onAdd={handleInlineAdd}
            />
          )}
        </>
      )}

      {/* Edit modal */}
      {selectedBook && (
        <BookEditModal
          userBook={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSaved={() => {
            setSelectedBook(null);
            fetchBooks();
          }}
        />
      )}
    </div>
  );
}

function BookCard({ userBook, onEdit }: { userBook: UserBook; onEdit: () => void }) {
  const { book } = userBook;
  const progress =
    userBook.current_page && book?.page_count
      ? Math.round((userBook.current_page / book.page_count) * 100)
      : null;

  return (
    <div className="group relative block text-left w-full">
      {/* Cover — links to book detail */}
      <Link href={`/book/${userBook.id}`} className="block">
        <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all relative">
          <BookCover
            src={book?.cover_url}
            title={book?.title ?? ''}
            authors={book?.authors}
            fill
            className="object-cover"
          />

          {/* Progress overlay for reading */}
          {userBook.status === 'reading' && progress !== null && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[9px] text-white/80 mt-0.5 text-center">{progress}%</p>
            </div>
          )}

          {/* Rating badge */}
          {userBook.rating && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 rounded-md px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              <span className="text-[9px] text-white font-medium">{userBook.rating}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Edit button — appears on hover */}
      <button
        onClick={onEdit}
        className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/60 rounded-md"
        title="Edit"
      >
        <Pencil className="w-3 h-3 text-white" />
      </button>

      {/* Title */}
      <p className="mt-1.5 text-[11px] font-medium text-ink-800 line-clamp-2 leading-tight">{book?.title}</p>
    </div>
  );
}

function BookEditModal({
  userBook,
  onClose,
  onSaved,
}: {
  userBook: UserBook;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { book } = userBook;

  const [status, setStatus] = useState<ShelfStatus>(userBook.status);
  const [currentPage, setCurrentPage] = useState<string>(
    userBook.current_page != null ? String(userBook.current_page) : '',
  );
  const [rating, setRating] = useState<number>(userBook.rating ?? 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState(userBook.review_text ?? '');
  const [startedAt, setStartedAt] = useState(
    userBook.started_at ? userBook.started_at.slice(0, 10) : '',
  );
  const [finishedAt, setFinishedAt] = useState(
    userBook.finished_at ? userBook.finished_at.slice(0, 10) : '',
  );
  const [format, setFormat] = useState<'physical' | 'ebook' | 'audiobook'>(
    ((userBook as unknown as Record<string, unknown>).format as 'physical' | 'ebook' | 'audiobook') ?? 'ebook'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates: Record<string, unknown> = {
        status,
        current_page: currentPage !== '' ? Number(currentPage) : null,
        rating: rating > 0 ? rating : null,
        review_text: reviewText.trim() || null,
        started_at: startedAt ? new Date(startedAt).toISOString() : null,
        finished_at: finishedAt ? new Date(finishedAt).toISOString() : null,
        format,
      };
      const res = await fetch(`/api/user-books/${userBook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        onSaved();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Failed to save changes');
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-paper-100">
          {/* Cover thumbnail */}
          <div className="w-12 flex-shrink-0">
            <div className="aspect-[2/3] bg-paper-200 rounded-lg overflow-hidden shadow-sm relative">
              <BookCover
                src={book?.cover_url}
                title={book?.title ?? ''}
                authors={book?.authors}
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink-900 line-clamp-2 leading-tight">{book?.title}</p>
            <p className="text-xs text-ink-500 mt-0.5">{book?.authors?.join(', ')}</p>
            {book?.page_count && (
              <p className="text-xs text-ink-400 mt-0.5">{book.page_count} pages</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-paper-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
              Shelf Status
            </label>
            <div className="flex flex-wrap gap-2">
              {SHELF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    // Auto-set finished date if marking as read
                    if (opt.value === 'read' && !finishedAt) {
                      setFinishedAt(new Date().toISOString().slice(0, 10));
                    }
                    // Auto-set started date if marking as reading
                    if (opt.value === 'reading' && !startedAt) {
                      setStartedAt(new Date().toISOString().slice(0, 10));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    status === opt.value
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300'
                  }`}
                >
                  {status === opt.value && <Check className="w-3 h-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current page */}
          <div>
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
              Current Page
              {book?.page_count && (
                <span className="ml-1 normal-case font-normal">/ {book.page_count}</span>
              )}
            </label>
            <input
              type="number"
              min={0}
              max={book?.page_count ?? undefined}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              placeholder="0"
              className="w-32 px-3 py-2 border border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => {
                const isHalf = v % 1 !== 0;
                const active = (hoverRating || rating) >= v;
                return (
                  <button
                    key={v}
                    onMouseEnter={() => setHoverRating(v)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(v === rating ? 0 : v)}
                    className="focus:outline-none relative"
                    style={{ width: isHalf ? '12px' : '24px' }}
                    title={`${v}★`}
                  >
                    {!isHalf ? (
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active ? 'fill-brand-400 text-brand-400' : 'text-ink-200'
                        }`}
                      />
                    ) : (
                      <div className="w-3 h-6 overflow-hidden absolute left-0">
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            active ? 'fill-brand-400 text-brand-400' : 'text-ink-200'
                          }`}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="ml-2 text-sm font-semibold text-brand-600">{rating}★</span>
              )}
              {rating > 0 && (
                <button
                  onClick={() => setRating(0)}
                  className="ml-1 text-xs text-ink-400 hover:text-ink-600"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Review / notes */}
          <div>
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
              Notes / Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Your thoughts on this book…"
              rows={3}
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>

          {/* Format */}
          <div>
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
              Format
            </label>
            <div className="flex gap-2">
              {(['physical', 'ebook', 'audiobook'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    format === f
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white border-ink-200 text-ink-600 hover:border-brand-300'
                  }`}
                >
                  {f === 'physical' ? 'Physical' : f === 'ebook' ? 'E-book' : 'Audiobook'}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
                Started
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 block">
                Finished
              </label>
              <input
                type="date"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm text-ink-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>


          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-paper-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 text-sm font-medium text-ink-600 hover:bg-paper-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline search widget for the Reading tab ─────────────────────────────────

interface InlineBookSearchProps {
  query: string;
  setQuery: (q: string) => void;
  results: BookSearchResult[];
  loading: boolean;
  addingId: string | null;
  addedIds: Set<string>;
  onAdd: (result: BookSearchResult) => void;
}

function InlineBookSearch({ query, setQuery, results, loading, addingId, addedIds, onAdd }: InlineBookSearchProps) {
  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-ink-400" />
        <span className="text-sm font-medium text-ink-500">Search and add books</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-paper-50 border border-ink-100 rounded-xl text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((result) => {
            const key = result.source_id;
            const isAdded = addedIds.has(key);
            const isAdding = addingId === key;
            return (
              <div key={key} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                {/* Cover thumbnail */}
                <div className="w-8 h-12 bg-paper-200 rounded-md overflow-hidden flex-shrink-0 relative">
                  <BookCover
                    src={result.cover_url}
                    title={result.title}
                    authors={result.authors}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Title + author */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-900 truncate">{result.title}</p>
                  <p className="text-[11px] text-ink-400 truncate">{result.authors.join(', ')}</p>
                </div>
                {/* Add button */}
                <button
                  onClick={() => onAdd(result)}
                  disabled={isAdded || isAdding}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    isAdded
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                  } disabled:opacity-60`}
                >
                  {isAdding ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isAdded ? (
                    <><Check className="w-3 h-3" /> Added</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Add to Reading</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
