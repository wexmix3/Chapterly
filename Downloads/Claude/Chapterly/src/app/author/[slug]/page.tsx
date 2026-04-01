'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Link from 'next/link';
import BookCover from '@/components/ui/BookCover';
import { ArrowLeft, BookOpen, ExternalLink, Loader2, Star, Users } from 'lucide-react';

interface AuthorBook {
  id: string;
  title: string;
  cover_url: string | null;
  published_year: number | null;
  description: string | null;
  // user-specific
  user_book_id?: string | null;
  status?: string | null;
  rating?: number | null;
}

interface AuthorInfo {
  name: string;
  bio: string | null;
  photo_url: string | null;
  books_count: number | null;
  wikipedia_url: string | null;
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function AuthorPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.slug as string) ?? '';
  const authorName = slugToName(slug);

  const [authorInfo, setAuthorInfo] = useState<AuthorInfo | null>(null);
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch books by this author from Google Books API
        const gbRes = await fetch(
          `/api/books/search?q=${encodeURIComponent('inauthor:' + authorName)}&limit=20`
        );
        const gbJson = gbRes.ok ? await gbRes.json() : { data: [] };
        const gbBooks: AuthorBook[] = (gbJson.data ?? []).map((b: {
          id?: string; source_id?: string; title: string; cover_url?: string | null;
          published_year?: number | null; description?: string | null;
        }) => ({
          id: b.id ?? b.source_id ?? '',
          title: b.title,
          cover_url: b.cover_url ?? null,
          published_year: b.published_year ?? null,
          description: b.description ?? null,
        }));

        setBooks(gbBooks);

        // Build author info from first book result + Open Library author lookup
        const firstBook = gbJson.data?.[0];
        setAuthorInfo({
          name: authorName,
          bio: firstBook?.author_bio ?? null,
          photo_url: null,
          books_count: gbBooks.length,
          wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(authorName.replace(/ /g, '_'))}`,
        });

        // Try to get richer bio from Open Library
        fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}&limit=1`)
          .then(r => r.ok ? r.json() : null)
          .then(async olData => {
            const key = olData?.docs?.[0]?.key;
            if (!key) return;
            const authorData = await fetch(`https://openlibrary.org${key}.json`).then(r => r.ok ? r.json() : null);
            if (!authorData) return;
            const bio = typeof authorData.bio === 'string'
              ? authorData.bio
              : authorData.bio?.value ?? null;
            const photoId = authorData.photos?.[0];
            const photo_url = photoId && photoId > 0
              ? `https://covers.openlibrary.org/a/id/${photoId}-M.jpg`
              : null;
            const workCount = olData.docs?.[0]?.work_count ?? null;
            setAuthorInfo(prev => prev ? { ...prev, bio, photo_url, books_count: workCount } : prev);
          })
          .catch(() => {});

      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorName]);

  const addToShelf = async (book: AuthorBook) => {
    const key = book.id;
    setAddingId(key);
    try {
      const res = await fetch('/api/user-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchResult: { ...book, source_id: book.id },
          status: 'to_read',
        }),
      });
      if (res.ok || res.status === 409) {
        setAddedIds(prev => new Set([...prev, key]));
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6">

          <button onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Author hero */}
              <div className="bg-white rounded-2xl border border-ink-100 p-6 flex gap-5">
                {authorInfo?.photo_url ? (
                  <img
                    src={authorInfo.photo_url}
                    alt={authorInfo.name}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-ink-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-brand-700">
                    {authorInfo?.name.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">{authorInfo?.name}</h1>
                  <div className="flex flex-wrap gap-3 mb-3 text-xs text-ink-500">
                    {authorInfo?.books_count != null && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {authorInfo.books_count} works
                      </span>
                    )}
                  </div>
                  {authorInfo?.bio && (
                    <p className="text-sm text-ink-600 leading-relaxed line-clamp-4">{authorInfo.bio}</p>
                  )}
                  {authorInfo?.wikipedia_url && (
                    <a
                      href={authorInfo.wikipedia_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Wikipedia
                    </a>
                  )}
                </div>
              </div>

              {/* Books grid */}
              <div>
                <h2 className="font-display font-semibold text-ink-800 mb-4">
                  Books by {authorInfo?.name}
                </h2>

                {books.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
                    <BookOpen className="w-8 h-8 text-ink-200 mx-auto mb-3" />
                    <p className="text-sm text-ink-500">No books found for this author.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {books.map(book => {
                      const added = addedIds.has(book.id);
                      return (
                        <div key={book.id} className="group">
                          <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden mb-2 relative shadow-sm hover:shadow-md transition-shadow">
                            {book.cover_url ? (
                              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-ink-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-ink-800 leading-tight mb-1 line-clamp-2">{book.title}</p>
                          {book.published_year && (
                            <p className="text-[10px] text-ink-400 mb-1.5">{book.published_year}</p>
                          )}
                          <button
                            onClick={() => addToShelf(book)}
                            disabled={added || addingId === book.id}
                            className={`w-full py-1 rounded-lg text-[11px] font-medium transition-all ${
                              added
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-100'
                            }`}
                          >
                            {addingId === book.id
                              ? <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              : added ? 'Added!' : '+ Want to Read'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuthorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <AuthorPageContent />
    </Suspense>
  );
}
