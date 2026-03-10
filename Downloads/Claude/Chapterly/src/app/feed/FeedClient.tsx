'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/Navigation';
import { UserPlus, Loader2, BookOpen, Search } from 'lucide-react';

interface FeedEvent {
  id: string;
  event_type: 'started_reading' | 'finished' | 'rated' | 'shared_card' | 'added_to_shelf';
  user_id: string;
  book_title: string;
  book_cover?: string;
  rating?: number;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export default function FeedClient() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(0);

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
            <button className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Find readers</span>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          )}

          {!loading && events.length === 0 && (
            <EmptyFeed />
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

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-start gap-4">
      {event.avatar_url ? (
        <img src={event.avatar_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold flex-shrink-0">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-ink-900">{event.display_name}</span>
          {' '}{actionLabel}{' '}
          <span className="font-medium text-ink-900">{event.book_title}</span>
          {event.event_type === 'rated' && event.rating && (
            <span className="ml-1 text-brand-500">{'★'.repeat(Math.floor(event.rating))}</span>
          )}
        </p>
        <p className="text-xs text-ink-400 mt-0.5">{timeAgo}</p>
      </div>
      {event.book_cover && (
        <div className="w-10 h-14 bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
          <img src={event.book_cover} alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
        <BookOpen className="w-10 h-10 text-ink-200 mx-auto mb-4" />
        <h3 className="font-display font-semibold text-ink-800 mb-2">No activity yet</h3>
        <p className="text-sm text-ink-500 mb-6">
          Follow other readers to see what they&apos;re reading, ratings they&apos;ve given, and reading cards they&apos;ve shared.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors">
            <Search className="w-4 h-4" />
            Find readers to follow
          </button>
        </div>
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
