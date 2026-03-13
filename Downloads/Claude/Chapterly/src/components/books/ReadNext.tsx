'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import type { BookSearchResult } from '@/types';

interface RecommendedBook extends BookSearchResult {
  genre: string;
}

export default function ReadNext() {
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/recommendations')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setBooks(json.data ?? []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (book: RecommendedBook) => {
    const key = book.source_id;
    if (adding || added.has(key)) return;
    setAdding(key);
    try {
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResult: book, status: 'to_read' }),
      });
      if (res.ok || res.status === 409) {
        setAdded((prev) => new Set(prev).add(key));
      }
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-28 animate-pulse">
            <div className="aspect-[2/3] bg-paper-200 rounded-xl mb-2" />
            <div className="h-2.5 bg-paper-200 rounded mb-1.5" />
            <div className="h-2 bg-paper-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {books.map((book) => {
        const isAdded = added.has(book.source_id);
        const isAdding = adding === book.source_id;
        return (
          <div key={book.source_id} className="flex-shrink-0 w-28">
            <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow-sm mb-2">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <BookOpen className="w-6 h-6 text-ink-300 mb-1" />
                  <span className="text-[9px] text-ink-400 leading-tight line-clamp-3">{book.title}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] font-medium text-ink-800 line-clamp-2 leading-tight mb-0.5">
              {book.title}
            </p>
            <p className="text-[9px] text-ink-400 mb-1.5 line-clamp-1 italic">
              {book.genre}
            </p>

            <button
              onClick={() => handleAdd(book)}
              disabled={isAdded || isAdding}
              className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                isAdded
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100'
              }`}
            >
              {isAdding ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : isAdded ? (
                '✓ Added'
              ) : (
                <><Plus className="w-2.5 h-2.5" /> Want to Read</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
