'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Star } from 'lucide-react';

interface FeedEvent {
  id: string;
  event_type: string;
  book_title: string;
  book_cover: string | null;
  rating: number | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function actionLabel(type: string) {
  if (type === 'finished') return 'finished';
  if (type === 'started_reading') return 'started reading';
  if (type === 'rated') return 'rated';
  return 'added';
}

export default function SocialPulse() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [following, setFollowing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feed')
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json) {
          setEvents((json.data ?? []).slice(0, 4));
          setFollowing(json.following ?? 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  // No-follows: nudge to find readers
  if (following === 0) {
    return (
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-display text-base font-semibold text-ink-800">Friends Activity</h2>
        </div>
        <p className="text-sm text-ink-500 mb-4 leading-relaxed">
          Follow other readers to see what your network is reading — live.
        </p>
        <div className="flex gap-2">
          <Link
            href="/people"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
          >
            Find Readers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-pink-200 text-rose-600 text-sm font-medium rounded-xl hover:bg-pink-50 transition-colors"
          >
            See Feed
          </Link>
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-paper-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-sm">
            <Users className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="font-display text-base font-semibold text-ink-800">Friends Activity</h2>
          {/* Live dot */}
          <span className="flex items-center gap-1 text-[10px] text-rose-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Live
          </span>
        </div>
        <Link
          href="/feed"
          className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
        >
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Activity items */}
      <div className="divide-y divide-paper-50/80">
        {events.map(event => (
          <div key={event.id} className="flex items-center gap-3 px-5 py-3.5">
            {/* Avatar */}
            {event.avatar_url ? (
              <img
                src={event.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center text-brand-700 text-xs font-bold">
                {event.display_name[0]?.toUpperCase()}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug text-ink-800">
                <span className="font-semibold">{event.display_name}</span>{' '}
                <span className="text-ink-400">{actionLabel(event.event_type)}</span>{' '}
                <span className="font-medium"
                  style={{ display: 'inline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {event.book_title}
                </span>
              </p>
              {event.event_type === 'rated' && event.rating && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(5, Math.round(event.rating)) }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
              <p className="text-[10px] text-ink-300 mt-0.5">{timeAgo(event.created_at)}</p>
            </div>

            {/* Book cover thumbnail */}
            {event.book_cover && (
              <div className="flex-shrink-0 w-8" style={{ aspectRatio: '2/3' }}>
                <img
                  src={event.book_cover}
                  alt=""
                  className="w-full h-full object-cover rounded-md shadow-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-paper-50/50 border-t border-paper-50">
        <Link
          href="/people"
          className="text-xs text-ink-400 hover:text-brand-600 transition-colors flex items-center gap-1"
        >
          <Users className="w-3 h-3" />
          Discover more readers
        </Link>
      </div>
    </div>
  );
}
