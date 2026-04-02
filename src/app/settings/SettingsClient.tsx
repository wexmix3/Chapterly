'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import LibraryImport from '@/components/books/GoodreadsImport';
import GoodreadsFriendsImport from '@/components/books/GoodreadsFriendsImport';
import PushPrompt from '@/components/ui/PushPrompt';
import ShareCardPreview from '@/components/share/ShareCardPreview';
import {
  User, BookOpen, Lock, Sun, Moon, Download, Trash2,
  Check, Loader2, ChevronRight, AlertTriangle, Bell, Upload, Share2,
  CreditCard, Globe, Code2,
} from 'lucide-react';

const AVATAR_OPTIONS = ['📚', '🦉', '🐉', '🌙', '☕', '🌿', '🦋', '⚡'];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

type Profile = {
  display_name: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
  is_public: boolean;
  onboarding_done: boolean;
  timezone?: string | null;
  email_prefs?: Record<string, boolean> | null;
  is_premium?: boolean;
  premium_expires_at?: string | null;
};

type Challenge = { goal_books: number; goal_pages?: number | null } | null;

type Section = 'account' | 'notifications' | 'privacy' | 'billing' | 'reading' | 'appearance' | 'data' | 'import' | 'share' | 'widget';

function WidgetCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-ink-900 dark:bg-ink-950 text-green-400 text-[11px] rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed pr-16">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 bg-ink-700 hover:bg-ink-600 text-ink-200 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1"
      >
        {copied ? <><Check className="w-3 h-3" /> Copied!</> : 'Copy'}
      </button>
    </div>
  );
}

function SectionButton({ active, icon: Icon, label, onClick }: {
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
    <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${saved ? 'text-emerald-600' : 'text-brand-600'}`}>
      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Saved</>}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
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
  const [selectedAvatar, setSelectedAvatar] = useState(initialProfile.avatar_url ?? '📚');
  const [timezone, setTimezone] = useState(initialProfile.timezone ?? 'America/New_York');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);

  // Notification prefs
  const initialEmailPrefs = initialProfile.email_prefs ?? {};
  const [digestEnabled, setDigestEnabled] = useState(initialEmailPrefs.digest !== false);
  const [streakReminderEnabled, setStreakReminderEnabled] = useState(initialEmailPrefs.streak_reminder !== false);
  const [newFollowerEnabled, setNewFollowerEnabled] = useState(initialEmailPrefs.new_follower !== false);
  const [friendFinishedEnabled, setFriendFinishedEnabled] = useState(initialEmailPrefs.friend_finished !== false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Reading goal
  const [goalBooks, setGoalBooks] = useState(initialChallenge?.goal_books ?? 12);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  // Privacy
  const [isPublic, setIsPublic] = useState(initialProfile.is_public);
  const [showStats, setShowStats] = useState(true);
  const [allowFollow, setAllowFollow] = useState(true);
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

  // Referral
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [refCopied, setRefCopied] = useState(false);
  useEffect(() => {
    if (active === 'account' && !referralLink) {
      fetch('/api/referral').then(r => r.ok ? r.json() : null).then(d => {
        if (d?.link) { setReferralLink(d.link); setReferralCount(d.referral_count ?? 0); }
      }).catch(() => null);
    }
  }, [active, referralLink]);

  const copyReferralLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); } catch { return; }
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  // Billing
  const [portalLoading, setPortalLoading] = useState(false);

  const isPremium = initialProfile.is_premium ?? false;
  const premiumExpiry = initialProfile.premium_expires_at
    ? new Date(initialProfile.premium_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const saveAccount = async () => {
    if (!displayName.trim()) return;
    setAccountSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        avatar_url: selectedAvatar,
        timezone,
      }),
    });
    setAccountSaving(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2500);
  };

  const saveNotifications = async () => {
    setNotifSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_prefs: {
          digest: digestEnabled,
          streak_reminder: streakReminderEnabled,
          new_follower: newFollowerEnabled,
          friend_finished: friendFinishedEnabled,
        },
      }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
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
    await fetch('/api/account', { method: 'DELETE' }).catch(() => {});
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
    router.push('/');
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    setPortalLoading(false);
  };

  const GOAL_PRESETS = [6, 12, 24, 36, 52, 100];

  const NAV_ITEMS: { id: Section; icon: React.ElementType; label: string }[] = [
    { id: 'account', icon: User, label: 'Account' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'privacy', icon: Lock, label: 'Privacy' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'reading', icon: BookOpen, label: 'Reading Goal' },
    { id: 'appearance', icon: Sun, label: 'Appearance' },
    { id: 'import', icon: Upload, label: 'Import Library' },
    { id: 'share', icon: Share2, label: 'Share Cards' },
    { id: 'widget', icon: Code2, label: 'Reading Widget' },
    { id: 'data', icon: Download, label: 'Data' },
  ];

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8">

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Settings</h1>
            <p className="text-sm text-ink-500 mt-1">{email}</p>
          </div>

          <div className="grid md:grid-cols-[180px_1fr] gap-6">
            {/* Sidebar nav */}
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, icon, label }) => (
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
                  <div className="space-y-5">
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
                          readOnly
                          className="flex-1 px-3 py-2.5 bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-r-xl text-sm text-ink-500 cursor-not-allowed"
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

                    {/* Avatar selector */}
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-2">Avatar</label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setSelectedAvatar(emoji)}
                            className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${
                              selectedAvatar === emoji
                                ? 'border-brand-400 bg-brand-50 scale-110'
                                : 'border-ink-200 dark:border-ink-700 hover:border-brand-200'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-xs font-medium text-ink-600 dark:text-ink-400 mb-1.5">
                        <Globe className="w-3 h-3 inline mr-1" />
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-colors"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={saveAccount}
                      disabled={accountSaving || !displayName.trim()}
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Save changes
                    </button>

                    {/* Invite Friends */}
                    <div className="pt-2 border-t border-ink-100 dark:border-ink-800">
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Invite Friends</p>
                      <div className="p-4 bg-brand-50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/40 space-y-3">
                        <p className="text-sm text-ink-700 dark:text-ink-300">
                          Share your invite link — every reader you bring to Chapterly helps the community grow. 📚
                          {referralCount > 0 && (
                            <span className="ml-2 text-brand-600 font-medium">{referralCount} reader{referralCount !== 1 ? 's' : ''} joined so far!</span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={referralLink || 'Loading…'}
                            className="flex-1 px-3 py-2 bg-white dark:bg-ink-800 border border-brand-200 dark:border-brand-800 rounded-xl text-xs text-ink-600 dark:text-ink-300 truncate"
                          />
                          <button
                            onClick={copyReferralLink}
                            disabled={!referralLink}
                            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-colors flex-shrink-0"
                          >
                            {refCopied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Copy</>}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="pt-2 border-t border-ink-100 dark:border-ink-800">
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Danger zone</p>
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete account</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                              Permanently deletes your account and all data. This cannot be undone.
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
                  </div>
                </>
              )}

              {/* ── Notifications ────────────────────────── */}
              {active === 'notifications' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Notifications</h2>
                    <SaveBar saving={notifSaving} saved={notifSaved} />
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Weekly digest email',
                        desc: 'Your reading summary every Monday',
                        value: digestEnabled,
                        setter: setDigestEnabled,
                      },
                      {
                        label: 'Streak reminders',
                        desc: 'Daily nudge if you haven\'t read yet',
                        value: streakReminderEnabled,
                        setter: setStreakReminderEnabled,
                      },
                      {
                        label: 'New followers',
                        desc: 'When someone follows you',
                        value: newFollowerEnabled,
                        setter: setNewFollowerEnabled,
                      },
                      {
                        label: 'Friend finished a book',
                        desc: 'When someone you follow completes a book',
                        value: friendFinishedEnabled,
                        setter: setFriendFinishedEnabled,
                      },
                    ].map(({ label, desc, value, setter }) => (
                      <div key={label} className="flex items-start justify-between gap-4 p-4 bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700">
                        <div>
                          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{label}</p>
                          <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
                        </div>
                        <Toggle on={value} onToggle={() => setter(v => !v)} />
                      </div>
                    ))}
                    <button
                      onClick={saveNotifications}
                      disabled={notifSaving}
                      className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Save preferences
                    </button>

                    {/* Push notifications (browser) */}
                    <PushPrompt />
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
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Public profile',
                        desc: isPublic ? 'Your profile, shelf, and reviews are visible to everyone.' : 'Only people you follow can see your profile and shelf.',
                        value: isPublic,
                        setter: setIsPublic,
                      },
                      {
                        label: 'Show reading stats publicly',
                        desc: 'Let others see your pages read, streak, and goals.',
                        value: showStats,
                        setter: setShowStats,
                      },
                      {
                        label: 'Allow follow requests',
                        desc: 'Let other readers follow your reading activity.',
                        value: allowFollow,
                        setter: setAllowFollow,
                      },
                    ].map(({ label, desc, value, setter }) => (
                      <div key={label} className="flex items-start justify-between gap-4 p-4 bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700">
                        <div>
                          <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{label}</p>
                          <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
                        </div>
                        <Toggle on={value} onToggle={() => setter(v => !v)} />
                      </div>
                    ))}
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

              {/* ── Billing ──────────────────────────────── */}
              {active === 'billing' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Billing</h2>
                  {isPremium ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-950/30 dark:to-violet-950/30 rounded-xl border border-brand-200 dark:border-brand-800">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">✨</span>
                          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Chapterly Premium</p>
                        </div>
                        <p className="text-xs text-ink-500">
                          {premiumExpiry ? `Renews ${premiumExpiry}` : 'Active subscription'}
                        </p>
                      </div>
                      <button
                        onClick={handleBillingPortal}
                        disabled={portalLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        Manage Billing
                      </button>
                      <p className="text-xs text-ink-400">Update your payment method, view invoices, or cancel your subscription.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-ink-50 dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700">
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200 mb-1">Free plan</p>
                        <p className="text-xs text-ink-500">You are on the free plan. Upgrade to unlock AI insights, advanced stats, and more.</p>
                      </div>
                      <a
                        href="/premium"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <span>✨</span>
                        Upgrade to Premium
                      </a>
                    </div>
                  )}
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

              {/* ── Import Library ───────────────────────── */}
              {active === 'import' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Import Library</h2>
                  <p className="text-sm text-ink-500">Bring your reading history from other apps. Upload a CSV export to import all your books, shelves, and ratings at once.</p>
                  <LibraryImport />
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Find Friends</p>
                    <GoodreadsFriendsImport />
                  </div>
                </>
              )}

              {/* ── Share Cards ───────────────────────────── */}
              {active === 'share' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Share Cards</h2>
                  <p className="text-sm text-ink-500">Create beautiful share cards for your reading milestones and social media.</p>
                  <ShareCardPreview />
                </>
              )}

              {/* ── Reading Widget ────────────────────────── */}
              {active === 'widget' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Reading Widget</h2>
                  <p className="text-sm text-ink-500">
                    Embed a live reading badge on your blog, GitHub README, or personal site.
                    It automatically updates as you read — no maintenance required.
                  </p>

                  {/* Preview */}
                  <div className="bg-paper-50 dark:bg-ink-800 rounded-xl border border-ink-100 dark:border-ink-700 p-4 space-y-3">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Preview</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/widget/${handle}`}
                      alt="Your reading widget"
                      className="rounded-xl border border-ink-200 dark:border-ink-700"
                      style={{ maxWidth: '300px', height: 'auto' }}
                    />
                    <p className="text-[11px] text-ink-400">
                      Updates every 30 minutes. Supports <code className="bg-ink-100 dark:bg-ink-700 px-1 py-0.5 rounded text-[10px]">?theme=dark</code> for dark mode.
                    </p>
                  </div>

                  {/* Embed code */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Embed code</p>

                    <div>
                      <p className="text-xs text-ink-500 mb-1.5">HTML / Blog</p>
                      <WidgetCodeBlock code={`<a href="https://chapterly.app/u/${handle}">\n  <img src="https://chapterly.app/widget/${handle}" alt="Currently reading" />\n</a>`} />
                    </div>

                    <div>
                      <p className="text-xs text-ink-500 mb-1.5">Markdown (GitHub README)</p>
                      <WidgetCodeBlock code={`[![Currently reading](https://chapterly.app/widget/${handle})](https://chapterly.app/u/${handle})`} />
                    </div>

                    <div>
                      <p className="text-xs text-ink-500 mb-1.5">Dark mode variant</p>
                      <WidgetCodeBlock code={`<img src="https://chapterly.app/widget/${handle}?theme=dark" alt="Currently reading" />`} />
                    </div>
                  </div>

                  <div className="p-4 bg-brand-50 dark:bg-brand-950/20 rounded-xl border border-brand-100 dark:border-brand-900/40">
                    <p className="text-xs font-medium text-brand-700 dark:text-brand-300 mb-1">Tips</p>
                    <ul className="text-xs text-brand-600 dark:text-brand-400 space-y-1 list-disc list-inside">
                      <li>Your profile must be set to <strong>Public</strong> for the widget to display your book.</li>
                      <li>The book shown is your most recently updated &ldquo;currently reading&rdquo; entry.</li>
                      <li>Progress bar appears when you log your current page.</li>
                    </ul>
                  </div>
                </>
              )}

              {/* ── Data ─────────────────────────────────── */}
              {active === 'data' && (
                <>
                  <h2 className="font-display font-semibold text-ink-900 dark:text-ink-50">Your Data</h2>
                  <div className="space-y-4">
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
