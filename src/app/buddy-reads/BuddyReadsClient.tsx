'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/layout/Navigation';
import BookCover from '@/components/ui/BookCover';
import { Users, Check, X, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';
import Link from 'next/link';

interface BuddyReadUser {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  handle: string;
}

interface Checkpoint {
  id: string;
  user_id: string;
  page?: number | null;
  note?: string | null;
  created_at: string;
  users?: { display_name: string; avatar_url?: string | null };
}

interface BuddyRead {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  target_date?: string | null;
  created_at: string;
  updated_at: string;
  book_id: string;
  books: { id: string; title: string; authors: string[]; cover_url?: string | null; page_count?: number | null };
  inviter: BuddyReadUser;
  invitee: BuddyReadUser;
  checkpoints?: Checkpoint[];
}

function Avatar({ user }: { user: { display_name: string; avatar_url?: string | null } }) {
  return user.avatar_url
    ? <img src={user.avatar_url} alt={user.display_name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
    : <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center border-2 border-white">{user.display_name[0]}</span>;
}

function BuddyReadCard({ br, userId, onUpdate }: { br: BuddyRead; userId: string; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[] | null>(null);
  const [newPage, setNewPage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [posting, setPosting] = useState(false);
  const [actioning, setActioning] = useState(false);

  const isInviter = br.inviter.id === userId;
  const partner = isInviter ? br.invitee : br.inviter;

  const loadCheckpoints = useCallback(async () => {
    const r = await fetch(`/api/buddy-reads/${br.id}/checkpoints`);
    if (r.ok) {
      const j = await r.json();
      setCheckpoints(j.data ?? []);
    }
  }, [br.id]);

  useEffect(() => {
    if (expanded && checkpoints === null) loadCheckpoints();
  }, [expanded, checkpoints, loadCheckpoints]);

  const handleAction = async (status: 'accepted' | 'declined' | 'completed') => {
    setActioning(true);
    await fetch(`/api/buddy-reads/${br.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActioning(false);
    onUpdate();
  };

  const postCheckpoint = async () => {
    if (!newPage && !newNote.trim()) return;
    setPosting(true);
    const r = await fetch(`/api/buddy-reads/${br.id}/checkpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: newPage ? parseInt(newPage, 10) : undefined, note: newNote.trim() || undefined }),
    });
    if (r.ok) {
      setNewPage('');
      setNewNote('');
      await loadCheckpoints();
    }
    setPosting(false);
  };

  const statusBadge: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    declined: 'bg-red-50 text-red-600 border-red-200',
    completed: 'bg-ink-100 text-ink-500 border-ink-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Cover */}
          <Link href={`/book/${br.book_id}`} className="flex-shrink-0 w-16">
            <div className="aspect-[2/3] bg-paper-200 rounded-xl overflow-hidden shadow relative">
              <BookCover src={br.books.cover_url} title={br.books.title} authors={br.books.authors} fill className="object-cover" />
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link href={`/book/${br.book_id}`} className="font-display text-sm font-semibold text-ink-900 leading-tight hover:text-brand-600 line-clamp-2">
                {br.books.title}
              </Link>
              <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge[br.status]}`}>
                {br.status}
              </span>
            </div>
            <p className="text-xs text-ink-400 mb-2 italic">{br.books.authors[0]}</p>

            <div className="flex items-center gap-2 mb-3">
              <Avatar user={isInviter ? br.inviter : br.invitee} />
              <span className="text-xs text-ink-500">You</span>
              <span className="text-xs text-ink-300">+</span>
              <Avatar user={partner} />
              <span className="text-xs text-ink-500">{partner.display_name}</span>
            </div>

            {br.target_date && (
              <p className="text-[10px] text-ink-400 flex items-center gap-1 mb-3">
                <Clock className="w-3 h-3" /> Target: {new Date(br.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            {/* Actions */}
            {br.status === 'pending' && !isInviter && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('accepted')}
                  disabled={actioning}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all"
                >
                  <Check className="w-3 h-3" /> Accept
                </button>
                <button
                  onClick={() => handleAction('declined')}
                  disabled={actioning}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
                >
                  <X className="w-3 h-3" /> Decline
                </button>
              </div>
            )}

            {br.status === 'pending' && isInviter && (
              <p className="text-xs text-ink-400 italic">Waiting for {partner.display_name} to accept…</p>
            )}

            {br.status === 'accepted' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all"
                >
                  <Users className="w-3 h-3" /> Checkpoints
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleAction('completed')}
                  disabled={actioning}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-ink-50 border border-ink-200 text-ink-600 hover:border-ink-400 transition-all"
                >
                  <Check className="w-3 h-3" /> Mark done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkpoint thread */}
      {expanded && br.status === 'accepted' && (
        <div className="border-t border-ink-100 p-4 bg-paper-50">
          {/* Existing checkpoints */}
          {checkpoints === null ? (
            <p className="text-xs text-ink-400 text-center py-2">Loading…</p>
          ) : checkpoints.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-2">No checkpoints yet — post the first one!</p>
          ) : (
            <div className="space-y-3 mb-4">
              {checkpoints.map(cp => (
                <div key={cp.id} className="flex gap-2">
                  <Avatar user={{ display_name: cp.users?.display_name ?? '?', avatar_url: cp.users?.avatar_url }} />
                  <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-ink-100 text-xs">
                    {cp.page && <span className="font-medium text-purple-700 mr-2">p.{cp.page}</span>}
                    {cp.note && <span className="text-ink-700">{cp.note}</span>}
                    <p className="text-[9px] text-ink-300 mt-1">{new Date(cp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New checkpoint */}
          <div className="flex gap-2 items-end">
            <input
              type="number"
              placeholder="Page"
              value={newPage}
              onChange={e => setNewPage(e.target.value)}
              className="w-16 border border-ink-200 rounded-xl px-2 py-2 text-xs text-ink-800 focus:outline-none focus:border-purple-400"
              min={1}
              max={br.books.page_count ?? 9999}
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="flex-1 border border-ink-200 rounded-xl px-3 py-2 text-xs text-ink-800 focus:outline-none focus:border-purple-400"
              onKeyDown={e => { if (e.key === 'Enter') postCheckpoint(); }}
            />
            <button
              onClick={postCheckpoint}
              disabled={posting || (!newPage && !newNote.trim())}
              className="flex-shrink-0 p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuddyReadsClient({ userId }: { userId: string }) {
  const [buddyReads, setBuddyReads] = useState<BuddyRead[] | null>(null);
  const [tab, setTab] = useState<'active' | 'pending' | 'completed'>('active');

  const loadBuddyReads = useCallback(async () => {
    const r = await fetch('/api/buddy-reads');
    if (r.ok) {
      const j = await r.json();
      setBuddyReads(j.data ?? []);
    }
  }, []);

  useEffect(() => { loadBuddyReads(); }, [loadBuddyReads]);

  const filtered = (buddyReads ?? []).filter(br => {
    if (tab === 'active') return br.status === 'accepted';
    if (tab === 'pending') return br.status === 'pending';
    return br.status === 'completed' || br.status === 'declined';
  });

  const pendingCount = (buddyReads ?? []).filter(br => br.status === 'pending').length;

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-10">

          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" /> Buddy Reads
            </h1>
            <p className="text-sm text-ink-500">Read books together, share page checkpoints, stay in sync.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-paper-100 rounded-2xl p-1">
            {(['active', 'pending', 'completed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {t}{t === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </button>
            ))}
          </div>

          {/* Content */}
          {buddyReads === null ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-ink-100 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-ink-400 text-sm">
                {tab === 'active' ? 'No active buddy reads — invite a friend from any book page.' : `No ${tab} buddy reads.`}
              </p>
              <Link href="/discover" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
                Find a book to read →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(br => (
                <BuddyReadCard key={br.id} br={br} userId={userId} onUpdate={loadBuddyReads} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
