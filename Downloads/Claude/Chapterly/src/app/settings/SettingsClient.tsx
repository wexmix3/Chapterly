'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import {
  User, BookOpen, Lock, Sun, Moon, Download, Trash2,
  Check, Loader2, ChevronRight, AlertTriangle, Bell
} from 'lucide-react';

type Profile = {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  is_public: boolean;
  onboarding_done: boolean;
};

type Challenge = { goal_books: number; goal_pages?: number | null } | null;

type Section = 'account' | 'reading' | 'privacy' | 'appearance' | 'notifications' | 'data';

function SectionButton({ id, active, icon: Icon, label, onClick }: {
  id: Section; active: boolean; icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
        active
          ? 'bg-brand-50 text-brand-700 border border-brand-200'
          : 'text-ink-600 hover:bg-ink-50 border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
      <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${active ? 'rotate-90' : ''}`} />
    </button>
  );
}

function SaveBar({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (!saving && !saved) return null;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${
      saved ? 'text-emerald-600' : 'text-brand-600'
    }`}>
      {saving
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        : <><Check className="w-4 h-4" /> Saved</>
      }
    </div>
  );
}

export default function SettingsClient({
  email, profile: initialProfile, challenge: initialChallenge,
}: {
  email: string;
  profile: Profile;
  challenge: Challenge;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Section>('account');

  // Account
  const [displayName, setDisplayName] = useState(initialProfile.display_name);
  const [handle, setHandle] = useState(initialProfile.handle);
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Reading goal
  const [goalBooks, setGoalBooks] = useState(initialChallenge?.goal_books ?? 12);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  // Privacy
  const [isPublic, setIsPublic] = useState(initialProfile.is_public);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);

  // Appearance
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = document.cookie.match(/theme=([^;]+)/)?.[1];
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(saved ? saved === 'dark' : prefersDark);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.cookie = `theme=${next ? 'dark' : 'light'};path=/;max-age=31536000`;
  };

  // Data export
  const [exporting, setExporting] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const saveAccount = async () => {
    if (!displayName.trim()) return;
    setAccountSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.trim(), handle: handle.trim(), bio: bio.trim() }),
    });
    setAccountSaving(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  };

  const saveGoal = async () => {
    setGoalSaving(true);
    await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: new Date().getFullYear(), goal_books: goalBooks }),
    });
    setGoalSaving(false);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2500);
  };

  const savePrivacy = async () => {
    setPrivacySaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: isPublic }),
    });
    setPrivacySaving(false);
    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2500);
  };

  const handleExport = async () => {
    setExporting(true);
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapterly-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    await fetch('/api/profile', {
      method: 'DELETE',
    }).catch(() => {});
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
    router.push('/');
  };

  const GOAL_PRESETS = [6, 12, 24, 36, 52, 100];

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8">

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Settings</h1>
            <p className="text-sm text-ink-500 mt-1">{email}</p>
          </div>

          <div className="grid md:grid-cols-[180px_1fr] gap-6">
            {/* Sidebar nav */}
            <nav className="space-y-1">
              {([
                { id: 'account', icon: User, label: 'Account' },
                { id: 'reading', icon: BookOpen, label: 'Reading Goal' },
                { id: 'privacy', icon: Lock, label: 'Privacy' },
                { id: 'appearance', icon: Sun, label: 'Appearance' },
                { id: 'notifications', icon: Bell, label: 'Notifications' },
                { id: 'data', icon: Download, label: 'Data' },
              ] as { id: Section; icon: React.ElementType; label: string }[]).map(({ id, icon, label }) => (
                <SectionButton key={id} id={id} active={active === id} icon={icon} label={label} onClick={() => setActive(id)} />
              ))}
            </nav>

            {/* Content panel */}
            <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800 p-6 space-y-6">

              {/* ── Account ─────────────────────────────── */}
              {active === 'account' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Account</h2>
                    <SaveBar saving={accountSaving} saved={accountSaved} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">Display name</label>
                      <input
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">Handle</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2.5 bg-ink-50 dark:bg-ink-800 border border-r-0 border-ink-200 dark:border-ink-700 rounded-l-xl text-sm text-ink-400">@</span>
                        <input
                          value={handle}
                          onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="flex-1 px-3 py-2.5 bg-paper-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-r-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-ink-400 mt-1">Your public profile is at /u/{handle || '…'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">Bio</label>
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        rows={3}
                        maxLength={160}
                        placeholder="Tell readers about yourself…"
                        className="w-full px-3 py-2.5 bg-paper-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors resize-none"
                      />
                      <p className="text-[11px] text-ink-400 mt-1 text-right">{bio.length}/160</p>
                    </div>
                    <button
                      onClick={saveAccount}
                      disabled={accountSaving || !displayName.trim()}
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Save changes
                    </button>
                  </div>
                </>
              )}

              {/* ── Reading Goal ─────────────────────────── */}
              {active === 'reading' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Reading Goal</h2>
                    <SaveBar saving={goalSaving} saved={goalSaved} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-ink-500">Set your target books for {new Date().getFullYear()}. You can update this anytime.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {GOAL_PRESETS.map(n => (
                        <button
                          key={n}
                          onClick={() => setGoalBooks(n)}
                          className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                            goalBooks === n
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-brand-300'
                          }`}
                        >
                          {n} books
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink-500">Custom:</span>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={goalBooks}
                        onChange={e => setGoalBooks(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3 py-2 bg-paper-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm text-center focus:outline-none focus:border-brand-400"
                      />
                      <span className="text-sm text-ink-500">books</span>
                    </div>
                    <button
                      onClick={saveGoal}
                      disabled={goalSaving}
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Update goal
                    </button>
                  </div>
                </>
              )}

              {/* ── Privacy ──────────────────────────────── */}
              {active === 'privacy' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Privacy</h2>
                    <SaveBar saving={privacySaving} saved={privacySaved} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 p-4 bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700">
                      <div>
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Public profile</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {isPublic
                            ? 'Your profile, shelf, and reviews are visible to everyone.'
                            : 'Only people you follow can see your profile and shelf.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsPublic(v => !v)}
                        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
                          isPublic ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-600'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isPublic ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <p className="text-xs text-ink-400">
                      Regardless of your privacy setting, your username and reading stats are always shown on the leaderboard if you rank in the top 100.
                    </p>
                    <button
                      onClick={savePrivacy}
                      disabled={privacySaving}
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Save privacy
                    </button>
                  </div>
                </>
              )}

              {/* ── Appearance ───────────────────────────── */}
              {active === 'appearance' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Appearance</h2>
                  <div className="space-y-3">
                    {[
                      { value: false, label: 'Light', desc: 'Clean and bright', icon: Sun },
                      { value: true, label: 'Dark', desc: 'Easy on the eyes', icon: Moon },
                    ].map(({ value, label, desc, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => { if (dark !== value) toggleTheme(); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          dark === value
                            ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-300 dark:border-brand-700'
                            : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 hover:border-ink-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          dark === value ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600' : 'bg-ink-100 dark:bg-ink-700 text-ink-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-medium ${dark === value ? 'text-brand-700 dark:text-brand-300' : 'text-ink-700 dark:text-ink-300'}`}>{label}</p>
                          <p className="text-xs text-ink-400">{desc}</p>
                        </div>
                        {dark === value && <Check className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Notifications ────────────────────────── */}
              {active === 'notifications' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Notifications</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'New followers', desc: 'When someone follows you' },
                      { label: 'Friend activity', desc: 'When friends finish books or hit milestones' },
                      { label: 'Book recommendations', desc: 'When a friend recommends a book to you' },
                      { label: 'Club updates', desc: 'New posts in your book clubs' },
                      { label: 'Weekly digest email', desc: 'Your reading summary every Monday' },
                      { label: 'Streak reminders', desc: 'Daily nudge if you haven\'t read yet' },
                    ].map(({ label, desc }) => (
                      <div key={label} className="flex items-start justify-between gap-4 p-4 bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700">
                        <div>
                          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{label}</p>
                          <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
                        </div>
                        {/* Toggle defaults to on — persisted client-side via localStorage for now */}
                        <NotifToggle id={label} />
                      </div>
                    ))}
                    <p className="text-xs text-ink-400 pt-1">Notification preferences are saved locally on this device.</p>
                  </div>
                </>
              )}

              {/* ── Data ─────────────────────────────────── */}
              {active === 'data' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Your Data</h2>
                  <div className="space-y-4">

                    {/* Export */}
                    <div className="p-4 bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700">
                      <div className="flex items-start gap-3 mb-3">
                        <Download className="w-5 h-5 text-ink-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Export your library</p>
                          <p className="text-xs text-ink-500 mt-0.5">Download all your books, ratings, reviews, and reading sessions as a CSV file.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {exporting ? 'Preparing…' : 'Download CSV'}
                      </button>
                    </div>

                    {/* Delete account */}
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete account</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                            Permanently deletes your account, shelf, sessions, and all data. This cannot be undone.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-ink-600 dark:text-ink-400 mb-2">Type <strong>DELETE</strong> to confirm:</p>
                      <div className="flex gap-2">
                        <input
                          value={deleteConfirm}
                          onChange={e => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          className="flex-1 px-3 py-2 bg-white dark:bg-ink-800 border border-red-200 dark:border-red-900 rounded-xl text-sm focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={handleDelete}
                          disabled={deleteConfirm !== 'DELETE' || deleting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Notification toggle — persisted in localStorage per device
function NotifToggle({ id }: { id: string }) {
  const key = `notif_${id}`;
  const [on, setOn] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) setOn(saved === '1');
  }, [key]);
  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(key, next ? '1' : '0');
  };
  return (
    <button
      onClick={toggle}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}
