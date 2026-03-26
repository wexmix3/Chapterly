'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Plus, Check, Loader2, Camera, AlertCircle } from 'lucide-react';
import BookCover from '@/components/ui/BookCover';
import { useBookSearch, useShelf } from '@/hooks';
import type { BookSearchResult, ShelfStatus } from '@/types';
import dynamic from 'next/dynamic';

const ISBNScanner = dynamic(() => import('./ISBNScanner'), { ssr: false });

const SHELF_OPTIONS: { value: ShelfStatus; label: string }[] = [
  { value: 'to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'dnf', label: 'Did Not Finish' },
];

export default function BookSearch() {
  const { query, setQuery, results, loading, error: searchError } = useBookSearch();
  const { addBook } = useShelf();
  const router = useRouter();
  const [expanding, setExpanding] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleAdd = async (result: BookSearchResult, status: ShelfStatus) => {
    const key = result.source_id;
    setAdding(key);
    setAddErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    const res = await addBook(result, status);
    setAdding(null);
    setExpanding(null);
    if (res.ok || res.status === 409) {
      setAdded((prev) => new Set([...prev, key]));
    } else {
      const json = await res.json().catch(() => null);
      setAddErrors((prev) => ({ ...prev, [key]: json?.error ?? 'Failed to add book' }));
    }
  };

  return (
    <div className="space-y-4">
      {scannerOpen && (
        <ISBNScanner
          onDetected={(isbn) => { setQuery(isbn); setScannerOpen(false); }}
          onClose={() => setScannerOpen(false)}
        />
      )}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN…"
          className="w-full pl-11 pr-12 py-3 bg-white border border-ink-200 rounded-2xl text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        {loading
          ? <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 animate-spin" />
          : (
            <button onClick={() => setScannerOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              title="Scan ISBN barcode">
              <Camera className="w-4 h-4" />
            </button>
          )
        }
      </div>

      {searchError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {searchError}
        </div>
      )}

      {!searchError && results.length === 0 && query.length >= 2 && !loading && (
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
                {/* Cover — links to book preview */}
                {(() => {
                  const q = new URLSearchParams({ source: result.source, id: result.source_id, title: result.title, author: result.authors[0] ?? '' });
                  if (result.isbn13) q.set('isbn', result.isbn13);
                  const previewHref = `/book/preview?${q}`;
                  return (
                    <a href={previewHref} className="w-10 h-[60px] bg-paper-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm hover:opacity-90 transition-opacity relative">
                      <BookCover
                        src={result.cover_url}
                        title={result.title}
                        authors={result.authors}
                        fill
                        className="object-cover"
                      />
                    </a>
                  );
                })()}

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
                    <button
                      onClick={() => router.push('/dashboard?tab=reading')}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-colors">
                      <Check className="w-3 h-3" /> Added
                    </button>
                  ) : addErrors[key] ? (
                    <div className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium" title={addErrors[key]}>
                      <AlertCircle className="w-3 h-3" /> Error
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
                    {SHELF_OPTIONS.map(({ value, label }) => (
                      <button key={value}
                        onClick={() => handleAdd(result, value)}
                        disabled={isAdding}
                        className="flex items-center gap-2 p-2.5 bg-white border border-ink-100 hover:border-brand-300 hover:bg-brand-50/50 rounded-xl text-xs font-medium text-ink-700 transition-all disabled:opacity-50">
                        {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
