'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import { Play, Pause, Square, BookOpen, Clock, Check, RotateCcw, Sparkles } from 'lucide-react';

interface CurrentBook {
  user_book_id: string;
  book_id: string;
  title: string;
  authors: string[];
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimerClient() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [books, setBooks] = useState<CurrentBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<CurrentBook | null>(null);
  const [pages, setPages] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('welcome') === '1') setShowWelcome(true);
  }, [searchParams]);

  // Load currently reading books
  useEffect(() => {
    fetch('/api/user-books?status=reading&limit=20')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => {
        const mapped = (j.data ?? []).map((ub: { id: string; book_id: string; book?: { title?: string; authors?: string[] } }) => ({
          user_book_id: ub.id,
          book_id: ub.book_id,
          title: ub.book?.title ?? 'Unknown',
          authors: ub.book?.authors ?? [],
        }));
        setBooks(mapped);
        if (mapped.length === 1) setSelectedBook(mapped[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    if (!startTimeRef.current) startTimeRef.current = new Date().toISOString();
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleStop = () => {
    setRunning(false);
    if (seconds >= 60) setDone(true);
  };

  const handleReset = () => {
    setRunning(false);
    setDone(false);
    setSeconds(0);
    startTimeRef.current = null;
    setPages('');
    setNotes('');
    setError('');
  };

  const handleSave = async () => {
    if (!selectedBook) { setError('Please select a book.'); return; }
    if (seconds < 60) { setError('Minimum 1 minute to log.'); return; }
    setSaving(true);
    setError('');

    const minutes = Math.round(seconds / 60);
    const pagesNum = pages ? parseInt(pages, 10) : undefined;

    const body: Record<string, unknown> = {
      user_book_id: selectedBook.user_book_id,
      book_id: selectedBook.book_id,
      mode: 'minutes',
      value: minutes,
      source: 'timer',
      started_at: startTimeRef.current ?? new Date().toISOString(),
      ended_at: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };
    if (pagesNum && pagesNum > 0) body.pages_end = pagesNum;

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Failed to save session.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const minutes = Math.round(seconds / 60);

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="max-w-md mx-auto px-4 py-10">

        {/* Welcome / aha-moment banner (shown post-onboarding) */}
        {showWelcome && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-800">You&apos;re all set! Log your first session.</p>
              <p className="text-xs text-brand-600 mt-0.5">
                Start the timer, read a chapter, stop — your stats and streak begin the moment you save.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="text-brand-400 hover:text-brand-600 text-lg ml-auto leading-none">×</button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-ink-950">Reading Timer</h1>
          <p className="text-sm text-ink-500 mt-1">Track your session live — we&apos;ll log it when you&apos;re done.</p>
        </div>

        {/* Book selector */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4 mb-5">
          <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-3">Reading now</p>
          {books.length === 0 ? (
            <p className="text-sm text-ink-500">
              No books marked &ldquo;Currently Reading&rdquo;.{' '}
              <a href="/dashboard?tab=search" className="text-brand-600 underline">Add one first.</a>
            </p>
          ) : (
            <div className="space-y-1">
              {books.map(b => (
                <button
                  key={b.user_book_id}
                  onClick={() => setSelectedBook(b)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    selectedBook?.user_book_id === b.user_book_id
                      ? 'bg-brand-50 border border-brand-200'
                      : 'hover:bg-paper-50 border border-transparent'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{b.title}</p>
                    <p className="text-xs text-ink-400 truncate">{b.authors.join(', ')}</p>
                  </div>
                  {selectedBook?.user_book_id === b.user_book_id && (
                    <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stopwatch */}
        {!done ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center mb-5">
            <div className="text-7xl font-mono font-bold text-ink-950 mb-1 tabular-nums tracking-tight">
              {formatTime(seconds)}
            </div>
            <p className="text-xs text-ink-400 mb-8">
              {running ? '⏱ Reading…' : seconds > 0 ? 'Paused' : 'Ready to start'}
            </p>

            <div className="flex justify-center gap-3">
              {!running ? (
                <button
                  onClick={handleStart}
                  disabled={!selectedBook}
                  className="flex items-center gap-2 px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-2xl font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  {seconds > 0 ? 'Resume' : 'Start'}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}
              {seconds >= 60 && (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-5 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-2xl font-semibold transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Done
                </button>
              )}
            </div>

            {seconds > 0 && seconds < 60 && (
              <p className="text-xs text-ink-400 mt-4">Keep going — 1 min minimum to log</p>
            )}
          </div>
        ) : (
          /* Session summary + save form */
          <div className="bg-white rounded-2xl border border-ink-100 p-6 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-brand-500" />
              <h2 className="font-semibold text-ink-900">Session complete</h2>
            </div>

            <div className="bg-brand-50 rounded-xl px-4 py-3 mb-4 text-center">
              <p className="text-3xl font-bold text-brand-600 font-mono tabular-nums">{formatTime(seconds)}</p>
              <p className="text-xs text-brand-400 mt-0.5">{minutes} minute{minutes !== 1 ? 's' : ''}</p>
            </div>

            {selectedBook && (
              <p className="text-xs text-ink-400 mb-4">
                Logged for: <span className="font-medium text-ink-700">{selectedBook.title}</span>
              </p>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">
                  Current page after session <span className="text-ink-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={pages}
                  onChange={e => setPages(e.target.value)}
                  placeholder="e.g. 142"
                  min={1}
                  className="w-full px-4 py-2.5 bg-paper-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">
                  Notes <span className="text-ink-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="How was it?"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-paper-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 resize-none"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-xl text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedBook || saved}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><Check className="w-4 h-4" /> Saved!</>
                ) : saving ? 'Saving…' : 'Log Session'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
