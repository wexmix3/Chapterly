'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import {
  BookOpen, ArrowLeft, Share2, Globe, Lock, Loader2,
  Link as LinkIcon, Plus, X, Search, Trash2,
} from 'lucide-react';

interface ListBook {
  note?: string | null;
  position: number;
  book: {
    id: string;
    title: string;
    authors: string[];
    cover_url?: string | null;
    page_count?: number | null;
    description?: string | null;
  } | null;
}

interface ListData {
  list: {
    id: string;
    title: string;
    description?: string | null;
    is_public: boolean;
    book_count: number;
    created_at: string;
    owner: { id: string; handle: string; display_name: string; avatar_url?: string | null } | null;
  };
  books: ListBook[];
  is_owner: boolean;
}

interface BookResult {
  id: string;
  title: string;
  authors: string[];
  cover_url?: string | null;
  page_count?: number | null;
}

function AddBooksPanel({
  listId,
  existingBookIds,
  onAdded,
}: {
  listId: string;
  existingBookIds: Set<string>;
  onAdded: (book: BookResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults((json.data ?? []).slice(0, 8));
        }
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const add = async (book: BookResult) => {
    setAdding(book.id);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: book.id, note: note[book.id] || null }),
      });
      if (res.ok) {
        onAdded(book);
        setNote(n => { const next = { ...n }; delete next[book.id]; return next; });
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-5">
      <h3 className="font-semibold text-sm text-ink-800 dark:text-ink-200 mb-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-brand-500" />
        Search books to add
      </h3>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-ink-400" />}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map(book => {
            const alreadyAdded = existingBookIds.has(book.id);
            return (
              <div key={book.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                alreadyAdded
                  ? 'border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-ink-100 dark:border-ink-700 bg-ink-50 dark:bg-ink-800'
              }`}>
                <div className="w-9 h-12 bg-paper-200 dark:bg-ink-700 rounded-lg overflow-hidden flex-shrink-0">
                  {book.cover_url
                    ? <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-ink-300" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-paper-100 line-clamp-1">{book.title}</p>
                  <p className="text-xs text-ink-400 line-clamp-1">{book.authors?.[0]}</p>
                  {!alreadyAdded && (
                    <input
                      type="text"
                      value={note[book.id] ?? ''}
                      onChange={e => setNote(n => ({ ...n, [book.id]: e.target.value }))}
                      placeholder="Add a note (optional)"
                      className="mt-1.5 w-full text-xs px-2 py-1 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-lg focus:outline-none focus:border-brand-400"
                    />
                  )}
                </div>
                {alreadyAdded ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0 mt-1">✓ Added</span>
                ) : (
                  <button
                    onClick={() => add(book)}
                    disabled={adding === book.id}
                    className="flex-shrink-0 mt-0.5 flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {adding === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-ink-400 text-center py-4">No books found for &ldquo;{query}&rdquo;</p>
      )}
      {query.length < 2 && (
        <p className="text-xs text-ink-400 text-center py-2">Type at least 2 characters to search</p>
      )}
    </div>
  );
}

export default function ListDetailClient({ listId, viewerId }: { listId: string; viewerId: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/lists/${listId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [listId]);

  useEffect(() => { load(); }, [load]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/lists/${listId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookAdded = (book: BookResult) => {
    setData(prev => {
      if (!prev) return prev;
      const newEntry: ListBook = {
        note: null,
        position: prev.books.length + 1,
        book: {
          id: book.id,
          title: book.title,
          authors: book.authors,
          cover_url: book.cover_url,
          page_count: book.page_count,
        },
      };
      return {
        ...prev,
        books: [...prev.books, newEntry],
        list: { ...prev.list, book_count: prev.list.book_count + 1 },
      };
    });
  };

  const handleRemove = async (bookId: string) => {
    if (!data) return;
    setRemoving(bookId);
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId }),
      });
      if (res.ok) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            books: prev.books.filter(b => b.book?.id !== bookId),
            list: { ...prev.list, book_count: Math.max(0, prev.list.book_count - 1) },
          };
        });
      }
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-950 flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
        <Navigation />
        <main className="md:ml-64 flex items-center justify-center min-h-[80vh]">
          <p className="text-ink-400">List not found.</p>
        </main>
      </div>
    );
  }

  const { list, books, is_owner } = data;
  const owner = list.owner;
  const existingBookIds = new Set(books.map(b => b.book?.id).filter(Boolean) as string[]);

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-5">

          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* List header */}
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 shadow-sm border border-ink-100 dark:border-ink-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {list.is_public
                    ? <Globe className="w-3.5 h-3.5 text-ink-400" />
                    : <Lock className="w-3.5 h-3.5 text-ink-400" />}
                  <span className="text-xs text-ink-400">{list.is_public ? 'Public list' : 'Private list'}</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-paper-50">{list.title}</h1>
                {list.description && <p className="text-sm text-ink-500 mt-1.5">{list.description}</p>}
                <div className="flex items-center gap-2 mt-3">
                  {owner?.avatar_url && <img src={owner.avatar_url} alt="" className="w-5 h-5 rounded-full" />}
                  <button
                    onClick={() => owner && router.push(`/u/${owner.handle}`)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    by @{owner?.handle}
                  </button>
                  <span className="text-xs text-ink-400">· {list.book_count} book{list.book_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {is_owner && (
                  <button
                    onClick={() => setShowAdd(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      showAdd
                        ? 'bg-brand-500 text-white'
                        : 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-100 dark:border-brand-900'
                    }`}
                  >
                    {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showAdd ? 'Close' : 'Add books'}
                  </button>
                )}
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-ink-50 dark:bg-ink-800 rounded-xl text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors border border-ink-100 dark:border-ink-700"
                >
                  {copied
                    ? <><LinkIcon className="w-3.5 h-3.5 text-emerald-600" /> Copied!</>
                    : <><Share2 className="w-3.5 h-3.5" /> Share</>}
                </button>
              </div>
            </div>
          </div>

          {/* Add books panel */}
          {showAdd && is_owner && (
            <AddBooksPanel
              listId={listId}
              existingBookIds={existingBookIds}
              onAdded={handleBookAdded}
            />
          )}

          {/* Books list */}
          {books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-ink-200 dark:text-ink-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-ink-500 dark:text-ink-400 mb-1">No books in this list yet</p>
              {is_owner && (
                <p className="text-xs text-brand-600">
                  Click <strong>Add books</strong> above to get started
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {books.map((entry, i) => {
                const book = entry.book;
                if (!book) return null;
                return (
                  <div key={book.id} className="bg-white dark:bg-ink-900 rounded-xl p-4 flex gap-4 shadow-sm border border-ink-100 dark:border-ink-800 group">
                    <div className="flex-shrink-0 text-center w-5 mt-1">
                      <span className="text-xs font-bold text-ink-300 dark:text-ink-600">#{i + 1}</span>
                    </div>
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-paper-200 dark:bg-ink-700 shadow-sm">
                      {book.cover_url
                        ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-ink-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 dark:text-paper-100 text-sm leading-snug">{book.title}</p>
                      <p className="text-xs text-ink-400">{book.authors?.[0]}</p>
                      {book.page_count && <p className="text-xs text-ink-400 mt-0.5">{book.page_count} pages</p>}
                      {entry.note && (
                        <p className="text-xs text-ink-600 dark:text-ink-400 mt-2 italic bg-paper-50 dark:bg-ink-800 rounded-lg px-3 py-2 border border-paper-100 dark:border-ink-700">
                          &ldquo;{entry.note}&rdquo;
                        </p>
                      )}
                    </div>
                    {is_owner && (
                      <button
                        onClick={() => handleRemove(book.id)}
                        disabled={removing === book.id}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-40"
                        title="Remove from list"
                      >
                        {removing === book.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA for non-logged-in visitors */}
          {!viewerId && (
            <div className="bg-ink-900 rounded-2xl p-6 text-center space-y-3">
              <p className="text-white font-display text-lg font-semibold">Track your reading on Chapterly</p>
              <p className="text-ink-300 text-sm">Free forever. Build your shelf, set goals, share with friends.</p>
              <button
                onClick={() => router.push('/login?mode=signup')}
                className="bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors text-sm mx-auto block"
              >
                Get started free →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
