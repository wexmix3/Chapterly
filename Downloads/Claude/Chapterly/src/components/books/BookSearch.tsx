'use client';

import { useState } from 'react';
import { Search, BookOpen, Plus, Check, Loader2 } from 'lucide-react';
import { useBookSearch, useShelf } from '@/hooks';
import type { BookSearchResult, ShelfStatus } from '@/types';

const SHELF_OPTIONS: { value: ShelfStatus; label: string; emoji: string }[] = [
  { value: 'to_read', label: 'Want to Read', emoji: '📚' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'read', label: 'Read', emoji: '✅' },
  { value: 'dnf', label: 'Did Not Finish', emoji: '🚫' },
];

export default function BookSearch() {
  const { query, setQuery, results, loading } = useBookSearch();
  const { addBook } = useShelf();
  const [expanding, setExpanding] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAdd = async (result: BookSearchResult, status: ShelfStatus) => {
    const key = result.source_id;
    setAdding(key);
    const res = await addBook(result, status);
    setAdding(null);
    setExpanding(null);
    if (res.ok || res.status === 409) {
      setAdded((prev) => new Set([...prev, key]));
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-ink-200 rounded-2xl text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          autoFocus
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 animate-spin" />}
      </div>

      {results.length === 0 && query.length >= 2 && !loading && (
        <div className="text-center py-12 text-ink-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No books found for &quot;{query}&quot;</p>
        </div>
      )}

      {query.length === 0 && (
        <div className="text-center py-12 text-ink-400">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Start typing to search millions of books</p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((result) => {
          const key = result.source_id;
          const isAdded = added.has(key);
          const isExpanded = expanding === key;
          const isAdding = adding === key;

          return (
            <div key={key}
              className="bg-white rounded-2xl border border-ink-100 overflow-hidden transition-all">
              <div className="flex items-center gap-3 p-3">
                {/* Cover */}
                <div className="w-10 h-[60px] bg-paper-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                  {result.cover_url ? (
                    <img src={result.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-ink-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-ink-900 truncate">{result.title}</p>
                  <p className="text-xs text-ink-500 truncate">{result.authors.join(', ')}</p>
                  <div className="flex gap-2 mt-0.5">
                    {result.published_year && (
                      <span className="text-[10px] text-ink-400">{result.published_year}</span>
                    )}
                    {result.page_count && (
                      <span className="text-[10px] text-ink-400">{result.page_count}p</span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {isAdded ? (
                    <div className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium">
                      <Check className="w-3 h-3" /> Added
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpanding(isExpanded ? null : key)}
                      className="flex items-center gap-1 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-medium transition-colors">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
              </div>

              {/* Shelf picker (expanded) */}
              {isExpanded && (
                <div className="border-t border-ink-100 p-3 bg-paper-50">
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-2">Add to shelf</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SHELF_OPTIONS.map(({ value, label, emoji }) => (
                      <button key={value}
                        onClick={() => handleAdd(result, value)}
                        disabled={isAdding}
                        className="flex items-center gap-2 p-2.5 bg-white border border-ink-100 hover:border-brand-300 hover:bg-brand-50/50 rounded-xl text-xs font-medium text-ink-700 transition-all disabled:opacity-50">
                        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{emoji}</span>}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
