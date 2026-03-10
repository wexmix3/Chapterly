'use client';

import { useState } from 'react';
import { BookOpen, Star, Loader2 } from 'lucide-react';
import { useShelf } from '@/hooks';
import type { ShelfStatus, UserBook } from '@/types';

const TABS: { value: ShelfStatus | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📚' },
  { value: 'reading', label: 'Reading', emoji: '📖' },
  { value: 'to_read', label: 'Want to Read', emoji: '🔖' },
  { value: 'read', label: 'Read', emoji: '✅' },
  { value: 'dnf', label: 'DNF', emoji: '🚫' },
];

export default function BookShelf() {
  const [activeTab, setActiveTab] = useState<ShelfStatus | 'all'>('all');
  const { books, loading } = useShelf(activeTab === 'all' ? undefined : activeTab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ value, label, emoji }) => (
          <button key={value} onClick={() => setActiveTab(value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === value
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-ink-100 text-ink-600 hover:border-brand-200 hover:bg-brand-50/50'
            }`}>
            <span>{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && books.length === 0 && (
        <div className="text-center py-16 text-ink-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-ink-600">No books here yet</p>
          <p className="text-sm mt-1">Search for books to add them to your shelf</p>
        </div>
      )}

      {/* Book grid */}
      {!loading && books.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {books.map((ub) => <BookCard key={ub.id} userBook={ub} />)}
        </div>
      )}
    </div>
  );
}

function BookCard({ userBook }: { userBook: UserBook }) {
  const { book } = userBook;
  const progress =
    userBook.current_page && book?.page_count
      ? Math.round((userBook.current_page / book.page_count) * 100)
      : null;

  return (
    <div className="group relative">
      {/* Cover */}
      <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
        {book?.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
            <BookOpen className="w-6 h-6 text-ink-300 mb-1" />
            <span className="text-[9px] text-ink-400 leading-tight line-clamp-3">{book?.title}</span>
          </div>
        )}

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

      {/* Title */}
      <p className="mt-1.5 text-[11px] font-medium text-ink-800 line-clamp-2 leading-tight">{book?.title}</p>
    </div>
  );
}
