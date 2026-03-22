'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import { UserPlus, Loader2, BookOpen, Search, X, UserCheck } from 'lucide-react';
import { FeedEventSkeleton } from '@/components/ui/Skeleton';

interface FeedEvent {
  id: string;
  event_type: 'started_reading' | 'finished' | 'rated' | 'shared_card' | 'added_to_shelf';
  user_id: string;
  user_book_id: string;
  book_title: string;
  book_cover?: string;
  rating?: number;
  display_name: string;
  avatar_url?: string;
  handle?: string;
  created_at: string;
}

interface UserResult {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  is_following: boolean;
}

export default function FeedClient() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/feed')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setEvents(data.data);
        if (data?.following !== undefined) setFollowing(data.following);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounced user search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data ?? []);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const toggleFollow = useCallback(async (u: UserResult) => {
    setToggling(u.id);
    try {
      const method = u.is_following ? 'DELETE' : 'POST';
      const res = await fetch('/api/social', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followee_id: u.id }),
      });
      if (res.ok || res.status === 409) {
        setSearchResults(prev => prev.map(r =>
          r.id === u.id ? { ...r, is_following: !u.is_following } : r
        ));
        setFollowing(f => u.is_following ? f - 1 : f + 1);
      }
    } finally {
      setToggling(null);
    }
  }, []);

  const actionLabel = (type: FeedEvent['event_type']) => {
    switch (type) {
      case 'started_reading': return 'started reading';
      case 'finished': return 'finished reading';
      case 'rated': return 'rated';
      case 'shared_card': return 'shared a card for';
      case 'added_to_shelf': return 'added to their shelf';
      default: return 'updated';
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">Friends&apos; Reading</h1>
              <p className="text-ink-500 text-sm mt-1">
                {following > 0 ? `Following ${following} reader${following !== 1 ? 's' : ''}` : 'Follow readers to see their activity here'}
              </p>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
              {showSearch ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span className="hidden sm:inline">{showSearch ? 'Close' : 'Find readers'}</span>
            </button>
          </div>

          {/* User search panel */}
          {showSearch && (
            <div className="bg-white rounded-2xl border border-ink-100 p-4 space-y-3">
              <h2 className="font-display font-semibold text-ink-800 text-sm">Find Readers</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or @handle…"
                  className="w-full pl-9 pr-4 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand-300 transition-colors"
                />
              </div>

              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-ink-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                </div>
              )}

              {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-ink-400 py-2">No readers found for &ldquo;{searchQuery}&rdquo;</p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
                          {u.display_name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">{u.display_name}</p>
                        <p className="text-xs text-ink-400 truncate">@{u.handle}</p>
                      </div>
                      <button
                        onClick={() => toggleFollow(u)}
                        disabled={toggling === u.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                          u.is_following
                            ? 'bg-ink-100 text-ink-600 hover:bg-red-50 hover:text-red-600'
                            : 'bg-brand-500 text-white hover:bg-brand-600'
                        }`}>
                        {toggling === u.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : u.is_following
                            ? <><UserCheck className="w-3 h-3" /> Following</>
                            : <><UserPlus className="w-3 h-3" /> Follow</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length < 2 && (
                <p className="text-xs text-ink-400">Type at least 2 characters to search</p>
              )}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <FeedEventSkeleton key={i} />)}
            </div>
          )}

          {!loading && events.length === 0 && (
            <EmptyFeed onFindReaders={() => setShowSearch(true)} />
          )}

          {!loading && events.length > 0 && (
            <div className="space-y-3">
              {events.map(event => (
                <FeedCard key={event.id} event={event} actionLabel={actionLabel(event.event_type)} timeAgo={timeAgo(event.created_at)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FeedCard({ event, actionLabel, timeAgo }: {
  event: FeedEvent;
  actionLabel: string;
  timeAgo: string;
}) {
  const initials = event.display_name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const profileHref = event.handle ? `/u/${event.handle}` : null;
  const bookHref = event.user_book_id ? `/book/${event.user_book_id}` : null;

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-start gap-4">
      {profileHref ? (
        <Link href={profileHref} className="flex-shrink-0">
          {event.avatar_url ? (
            <img src={event.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
              {initials}
            </div>
          )}
        </Link>
      ) : (
        event.avatar_url ? (
          <img src={event.avatar_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
            {initials}
          </div>
        )
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-700">
          {profileHref ? (
            <Link href={profileHref} className="font-semibold text-ink-900 hover:text-brand-600 transition-colors">{event.display_name}</Link>
          ) : (
            <span className="font-semibold text-ink-900">{event.display_name}</span>
          )}
          {' '}{actionLabel}{' '}
          {bookHref ? (
            <Link href={bookHref} className="font-medium text-ink-900 hover:text-brand-600 transition-colors">{event.book_title}</Link>
          ) : (
            <span className="font-medium text-ink-900">{event.book_title}</span>
          )}
          {event.event_type === 'rated' && event.rating && (
            <span className="ml-1 text-brand-500">{'★'.repeat(Math.floor(event.rating))}</span>
          )}
        </p>
        <p className="text-xs text-ink-400 mt-0.5">{timeAgo}</p>
      </div>
      {event.book_cover && bookHref && (
        <Link href={bookHref} className="flex-shrink-0">
          <div className="w-10 h-14 bg-paper-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
            <img src={event.book_cover} alt="" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        </Link>
      )}
      {event.book_cover && !bookHref && (
        <div className="w-10 h-14 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
          <img src={event.book_cover} alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

function EmptyFeed({ onFindReaders }: { onFindReaders: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
        <BookOpen className="w-10 h-10 text-ink-200 mx-auto mb-4" />
        <h3 className="font-display font-semibold text-ink-800 mb-2">No activity yet</h3>
        <p className="text-sm text-ink-500 mb-6">
          Follow other readers to see what they&apos;re reading, ratings they&apos;ve given, and reading cards they&apos;ve shared.
        </p>
        <button
          onClick={onFindReaders}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors mx-auto">
          <Search className="w-4 h-4" />
          Find readers to follow
        </button>
      </div>

      {/* What the feed will look like */}
      <div className="opacity-40 pointer-events-none space-y-3">
        {[
          { name: 'Alex R.', action: 'finished reading', book: 'Fourth Wing', rating: 5 },
          { name: 'Jamie L.', action: 'started reading', book: 'Iron Flame', rating: null },
          { name: 'Sam K.', action: 'rated', book: 'Atomic Habits', rating: 5 },
        ].map((e, i) => (
          <div key={i} className="bg-white rounded-2xl border border-ink-100 p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
              {e.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink-700">
                <span className="font-semibold text-ink-900">{e.name}</span> {e.action}{' '}
                <span className="font-medium text-ink-900">{e.book}</span>
                {e.rating && <span className="ml-1 text-brand-500">{'★'.repeat(e.rating)}</span>}
              </p>
              <p className="text-xs text-ink-400 mt-0.5">2h ago</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ink-400">Your feed will look like this when you follow readers</p>
    </div>
  );
}
