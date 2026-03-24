'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { Search, TrendingUp, BookOpen, Plus, Loader2 } from 'lucide-react';
import type { BookSearchResult } from '@/types';

const GENRES = [
  { name: 'Fantasy', emoji: '🧙', color: 'from-purple-100 to-purple-200' },
  { name: 'Romance', emoji: '💕', color: 'from-pink-100 to-rose-200' },
  { name: 'Thriller', emoji: '🔪', color: 'from-slate-100 to-slate-200' },
  { name: 'Sci-Fi', emoji: '🚀', color: 'from-blue-100 to-blue-200' },
  { name: 'Literary Fiction', emoji: '📝', color: 'from-amber-100 to-amber-200' },
  { name: 'Memoir', emoji: '✍️', color: 'from-orange-100 to-orange-200' },
  { name: 'Self-Help', emoji: '💡', color: 'from-yellow-100 to-yellow-200' },
  { name: 'Horror', emoji: '👻', color: 'from-red-100 to-red-200' },
  { name: 'Historical Fiction', emoji: '🏰', color: 'from-stone-100 to-stone-200' },
  { name: 'YA', emoji: '✨', color: 'from-emerald-100 to-emerald-200' },
  { name: 'Nonfiction', emoji: '📰', color: 'from-cyan-100 to-cyan-200' },
  { name: 'Romantasy', emoji: '🐉', color: 'from-violet-100 to-pink-200' },
];

const TRENDING_BOOKS = [
  { title: 'Fourth Wing', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg', label: '🔥 #BookTok', creator: '@cassiesbooktok' },
  { title: 'Iron Flame', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/isbn/9781649374172-M.jpg', label: '🔥 Sequel hype', creator: '@morgannbook' },
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', cover: 'https://covers.openlibrary.org/b/isbn/9781619635180-M.jpg', label: '👑 Classic pick', creator: '@cassiesbooktok' },
  { title: 'Happy Place', author: 'Emily Henry', cover: 'https://covers.openlibrary.org/b/isbn/9780593334867-M.jpg', label: '💕 Romance fave', creator: '@amyjordanj' },
  { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', cover: 'https://covers.openlibrary.org/b/isbn/9780385547345-M.jpg', label: '✨ Must-read', creator: '@morgannbook' },
  { title: 'The Housemaid', author: 'Freida McFadden', cover: 'https://covers.openlibrary.org/b/isbn/9781538742549-M.jpg', label: '🔪 Thriller of the year', creator: '@stressinabox' },
  { title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', cover: 'https://covers.openlibrary.org/b/isbn/9781524798659-M.jpg', label: '🎵 Summer read', creator: '@abbysbooks' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', cover: 'https://covers.openlibrary.org/b/isbn/9780593321201-M.jpg', label: '🕹️ Mind-bending', creator: '@booksandquills' },
];

const MUST_READS_2026 = [
  { title: 'The Women', author: 'Kristin Hannah', cover: 'https://covers.openlibrary.org/b/isbn/9781250178602-M.jpg' },
  { title: 'James', author: 'Percival Everett', cover: 'https://covers.openlibrary.org/b/isbn/9780385550369-M.jpg' },
  { title: 'The God of the Woods', author: 'Liz Moore', cover: 'https://covers.openlibrary.org/b/isbn/9780593473412-M.jpg' },
  { title: 'Intermezzo', author: 'Sally Rooney', cover: 'https://covers.openlibrary.org/b/isbn/9780374611712-M.jpg' },
  { title: 'All Fours', author: 'Miranda July', cover: 'https://covers.openlibrary.org/b/isbn/9781954118263-M.jpg' },
  { title: 'The Familiar', author: 'Leigh Bardugo', cover: 'https://covers.openlibrary.org/b/isbn/9781250885739-M.jpg' },
];

interface TrendingBook {
  book_id: string;
  count: number;
  book: {
    id: string;
    title: string;
    authors: string[];
    cover_url?: string | null;
  } | null;
}

export default function DiscoverClient() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreResults, setGenreResults] = useState<BookSearchResult[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [recs, setRecs] = useState<Array<BookSearchResult & { genre: string }>>([]);
  const [trendingBooks, setTrendingBooks] = useState<TrendingBook[] | null>(null);

  // Fetch personalized recommendations
  useEffect(() => {
    fetch('/api/recommendations')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setRecs(j.data ?? []))
      .catch(() => {});
  }, []);

  // Fetch real trending data
  useEffect(() => {
    fetch('/api/discover/trending')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => {
        const items: TrendingBook[] = j.data ?? [];
        if (items.length > 0) setTrendingBooks(items);
      })
      .catch(() => {});
  }, []);

  // Fetch genre results when genre is selected
  useEffect(() => {
    if (!selectedGenre) { setGenreResults([]); return; }
    setGenreLoading(true);
    fetch(`/api/books/search?q=subject:${encodeURIComponent(selectedGenre)}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setGenreResults((j.data ?? []).slice(0, 12)))
      .catch(() => setGenreResults([]))
      .finally(() => setGenreLoading(false));
  }, [selectedGenre]);

  const handleAdd = async (book: BookSearchResult) => {
    const key = book.source_id;
    if (adding || added.has(key)) return;
    setAdding(key);
    try {
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResult: book, status: 'to_read' }),
      });
      if (res.ok || res.status === 409) setAdded(prev => new Set(prev).add(key));
    } finally {
      setAdding(null);
    }
  };

  const topGenre = recs[0]?.genre ?? null;

  const toPreview = (title: string, author: string, cover: string) => {
    const isbnMatch = cover.match(/\/isbn\/(\d+)-/);
    const q = new URLSearchParams({ title, author });
    if (isbnMatch) q.set('isbn', isbnMatch[1]);
    router.push(`/book/preview?${q}`);
  };

  const toPreviewBook = (book: BookSearchResult) => {
    const q = new URLSearchParams({ source: book.source, id: book.source_id, title: book.title, author: book.authors[0] ?? '' });
    if (book.isbn13) q.set('isbn', book.isbn13);
    router.push(`/book/preview?${q}`);
  };

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-10">

          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-2">Discover</h1>
            <p className="text-ink-500 text-sm">Trending books, curated lists, and what BookTok is loving right now.</p>
          </div>

          {/* Trending on BookTok */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <h2 className="font-display text-lg font-semibold text-ink-800">Trending on BookTok 🔥</h2>
            </div>
            {trendingBooks && trendingBooks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {trendingBooks.map((item) => {
                  const b = item.book;
                  if (!b) return null;
                  return (
                    <BookCard
                      key={item.book_id}
                      title={b.title}
                      author={b.authors?.[0] ?? ''}
                      cover={b.cover_url ?? ''}
                      label={`🔥 ${item.count} reader${item.count !== 1 ? 's' : ''} this week`}
                      creator=""
                      onClick={() => toPreview(b.title, b.authors?.[0] ?? '', b.cover_url ?? '')}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {TRENDING_BOOKS.map(book => (
                  <BookCard key={book.title} {...book} onClick={() => toPreview(book.title, book.author, book.cover)} />
                ))}
              </div>
            )}
          </section>

          {/* Browse by Genre */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">Browse by Genre</h2>
            <div className="flex gap-2 flex-wrap">
              {GENRES.map(g => (
                <button
                  key={g.name}
                  onClick={() => setSelectedGenre(selectedGenre === g.name ? null : g.name)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedGenre === g.name
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  <span>{g.emoji}</span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>

            {selectedGenre && (
              <div className="mt-5">
                {genreLoading ? (
                  <div className="flex items-center gap-2 text-sm text-ink-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading {selectedGenre} books…
                  </div>
                ) : genreResults.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {genreResults.map(book => (
                      <ShelfableBook key={book.source_id} book={book} onAdd={handleAdd}
                        isAdded={added.has(book.source_id)} isAdding={adding === book.source_id}
                        onNavigate={() => toPreviewBook(book)} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-400 py-4">No results found for {selectedGenre}.</p>
                )}
              </div>
            )}
          </section>

          {/* 2026 Must-Reads */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">📚 2026 Must-Reads</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {MUST_READS_2026.map(book => (
                <button key={book.title} onClick={() => toPreview(book.title, book.author, book.cover)}
                  className="group text-left">
                  <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={book.cover} alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <p className="text-[10px] font-medium text-ink-800 truncate">{book.title}</p>
                  <p className="text-[9px] text-ink-400 truncate">{book.author}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Personalized — Because you read X */}
          {recs.length > 0 && topGenre && (
            <section>
              <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">
                💡 Because you read {topGenre}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {recs.slice(0, 10).map(book => (
                  <ShelfableBook key={book.source_id} book={book} onAdd={handleAdd}
                    isAdded={added.has(book.source_id)} isAdding={adding === book.source_id}
                    onNavigate={() => toPreviewBook(book)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function BookCard({ title, author, cover, label, creator, onClick }: {
  title: string; author: string; cover: string; label: string; creator: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group text-left w-full">
      <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow relative">
        <img src={cover} alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
          {label}
        </div>
      </div>
      <p className="text-xs font-medium text-ink-800 truncate">{title}</p>
      <p className="text-[9px] text-ink-400 truncate">{author}</p>
      <p className="text-[9px] text-brand-600 truncate mt-0.5">{creator}</p>
    </button>
  );
}

function ShelfableBook({ book, onAdd, isAdded, isAdding, onNavigate }: {
  book: BookSearchResult;
  onAdd: (b: BookSearchResult) => void;
  isAdded: boolean;
  isAdding: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex-shrink-0 w-28">
      <button onClick={onNavigate}
        className="w-full aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow-sm mb-2 hover:shadow-md transition-shadow block">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
            <BookOpen className="w-6 h-6 text-ink-300 mb-1" />
            <span className="text-[9px] text-ink-400 leading-tight line-clamp-3">{book.title}</span>
          </div>
        )}
      </button>
      <p className="text-[11px] font-medium text-ink-800 line-clamp-2 leading-tight mb-0.5">{book.title}</p>
      <p className="text-[9px] text-ink-400 mb-1.5 line-clamp-1 italic">{book.authors[0]}</p>
      <button
        onClick={() => onAdd(book)}
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
}
