'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import BookCover from '@/components/ui/BookCover';
import { Quote, Trash2, BookOpen, Search } from 'lucide-react';

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

interface Props {
  initialQuotes: QuoteEntry[];
}

export default function QuotesClient({ initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<QuoteEntry[]>(initialQuotes);
  const [search, setSearch] = useState('');

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
            <Quote className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-950">My Quotes</h1>
            <p className="text-sm text-ink-500">{quotes.length} saved passage{quotes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

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
        {quotes.length === 0 && (
          <div className="text-center py-16 text-ink-400">
            <Quote className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-ink-600 mb-1">No quotes yet</p>
            <p className="text-sm mb-4">Save passages from books on your shelf</p>
            <Link
              href="/dashboard?tab=reading"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Go to my shelf
            </Link>
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
