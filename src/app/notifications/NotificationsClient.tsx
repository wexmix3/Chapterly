'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/layout/Navigation';
import { Bell, UserPlus, BookOpen, CheckCheck } from 'lucide-react';
import { NotifSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'new_follower' | 'friend_finished' | 'club_invite' | 'challenge_complete' | string;
  read: boolean;
  created_at: string;
  actor?: {
    display_name: string;
    avatar_url: string | null;
    handle: string;
  };
  data?: Record<string, string>;
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'new_follower') return <UserPlus className="w-4 h-4 text-brand-500" />;
  if (type === 'friend_finished') return <BookOpen className="w-4 h-4 text-emerald-500" />;
  return <Bell className="w-4 h-4 text-ink-400" />;
}

function notifText(n: Notification) {
  const actor = n.actor?.display_name ?? 'Someone';
  if (n.type === 'new_follower') return `${actor} started following you`;
  if (n.type === 'friend_finished') return `${actor} finished ${n.data?.book_title ?? 'a book'}`;
  return n.data?.message ?? 'You have a new notification';
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markAllRead = async () => {
    setMarking(true);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarking(false);
  };

  const markRead = async (id: string) => {
    if (notifications.find(n => n.id === id)?.read) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900">Notifications</h1>
              {unread > 0 && (
                <p className="text-sm text-ink-500 mt-0.5">{unread} unread</p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => <NotifSkeleton key={i} />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 bg-paper-200 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-ink-300" />
              </div>
              <p className="font-medium text-ink-600">All caught up</p>
              <p className="text-sm text-ink-400">Notifications about your followers and reading activity will appear here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-default ${
                    n.read
                      ? 'bg-white border-ink-100'
                      : 'bg-brand-50 border-brand-100'
                  }`}
                >
                  {/* Actor avatar or icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {n.actor?.avatar_url ? (
                      <Link href={`/u/${n.actor.handle}`} onClick={e => e.stopPropagation()}>
                        <img
                          src={n.actor.avatar_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-paper-200 flex items-center justify-center">
                        <NotifIcon type={n.type} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-ink-700' : 'text-ink-900 font-medium'}`}>
                      {notifText(n)}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
