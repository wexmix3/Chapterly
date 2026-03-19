'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { Users, Plus, BookOpen, Globe, Lock, Loader2, X, Search } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  member_count: number;
  owner: { handle: string; display_name: string; avatar_url?: string | null } | null;
  book?: { title: string; authors: string[]; cover_url?: string | null } | null;
}

export default function ClubsClient() {
  const router = useRouter();
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/clubs').then(r => r.json()),
      fetch('/api/clubs?mine=true').then(r => r.json()),
    ]).then(([pub, mine]) => {
      setClubs(pub.data ?? []);
      setMyClubs(mine.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = (tab === 'discover' ? clubs : myClubs).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper-50">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900">Book Clubs</h1>
              <p className="text-sm text-ink-500 mt-0.5">Read together, discuss together.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Club
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-paper-100 rounded-xl p-1">
            {(['discover', 'mine'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {t === 'discover' ? 'Discover Clubs' : `My Clubs (${myClubs.length})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-paper-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="w-10 h-10 text-ink-200 mx-auto" />
              <p className="text-ink-400 text-sm">
                {tab === 'mine' ? "You haven't joined any clubs yet." : 'No clubs found.'}
              </p>
              {tab === 'mine' && (
                <button onClick={() => setTab('discover')} className="text-brand-600 text-sm hover:underline">
                  Discover clubs →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(club => (
                <ClubCard key={club.id} club={club} onClick={() => router.push(`/clubs/${club.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} onCreate={(id) => router.push(`/clubs/${id}`)} />}
    </div>
  );
}

function ClubCard({ club, onClick }: { club: Club; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-paper-200 hover:shadow-md transition-shadow">
      <div className="flex gap-3 items-start">
        {/* Club avatar / book cover */}
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-200 to-brand-400 flex items-center justify-center shadow-sm">
          {club.book?.cover_url ? (
            <img src={club.book.cover_url} alt={club.book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-ink-900 text-sm truncate">{club.name}</p>
            {!club.is_public && <Lock className="w-3 h-3 text-ink-400 flex-shrink-0" />}
          </div>
          {club.description && (
            <p className="text-xs text-ink-500 line-clamp-2 mb-2">{club.description}</p>
          )}
          {club.book && (
            <p className="text-[11px] text-brand-600 font-medium truncate">
              Reading: {club.book.title}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-ink-500">
            <Users className="w-3 h-3" />
            <span>{club.member_count}</span>
          </div>
          {club.is_public ? (
            <Globe className="w-3 h-3 text-ink-300" />
          ) : (
            <Lock className="w-3 h-3 text-ink-300" />
          )}
        </div>
      </div>
    </button>
  );
}

function CreateClubModal({ onClose, onCreate }: { onClose: () => void; onCreate: (id: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Club name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, is_public: isPublic }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to create club.'); return; }
      onCreate(json.data.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink-900">Create a Book Club</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600 block mb-1">Club name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Sunday Sci-Fi Club"
              className="w-full px-4 py-2.5 border border-paper-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600 block mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="What does your club read?"
              className="w-full px-4 py-2.5 border border-paper-200 rounded-xl text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-paper-50 rounded-xl border border-paper-200">
            <div className="flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4 text-brand-500" /> : <Lock className="w-4 h-4 text-ink-400" />}
              <div>
                <p className="text-sm font-medium text-ink-800">{isPublic ? 'Public club' : 'Private club'}</p>
                <p className="text-xs text-ink-400">{isPublic ? 'Anyone can find & join' : 'Invite only'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsPublic(p => !p)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-brand-500' : 'bg-ink-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !name.trim()}
          className="w-full mt-5 bg-brand-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Club
        </button>
      </div>
    </div>
  );
}
