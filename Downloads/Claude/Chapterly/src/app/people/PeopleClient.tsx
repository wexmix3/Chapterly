'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { Search, UserPlus, UserCheck, Loader2, Users, BookOpen } from 'lucide-react';

interface UserResult {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  is_following?: boolean;
  overlap?: number;
}

function UserCard({
  user,
  onFollowToggle,
  followLoading,
  onNavigate,
}: {
  user: UserResult;
  onFollowToggle: (id: string, currently: boolean) => void;
  followLoading: string | null;
  onNavigate: () => void;
}) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-paper-200">
      <button onClick={onNavigate} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-sm">{user.display_name[0]}</span>}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">{user.display_name}</p>
          <p className="text-xs text-ink-400">@{user.handle}</p>
          {(user.overlap ?? 0) > 0 && (
            <p className="text-[10px] text-brand-600 mt-0.5 flex items-center gap-1">
              <BookOpen className="w-2.5 h-2.5" />
              {user.overlap} book{(user.overlap ?? 0) !== 1 ? 's' : ''} in common
            </p>
          )}
        </div>
      </button>
      <button
        onClick={() => onFollowToggle(user.id, !!user.is_following)}
        disabled={followLoading === user.id}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
          user.is_following
            ? 'bg-paper-100 text-ink-600 hover:bg-red-50 hover:text-red-600 border border-paper-200'
            : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
        }`}
      >
        {followLoading === user.id ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : user.is_following ? (
          <><UserCheck className="w-3 h-3" /> Following</>
        ) : (
          <><UserPlus className="w-3 h-3" /> Follow</>
        )}
      </button>
    </div>
  );
}

export default function PeopleClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [suggestions, setSuggestions] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // Load follow suggestions on mount
  useEffect(() => {
    fetch('/api/people/suggestions')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setSuggestions(j.data ?? []));
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.data ?? []);
        // Seed following state from results
        const followingFromResults = (json.data ?? [])
          .filter((u: UserResult) => u.is_following)
          .map((u: UserResult) => u.id);
        setFollowing(prev => new Set([...prev, ...followingFromResults]));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleFollowToggle = useCallback(async (userId: string, currentlyFollowing: boolean) => {
    setFollowLoading(userId);
    try {
      const method = currentlyFollowing ? 'DELETE' : 'POST';
      const res = await fetch('/api/social', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followee_id: userId }),
      });
      if (res.ok) {
        setFollowing(prev => {
          const next = new Set(prev);
          currentlyFollowing ? next.delete(userId) : next.add(userId);
          return next;
        });
        // Update both lists
        const patchFollowing = (list: UserResult[]) =>
          list.map(u => u.id === userId ? { ...u, is_following: !currentlyFollowing } : u);
        setResults(patchFollowing);
        setSuggestions(patchFollowing);
      }
    } finally {
      setFollowLoading(null);
    }
  }, []);

  const enrichedResults = results.map(u => ({ ...u, is_following: following.has(u.id) }));
  const enrichedSuggestions = suggestions.map(u => ({ ...u, is_following: following.has(u.id) }));

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-lg mx-auto px-4 md:px-8 pt-6 space-y-6">

          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">People</h1>
            <p className="text-sm text-ink-500 mt-0.5">Find readers who share your taste.</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand-400" />}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or @handle..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-paper-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          {/* Search results */}
          {query.length >= 2 && (
            <section>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Search Results</p>
              {enrichedResults.length === 0 && !searching ? (
                <p className="text-sm text-ink-400 py-4 text-center">No readers found for &ldquo;{query}&rdquo;</p>
              ) : (
                <div className="space-y-2">
                  {enrichedResults.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onFollowToggle={handleFollowToggle}
                      followLoading={followLoading}
                      onNavigate={() => router.push(`/u/${u.handle}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Suggestions */}
          {query.length < 2 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-semibold text-ink-800">Readers like you</p>
              </div>
              {enrichedSuggestions.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Users className="w-8 h-8 text-ink-200 mx-auto" />
                  <p className="text-sm text-ink-400">Add more books to get personalized suggestions.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrichedSuggestions.map(u => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onFollowToggle={handleFollowToggle}
                      followLoading={followLoading}
                      onNavigate={() => router.push(`/u/${u.handle}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
