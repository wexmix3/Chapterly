'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import {
  Plus, BookMarked, Globe, Lock, Pencil, Trash2, X, Check, Loader2, List,
} from 'lucide-react';

interface ReadingList {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  cover_book: { title: string; cover_url: string | null } | null;
  book_count?: number;
}

function ListCard({ list, onEdit, onDelete }: { list: ReadingList; onEdit: (l: ReadingList) => void; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 shadow-sm overflow-hidden group">
      {/* Cover strip */}
      <div className="h-20 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900 relative">
        {list.cover_book?.cover_url && (
          <img src={list.cover_book.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(list)}
            className="p-1.5 bg-white/90 rounded-lg text-ink-600 hover:text-ink-900 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 bg-white/90 rounded-lg text-ink-600 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={() => onDelete(list.id)} className="p-1.5 bg-red-500 rounded-lg text-white">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(false)} className="p-1.5 bg-white/90 rounded-lg text-ink-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <Link href={`/lists/${list.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink-900 dark:text-paper-100 leading-snug line-clamp-2">{list.title}</h3>
          {list.is_public
            ? <Globe className="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-0.5" />
            : <Lock className="w-3.5 h-3.5 text-ink-400 flex-shrink-0 mt-0.5" />
          }
        </div>
        {list.description && (
          <p className="text-xs text-ink-500 mt-1 line-clamp-2">{list.description}</p>
        )}
      </Link>
    </div>
  );
}

interface ListFormProps {
  initial?: ReadingList | null;
  onSave: (list: ReadingList) => void;
  onCancel: () => void;
}

function ListForm({ initial, onSave, onCancel }: ListFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const method = initial ? 'PATCH' : 'POST';
      const url = initial ? `/api/lists/${initial.id}` : '/api/lists';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, is_public: isPublic }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return; }
      onSave(json.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-5">
      <h3 className="font-semibold text-ink-900 dark:text-paper-100 mb-4">
        {initial ? 'Edit list' : 'Create new list'}
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Summer reads, Books about resilience…"
            maxLength={100}
            className="w-full px-3 py-2 text-sm border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What's this list about?"
            rows={2}
            maxLength={300}
            className="w-full px-3 py-2 text-sm border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-ink-200 peer-checked:bg-brand-500 rounded-full transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
          </div>
          <div>
            <span className="text-sm font-medium text-ink-800 dark:text-ink-200">Public list</span>
            <p className="text-xs text-ink-500">{isPublic ? 'Visible on your public profile' : 'Only you can see this'}</p>
          </div>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 text-sm font-medium hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {initial ? 'Save changes' : 'Create list'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReadingList | null>(null);

  useEffect(() => {
    fetch('/api/lists')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => { setLists(json.data ?? []); setLoading(false); });
  }, []);

  const handleSave = (saved: ReadingList) => {
    setLists(prev => {
      const idx = prev.findIndex(l => l.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/lists/${id}`, { method: 'DELETE' });
    setLists(prev => prev.filter(l => l.id !== id));
  };

  const handleEdit = (list: ReadingList) => {
    setEditing(list);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                <List className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-paper-50">Reading Lists</h1>
                <p className="text-sm text-ink-500">{lists.length} {lists.length === 1 ? 'list' : 'lists'}</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setEditing(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              New list
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="mb-6">
              <ListForm onSave={handleSave} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="mb-6">
              <ListForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
            </div>
          )}

          {/* List grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : lists.length === 0 && !showForm ? (
            <div className="text-center py-20">
              <BookMarked className="w-12 h-12 text-ink-200 dark:text-ink-700 mx-auto mb-4" />
              <h2 className="font-semibold text-ink-700 dark:text-ink-300 mb-2">No lists yet</h2>
              <p className="text-sm text-ink-500 mb-6 max-w-xs mx-auto">
                Create curated lists — summer reads, books for a trip, favourites to share with friends.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create your first list
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {lists.map(list => (
                <ListCard key={list.id} list={list} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
