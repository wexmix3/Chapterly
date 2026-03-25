'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import BookCover from '@/components/ui/BookCover';
import { Quote, Trash2, Search, Plus, X, ChevronDown, Loader2 } from 'lucide-react';

interface QuoteBook {
  id: string;
  title: string;
  authors: string[];
  cover_url?: string;
}

interface QuoteEntry {
  id: string;
  text: string;
  page_number?: number | null;
  created_at: string;
  books: QuoteBook | null;
}

interface ShelfEntry {
  book_id: string;
  book: { id: string; title: string; authors: string[]; cover_url?: string | null } | null;
}

interface Props {
  initialQuotes: QuoteEntry[];
}

export default function QuotesClient({ initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<QuoteEntry[]>(initialQuotes);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [selectedBook, setSelectedBook] = useState<ShelfEntry['book'] | null>(null);
  const [shelfBooks, setShelfBooks] = useState<ShelfEntry[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showForm || shelfBooks.length > 0) return;
    fetch('/api/user-books?limit=100').then(r => r.json()).then(d => setShelfBooks(d.data ?? [])).catch(() => {});
  }, [showForm, shelfBooks.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resetForm = () => { setQuoteText(''); setPageNumber(''); setSelectedBook(null); setSaveError(''); setShowForm(false); };

  const saveQuote = async () => {
    if (!quoteText.trim()) { setSaveError('Quote text is required.'); return; }
    if (!selectedBook) { setSaveError('Please select a book.'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: selectedBook.id, text: quoteText.trim(), page_number: pageNumber ? parseInt(pageNumber) : null }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? 'Failed to save.'); return; }
      setQuotes(prev => [{
        id: json.data.id, text: json.data.text, page_number: json.data.page_number, created_at: json.data.created_at,
        books: { id: selectedBook.id, title: selectedBook.title, authors: selectedBook.authors, cover_url: selectedBook.cover_url ?? undefined },
      }, ...prev]);
      resetForm();
    } finally { setSaving(false); }
  };

  const deleteQuote = async (id: string) => {
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (res.ok) setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const filtered = search.trim()
    ? quotes.filter(q =>
        q.text.toLowerCase().includes(search.toLowerCase()) ||
        q.books?.title.toLowerCase().includes(search.toLowerCase())
      )
    : quotes;

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
              <Quote className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-950">My Quotes</h1>
              <p className="text-sm text-ink-500">{quotes.length} saved passage{quotes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Quote
          </button>
        </div>

        {/* Add Quote Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-brand-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-semibold text-ink-800">New Quote</h2>
              <button onClick={resetForm} className="text-ink-400 hover:text-ink-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="Type or paste the passage here…"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2.5 bg-paper-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none mb-1"
            />
            <p className="text-[10px] text-ink-400 text-right mb-3">{quoteText.length}/500</p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-paper-50 border border-ink-200 rounded-xl text-sm hover:border-ink-300 focus:outline-none focus:border-brand-400 transition-all"
                >
                  <span className={selectedBook ? 'text-ink-800 truncate' : 'text-ink-400'}>
                    {selectedBook ? selectedBook.title : 'Select a book…'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {shelfBooks.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-ink-400 text-center">No books on your shelf yet</div>
                    ) : (
                      shelfBooks.map(sb => sb.book && (
                        <button
                          key={sb.book.id}
                          type="button"
                          onClick={() => { setSelectedBook(sb.book!); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-paper-50 text-left transition-colors"
                        >
                          <div className="w-6 h-9 rounded-md overflow-hidden flex-shrink-0 relative">
                            <BookCover src={sb.book.cover_url ?? undefined} title={sb.book.title} authors={sb.book.authors} fill className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ink-800 truncate">{sb.book.title}</p>
                            <p className="text-[10px] text-ink-400 truncate">{sb.book.authors?.[0]}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={pageNumber}
                onChange={e => setPageNumber(e.target.value)}
                placeholder="Page"
                min={1}
                className="w-20 px-3 py-2.5 bg-paper-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            {saveError && <p className="text-xs text-red-500 mb-3">{saveError}</p>}
            <button
              onClick={saveQuote}
              disabled={saving}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Quote'}
            </button>
          </div>
        )}

        {/* Search */}
        {quotes.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search quotes or books…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-ink-200 rounded-2xl text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>
        )}

        {/* Empty state */}
        {quotes.length === 0 && !showForm && (
          <div className="text-center py-16">
            <Quote className="w-12 h-12 mx-auto mb-3 text-ink-200" />
            <p className="font-medium text-ink-600 mb-1">No quotes yet</p>
            <p className="text-sm text-ink-400 mb-4">Save passages from books on your shelf</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add your first quote
            </button>
          </div>
        )}

        {/* Quotes list */}
        <div className="space-y-4">
          {filtered.map(q => (
            <div key={q.id} className="bg-white rounded-2xl border border-ink-100 p-5">
              <blockquote className="text-sm text-ink-700 italic leading-relaxed mb-3">
                &ldquo;{q.text}&rdquo;
                {q.page_number && (
                  <span className="not-italic text-ink-400 text-xs ml-2">— p.{q.page_number}</span>
                )}
              </blockquote>

              {q.books && (
                <Link
                  href={`/book/${q.books.id}`}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-12 rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm">
                    <BookCover
                      src={q.books.cover_url}
                      title={q.books.title}
                      authors={q.books.authors}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-800 truncate group-hover:text-brand-600 transition-colors">
                      {q.books.title}
                    </p>
                    <p className="text-[10px] text-ink-400">{q.books.authors?.[0]}</p>
                  </div>
                </Link>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-paper-100">
                <span className="text-[10px] text-ink-400">{timeAgo(q.created_at)}</span>
                <button
                  onClick={() => deleteQuote(q.id)}
                  className="text-ink-300 hover:text-red-400 transition-colors"
                  title="Delete quote"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && search && (
          <div className="text-center py-8 text-ink-400 text-sm">
            No quotes match &quot;{search}&quot;
          </div>
        )}
      </main>
    </div>
  );
}
