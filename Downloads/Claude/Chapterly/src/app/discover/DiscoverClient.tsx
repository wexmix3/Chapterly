'use client';

import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Search, TrendingUp, BookOpen } from 'lucide-react';

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
  { title: 'Fourth Wing', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/id/14395680-M.jpg', label: '🔥 #BookTok', creator: '@cassiesbooktok' },
  { title: 'Iron Flame', author: 'Rebecca Yarros', cover: 'https://covers.openlibrary.org/b/id/14622285-M.jpg', label: '🔥 Sequel hype', creator: '@readingwithray' },
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', cover: 'https://covers.openlibrary.org/b/id/10521943-M.jpg', label: '👑 Classic pick', creator: '@pagebypageclub' },
  { title: 'Happy Place', author: 'Emily Henry', cover: 'https://covers.openlibrary.org/b/id/13357091-M.jpg', label: '💕 Romance fave', creator: '@booknerdvibes' },
  { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', cover: 'https://covers.openlibrary.org/b/id/12514019-M.jpg', label: '✨ Must-read', creator: '@morgannbook' },
  { title: 'The Housemaid', author: 'Freida McFadden', cover: 'https://covers.openlibrary.org/b/id/12716530-M.jpg', label: '🔪 Thriller of the year', creator: '@jack_edwards' },
  { title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', cover: 'https://covers.openlibrary.org/b/id/8736389-M.jpg', label: '🎵 Summer read', creator: '@aaborak' },
  { title: 'Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', cover: 'https://covers.openlibrary.org/b/id/12854803-M.jpg', label: '🕹️ Mind-bending', creator: '@itsemmajohnson' },
];

const MUST_READS_2026 = [
  { title: 'The Women', author: 'Kristin Hannah', cover: 'https://covers.openlibrary.org/b/id/14623890-M.jpg' },
  { title: 'James', author: 'Percival Everett', cover: 'https://covers.openlibrary.org/b/id/14812345-M.jpg' },
  { title: 'The God of the Woods', author: 'Liz Moore', cover: 'https://covers.openlibrary.org/b/id/14723456-M.jpg' },
  { title: 'Intermezzo', author: 'Sally Rooney', cover: 'https://covers.openlibrary.org/b/id/14934567-M.jpg' },
  { title: 'All Fours', author: 'Miranda July', cover: 'https://covers.openlibrary.org/b/id/14845678-M.jpg' },
  { title: 'The Familiar', author: 'Leigh Bardugo', cover: 'https://covers.openlibrary.org/b/id/14756789-M.jpg' },
];

export default function DiscoverClient() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-10">

          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-2">Discover</h1>
            <p className="text-ink-500 text-sm">Trending books, curated lists, and what BookTok is loving right now.</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              placeholder="Search by title or author…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white border border-ink-200 rounded-2xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          {/* Trending on BookTok */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <h2 className="font-display text-lg font-semibold text-ink-800">Trending on BookTok 🔥</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {TRENDING_BOOKS.map(book => (
                <BookCard key={book.title} {...book} />
              ))}
            </div>
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
              <div className="mt-6 p-6 bg-white rounded-2xl border border-ink-100 text-center">
                <p className="text-ink-500 text-sm mb-3">
                  Browsing <strong className="text-ink-800">{selectedGenre}</strong> — search coming soon
                </p>
                <a href="/dashboard?tab=search" className="text-sm text-brand-600 hover:underline font-medium">
                  Search books instead →
                </a>
              </div>
            )}
          </section>

          {/* 2026 Must-Reads */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">📚 2026 Must-Reads</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {MUST_READS_2026.map(book => (
                <div key={book.title} className="group">
                  <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={book.cover} alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <p className="text-[10px] font-medium text-ink-800 truncate">{book.title}</p>
                  <p className="text-[9px] text-ink-400 truncate">{book.author}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Because you read */}
          <section>
            <h2 className="font-display text-lg font-semibold text-ink-800 mb-4">💡 Because you read Fantasy</h2>
            <div className="bg-white rounded-2xl border border-ink-100 p-6 text-center">
              <BookOpen className="w-8 h-8 text-ink-300 mx-auto mb-3" />
              <p className="text-sm text-ink-500 mb-3">Add and rate books on your shelf to get personalized recommendations.</p>
              <a href="/dashboard?tab=search" className="inline-flex px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                Add books to your shelf
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function BookCard({ title, author, cover, label, creator }: {
  title: string; author: string; cover: string; label: string; creator: string;
}) {
  return (
    <div className="group cursor-pointer">
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
    </div>
  );
}
