'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import { UserPlus, Loader2, BookOpen, Search, X, UserCheck, Quote, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { FeedEventSkeleton } from '@/components/ui/Skeleton';

interface SuggestedUser {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  overlap: number;
}

interface FeedEvent {
  id: string;
  event_type: 'started_reading' | 'finished' | 'rated' | 'shared_card' | 'added_to_shelf' | 'wrote_review' | 'saved_quote';
  user_id: string;
  user_book_id: string | null;
  book_title: string;
  book_cover?: string;
  rating?: number;
  display_name: string;
  avatar_url?: string;
  handle?: string;
  created_at: string;
  review_text?: string;
  quote_text?: string;
}

interface UserResult {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  is_following: boolean;
}

const FEED_PAGE_SIZE = 15;

export default function FeedClient() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/feed')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setEvents(data.data);
        if (data?.following !== undefined) setFollowing(data.following);
        setLoading(false);
        // If no feed events, fetch suggested readers
        if (!data?.data?.length) {
          setSuggestionsLoading(true);
          fetch('/api/people/suggestions')
            .then(r => r.ok ? r.json() : null)
            .then(s => { if (s?.data) setSuggestions(s.data); })
            .finally(() => setSuggestionsLoading(false));
        }
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
      case 'wrote_review': return 'reviewed';
      case 'saved_quote': return 'saved a quote from';
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
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
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
            <EmptyFeed
              onFindReaders={() => setShowSearch(true)}
              suggestions={suggestions}
              suggestionsLoading={suggestionsLoading}
              onFollow={async (u) => {
                setSuggestions(prev => prev.map(s => s.id === u.id ? { ...s, _following: true } : s));
                await fetch('/api/social', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ followee_id: u.id }),
                });
                setFollowing(f => f + 1);
                // Refresh feed after follow
                const data = await fetch('/api/feed').then(r => r.ok ? r.json() : null);
                if (data?.data) setEvents(data.data);
              }}
            />
          )}

          {!loading && events.length > 0 && (
            <div className="space-y-3">
              {events.slice(0, visibleCount).map(event => (
                <FeedCard key={event.id} event={event} actionLabel={actionLabel(event.event_type)} timeAgo={timeAgo(event.created_at)} />
              ))}
              {visibleCount < events.length && (
                <button
                  onClick={() => setVisibleCount(c => c + FEED_PAGE_SIZE)}
                  className="w-full py-3 text-sm font-medium text-brand-600 hover:text-brand-700 bg-white border border-ink-100 hover:border-brand-200 rounded-2xl transition-colors"
                >
                  Load more ({events.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Feed comment thread ───────────────────────────────────────────────────────

interface FeedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: { display_name: string; avatar_url?: string | null; handle?: string | null } | null;
}

function FeedComments({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  // Fetch count on mount (cheap: just length of GET response)
  useEffect(() => {
    fetch(`/api/comments?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data) { setComments(j.data); setCount(j.data.length); } })
      .catch(() => {});
  }, [targetType, targetId]);

  const toggle = () => setOpen(v => !v);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, content: text.trim() }),
      });
      if (res.ok) {
        const j = await res.json();
        setComments(prev => [...prev, j.data]);
        setCount(c => (c ?? 0) + 1);
        setText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== id));
      setCount(c => Math.max(0, (c ?? 1) - 1));
    }
  };

  return (
    <div>
      <button
        onClick={toggle}
        className={`flex items-center gap-1 text-xs transition-colors ${open ? 'text-brand-600' : 'text-ink-300 hover:text-brand-500'}`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {count !== null && count > 0 ? count : ''}
      </button>

      {open && (
        <div className="mt-2 pl-1 border-l-2 border-ink-100 space-y-2">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-[11px] text-ink-400 italic">No comments yet — be the first!</p>
          )}

          {comments.map(c => (
            <div key={c.id} className="flex gap-2 group">
              <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-700 flex-shrink-0 mt-0.5">
                {c.user?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-ink-700">{c.user?.display_name ?? 'Reader'} </span>
                <span className="text-[11px] text-ink-500">{c.content}</span>
              </div>
              <button
                onClick={() => deleteComment(c.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-300 hover:text-red-500 transition-all flex-shrink-0"
                aria-label="Delete comment"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <form onSubmit={submit} className="flex gap-1.5 pt-1">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              className="flex-1 text-xs px-2.5 py-1.5 border border-ink-200 rounded-lg focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="p-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Derive target_type and target_id from event
  const targetType = event.id.startsWith('review-') ? 'review'
    : event.id.startsWith('quote-') ? 'quote'
    : 'user_book';
  const targetId = event.id.startsWith('review-') ? event.id.replace('review-', '')
    : event.id.startsWith('quote-') ? event.id.replace('quote-', '')
    : event.id;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    // Fetch initial like state
    fetch(`/api/reactions?target_type=${targetType}&target_id=${encodeURIComponent(targetId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setLiked(data.liked); setLikeCount(data.count); }
      })
      .catch(() => {});
  }, [targetId, targetType]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (liking) return;
    setLiking(true);
    // Optimistic update
    setLiked(prev => !prev);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.count);
      } else {
        // Revert
        setLiked(prev => !prev);
        setLikeCount(prev => liked ? prev + 1 : prev - 1);
      }
    } catch {
      setLiked(prev => !prev);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    } finally {
      setLiking(false);
    }
  };

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
          {(event.event_type === 'rated' || event.event_type === 'wrote_review') && event.rating && (
            <span className="ml-1 text-brand-500">{'★'.repeat(Math.floor(event.rating))}</span>
          )}
        </p>

        {event.event_type === 'wrote_review' && event.review_text && (
          <div className="mt-2 flex items-start gap-1.5">
            <Quote className="w-3.5 h-3.5 text-ink-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
              {event.review_text.length > 120
                ? `${event.review_text.slice(0, 120).trimEnd()}…`
                : event.review_text}
            </p>
          </div>
        )}

        {event.event_type === 'saved_quote' && event.quote_text && (
          <blockquote className="mt-2 border-l-2 border-brand-200 pl-3">
            <p className="text-xs text-ink-600 italic leading-relaxed line-clamp-3">
              &ldquo;{event.quote_text}&rdquo;
            </p>
          </blockquote>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-ink-400">{timeAgo}</p>
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-red-500' : 'text-ink-300 hover:text-red-400'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <FeedComments targetType={targetType} targetId={targetId} />
        </div>
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

function EmptyFeed({
  onFindReaders,
  suggestions,
  suggestionsLoading,
  onFollow,
}: {
  onFindReaders: () => void;
  suggestions: (SuggestedUser & { _following?: boolean })[];
  suggestionsLoading: boolean;
  onFollow: (u: SuggestedUser) => Promise<void>;
}) {
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const handleFollow = async (u: SuggestedUser) => {
    setFollowing(prev => new Set(prev).add(u.id));
    await onFollow(u);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-ink-100 p-6">
        <div className="text-center mb-6">
          <BookOpen className="w-10 h-10 text-ink-200 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-ink-800 mb-1">Your feed is empty</h3>
          <p className="text-sm text-ink-500">
            Follow readers to see what they&apos;re reading and discover new books.
          </p>
        </div>

        {suggestionsLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-ink-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Finding readers for you…
          </div>
        )}

        {!suggestionsLoading && suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Suggested readers</p>
            {suggestions.slice(0, 5).map(u => {
              const isFollowing = following.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
                      {u.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{u.display_name}</p>
                    <p className="text-xs text-ink-400 truncate">
                      {u.overlap > 0 ? `${u.overlap} book${u.overlap !== 1 ? 's' : ''} in common` : `@${u.handle}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(u)}
                    disabled={isFollowing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                      isFollowing
                        ? 'bg-ink-100 text-ink-500'
                        : 'bg-brand-500 text-white hover:bg-brand-600'
                    }`}>
                    {isFollowing
                      ? <><UserCheck className="w-3 h-3" /> Following</>
                      : <><UserPlus className="w-3 h-3" /> Follow</>}
                  </button>
                </div>
              );
            })}
            <button
              onClick={onFindReaders}
              className="w-full mt-2 py-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
              Search for more readers →
            </button>
          </div>
        )}

        {!suggestionsLoading && suggestions.length === 0 && (
          <button
            onClick={onFindReaders}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors mx-auto">
            <Search className="w-4 h-4" />
            Find readers to follow
          </button>
        )}
      </div>

      {/* Ghost preview */}
      <div className="opacity-30 pointer-events-none space-y-3">
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
      <p className="text-center text-xs text-ink-400">Your feed will look like this once you follow readers</p>
    </div>
  );
}
