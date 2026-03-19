'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { BookOpen, ArrowLeft, Share2, Globe, Lock, Loader2, Link as LinkIcon } from 'lucide-react';

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

export default function ListDetailClient({ listId, viewerId }: { listId: string; viewerId: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 flex items-center justify-center">
        <Navigation />
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-paper-50">
        <Navigation />
        <main className="md:ml-64 flex items-center justify-center min-h-[80vh]">
          <p className="text-ink-400">List not found.</p>
        </main>
      </div>
    );
  }

  const { list, books, is_owner } = data;
  const owner = list.owner;

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-6">

          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* List header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-paper-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {list.is_public ? <Globe className="w-3.5 h-3.5 text-ink-400" /> : <Lock className="w-3.5 h-3.5 text-ink-400" />}
                  <span className="text-xs text-ink-400">{list.is_public ? 'Public list' : 'Private list'}</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-ink-900">{list.title}</h1>
                {list.description && <p className="text-sm text-ink-500 mt-1.5">{list.description}</p>}
                <div className="flex items-center gap-2 mt-3">
                  {owner?.avatar_url && (
                    <img src={owner.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <button
                    onClick={() => owner && router.push(`/u/${owner.handle}`)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    by @{owner?.handle}
                  </button>
                  <span className="text-xs text-ink-400">· {list.book_count} book{list.book_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-paper-100 rounded-xl text-xs font-medium text-ink-600 hover:bg-paper-200 transition-colors border border-paper-200 flex-shrink-0"
              >
                {copied ? <><LinkIcon className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
              </button>
            </div>
          </div>

          {/* Books grid */}
          {books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-ink-200 mx-auto mb-2" />
              <p className="text-sm text-ink-400">No books in this list yet.</p>
              {is_owner && (
                <p className="text-xs text-brand-600 mt-1">Add books from any book detail page.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((entry, i) => {
                const book = entry.book;
                if (!book) return null;
                return (
                  <div key={i} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-paper-200">
                    <div className="flex-shrink-0 text-center">
                      <span className="text-xs font-bold text-ink-400">#{i + 1}</span>
                    </div>
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-paper-200 shadow-sm">
                      {book.cover_url
                        ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-ink-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 text-sm">{book.title}</p>
                      <p className="text-xs text-ink-400">{book.authors[0]}</p>
                      {book.page_count && <p className="text-xs text-ink-400 mt-0.5">{book.page_count} pages</p>}
                      {entry.note && (
                        <p className="text-xs text-ink-600 mt-2 italic bg-paper-50 rounded-lg px-3 py-2 border border-paper-100">
                          &ldquo;{entry.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA for non-logged-in */}
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
