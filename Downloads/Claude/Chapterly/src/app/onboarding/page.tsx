'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { ChevronRight, Loader2, Bell, BellOff, Upload, Check, BookOpen } from 'lucide-react';
import { track } from '@/lib/analytics';

interface ParsedGoodreadsBook {
  title: string;
  author: string;
  isbn13?: string;
  rating?: number;
  status: 'read' | 'to_read' | 'reading';
  date_read?: string;
  page_count?: number;
}

function parseGoodreadsCSV(text: string): ParsedGoodreadsBook[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const getCol = (row: string[], name: string) => {
    const idx = headers.indexOf(name);
    if (idx < 0) return '';
    return (row[idx] ?? '').replace(/^"|"$/g, '').trim();
  };

  const books: ParsedGoodreadsBook[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const title = getCol(row, 'title');
    const author = getCol(row, 'author');
    const shelf = getCol(row, 'exclusive shelf');
    if (!title || !shelf) continue;

    let status: ParsedGoodreadsBook['status'] = 'to_read';
    if (shelf === 'read') status = 'read';
    else if (shelf === 'currently-reading') status = 'reading';
    else if (shelf === 'to-read') status = 'to_read';
    else continue; // unknown shelf, skip

    const ratingStr = getCol(row, 'my rating');
    const rating = ratingStr ? parseInt(ratingStr, 10) : 0;
    const isbn13 = getCol(row, 'isbn13').replace(/[^0-9]/g, '') || undefined;
    const dateRead = getCol(row, 'date read') || undefined;
    const pages = getCol(row, 'number of pages');
    const pageCount = pages ? parseInt(pages, 10) : undefined;

    books.push({ title, author, isbn13, rating, status, date_read: dateRead, page_count: pageCount });
  }
  return books;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const AVATAR_OPTIONS = ['📚', '🦉', '🐉', '🌙', '☕', '🌿', '🦋', '⚡'];

const GENRES = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Fantasy', 'Science Fiction',
  'Romance', 'Biography', 'History', 'Science', 'Self-Help',
  'Horror', 'Thriller', 'Literary Fiction', 'Young Adult', 'Graphic Novel',
];

type GoalType = 'yearly_books' | 'weekly_pages' | 'monthly_genres';

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'yearly_books', label: 'Books per year', desc: 'How many books will you finish this year?' },
  { value: 'weekly_pages', label: 'Pages per week', desc: 'How many pages will you read each week?' },
  { value: 'monthly_genres', label: 'Genres per month', desc: 'How many different genres each month?' },
];

const GOAL_PRESETS: Record<GoalType, { value: number; label: string; badge: string; desc: string }[]> = {
  yearly_books: [
    { value: 6,  label: '6 books',    badge: 'Casual',      desc: 'One every two months' },
    { value: 12, label: '12 books',   badge: 'Steady',      desc: 'One per month' },
    { value: 24, label: '24 books',   badge: 'Avid',        desc: 'Two per month' },
    { value: 36, label: '36 books',   badge: 'Dedicated',   desc: 'Three per month' },
    { value: 52, label: '52 books',   badge: 'One per week', desc: 'A book every week' },
  ],
  weekly_pages: [
    { value: 50,  label: '50 pages/week',  badge: 'Light',    desc: 'About 7 pages a day' },
    { value: 100, label: '100 pages/week', badge: 'Steady',   desc: 'About 15 pages a day' },
    { value: 200, label: '200 pages/week', badge: 'Avid',     desc: 'About 30 pages a day' },
    { value: 350, label: '350 pages/week', badge: 'Dedicated', desc: 'About 50 pages a day' },
    { value: 500, label: '500 pages/week', badge: 'Prolific', desc: 'About 70 pages a day' },
  ],
  monthly_genres: [
    { value: 1, label: '1 genre/month',  badge: 'Focused',   desc: 'Deep dives into one genre' },
    { value: 2, label: '2 genres/month', badge: 'Balanced',  desc: 'A good mix' },
    { value: 3, label: '3 genres/month', badge: 'Eclectic',  desc: 'Wide variety' },
    { value: 4, label: '4 genres/month', badge: 'Explorer',  desc: 'Something new every week' },
  ],
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('📚');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [goalType, setGoalType] = useState<GoalType>('yearly_books');
  const [goal, setGoal] = useState(12);
  const [saving, setSaving] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  // Goodreads import state
  const [grBooks, setGrBooks] = useState<ParsedGoodreadsBook[] | null>(null);
  const [grImporting, setGrImporting] = useState(false);
  const [grResult, setGrResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Reader';

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : prev.length < 5
          ? [...prev, genre]
          : prev
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    await Promise.all([
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || firstName,
          avatar_url: selectedAvatar,
          genres: selectedGenres,
          onboarding_complete: true,
        }),
      }).catch(() => null),
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: new Date().getFullYear(), goal_books: goal, goal_type: goalType, goal_target: goal }),
      }).catch(() => null),
    ]);
    setSaving(false);
    track({ event: 'onboarding_step_completed', properties: { step: 3 } });
    track({ event: 'goal_set', properties: { goal_books: goal } });
    // Show push notification opt-in before going to dashboard
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      setStep(4);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGrFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseGoodreadsCSV(text);
      setGrBooks(parsed);
    };
    reader.readAsText(file);
  };

  const handleGrImport = async () => {
    if (!grBooks || grBooks.length === 0) return;
    setGrImporting(true);
    try {
      const res = await fetch('/api/import/goodreads-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: grBooks }),
      });
      if (res.ok) {
        const j = await res.json();
        setGrResult(j);
        track({ event: 'goodreads_imported', properties: { imported: j.imported } });
      }
    } finally {
      setGrImporting(false);
    }
  };

  const handleEnablePush = async () => {
    setPushState('loading');
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (publicKey) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
          });
          const subJson = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } };
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subJson.endpoint, keys: { p256dh: subJson.keys?.p256dh ?? '', auth: subJson.keys?.auth ?? '' } }),
          });
        }
        setPushState('granted');
        setTimeout(() => router.push('/timer?welcome=1'), 1200);
      } else {
        setPushState('denied');
        setTimeout(() => router.push('/timer?welcome=1'), 800);
      }
    } catch {
      setPushState('denied');
      setTimeout(() => router.push('/timer?welcome=1'), 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Step indicator — shown on steps 1-3 */}
        {step >= 1 && step < 4 && (
          <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 transition-all ${
                  s === step
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : s < step
                      ? 'border-brand-300 bg-brand-100 text-brand-600'
                      : 'border-ink-200 bg-white text-ink-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-colors ${s < step ? 'bg-brand-300' : 'bg-ink-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 0 — Goodreads Library Import */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-950 mb-1">
                Welcome, {firstName}!
              </h1>
              <p className="text-ink-500">
                Already on Goodreads? Import your library in seconds — ratings, shelves, and all.
              </p>
            </div>

            {!grResult ? (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-ink-200 hover:border-brand-400 rounded-2xl p-8 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-ink-700">Upload your Goodreads CSV</p>
                  <p className="text-xs text-ink-400 mt-1">
                    Export from Goodreads → My Books → Tools → Export Library
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleGrFile}
                    className="hidden"
                  />
                </div>

                {grBooks && grBooks.length > 0 && (
                  <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-brand-500" />
                      <p className="text-sm font-semibold text-brand-800">
                        Found {grBooks.length} books
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs text-brand-700">
                      <span>✓ {grBooks.filter(b => b.status === 'read').length} read</span>
                      <span>📖 {grBooks.filter(b => b.status === 'reading').length} reading</span>
                      <span>🔖 {grBooks.filter(b => b.status === 'to_read').length} want to read</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 bg-ink-50 hover:bg-ink-100 text-ink-600 rounded-2xl font-medium transition-colors text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={grBooks && grBooks.length > 0 ? handleGrImport : () => setStep(1)}
                    disabled={grImporting}
                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {grImporting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                    ) : grBooks && grBooks.length > 0 ? (
                      <>Import {grBooks.length} Books <ChevronRight className="w-4 h-4" /></>
                    ) : (
                      <>Continue <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5 text-center">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-800 text-sm">
                    {grResult.imported} books imported!
                  </p>
                  {grResult.skipped > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">{grResult.skipped} skipped (already on shelf or not found)</p>
                  )}
                </div>
                <button
                  onClick={() => { track({ event: 'onboarding_step_completed', properties: { step: 0 } }); setStep(1); }}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Name & Avatar */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-950 mb-1">
                Welcome, {firstName}!
              </h1>
              <p className="text-ink-500">Let&apos;s personalize your reading profile.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">What should we call you?</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={firstName}
                className="w-full px-4 py-3 bg-white border border-ink-200 rounded-2xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-2">Choose your avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center border-2 transition-all ${
                      selectedAvatar === emoji
                        ? 'border-brand-400 bg-brand-50 scale-105 shadow-sm'
                        : 'border-ink-200 bg-white hover:border-brand-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { track({ event: 'onboarding_step_completed', properties: { step: 1 } }); setStep(2); }}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setStep(0)} className="w-full text-center text-xs text-ink-400 hover:text-ink-600 mt-1 transition-colors">
              ← Back
            </button>
          </div>
        )}

        {/* Step 2 — Genre Interests */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">What do you love to read?</h2>
              <p className="text-ink-500 text-sm">Pick 3–5 genres. We&apos;ll tailor your recommendations.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                const isDisabled = !isSelected && selectedGenres.length >= 5;
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 scale-105'
                        : isDisabled
                          ? 'bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed'
                          : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-ink-400 text-center">
              {selectedGenres.length}/5 selected
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-2xl font-medium transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={() => { track({ event: 'onboarding_step_completed', properties: { step: 2 } }); setStep(3); }}
                disabled={selectedGenres.length < 3}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-2xl font-medium transition-colors text-sm flex items-center justify-center gap-1"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Reading Goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-1">Set your reading goal</h2>
              <p className="text-ink-500 text-sm">Choose a goal type and target for {new Date().getFullYear()}.</p>
            </div>

            {/* Goal type selector */}
            <div className="flex gap-2">
              {GOAL_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setGoalType(opt.value); setGoal(GOAL_PRESETS[opt.value][1].value); }}
                  className={`flex-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                    goalType === opt.value
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-brand-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {GOAL_PRESETS[goalType].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                    goal === opt.value
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-ink-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-semibold ${goal === opt.value ? 'text-brand-700' : 'text-ink-800'}`}>
                      {opt.label}
                    </span>
                    <p className="text-xs text-ink-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    goal === opt.value
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-ink-100 text-ink-500'
                  }`}>
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-2xl font-medium transition-colors text-sm"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Setting up…' : 'Start Reading'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Push notification opt-in */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
              {pushState === 'granted' ? (
                <Bell className="w-8 h-8 text-brand-500" />
              ) : pushState === 'denied' ? (
                <BellOff className="w-8 h-8 text-ink-400" />
              ) : (
                <Bell className="w-8 h-8 text-brand-500" />
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-950 mb-2">Stay on your streak</h2>
              <p className="text-ink-500 text-sm">
                Get a gentle nudge when your reading streak is at risk — and celebrate milestones as they happen.
              </p>
            </div>
            {pushState === 'granted' ? (
              <p className="text-emerald-600 font-medium text-sm">Notifications enabled! Taking you to your dashboard…</p>
            ) : pushState === 'denied' ? (
              <p className="text-ink-400 text-sm">No worries — you can enable them later in Settings.</p>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleEnablePush}
                  disabled={pushState === 'loading'}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {pushState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Enable Notifications
                </button>
                <button
                  onClick={() => router.push('/timer?welcome=1')}
                  className="w-full py-3 text-ink-400 text-sm hover:text-ink-600 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
