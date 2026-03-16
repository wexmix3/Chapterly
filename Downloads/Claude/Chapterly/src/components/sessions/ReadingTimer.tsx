'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, Loader2, Timer } from 'lucide-react';
import type { UserBook } from '@/types';

interface Props {
  userBook: UserBook;
  onLogged?: (newPage: number) => void;
  onComplete?: () => void;
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ReadingTimer({ userBook, onLogged, onComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [pagesInput, setPagesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPage = userBook.current_page ?? 0;
  const totalPages = userBook.book?.page_count ?? null;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const start = () => {
    startTimeRef.current = new Date();
    setStatus('running');
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('paused');
  };

  const resume = () => {
    setStatus('running');
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus('stopped');
  };

  const reset = () => {
    setStatus('idle');
    setSeconds(0);
    setPagesInput('');
    startTimeRef.current = null;
  };

  const submit = async () => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const pagesNum = pagesInput ? parseInt(pagesInput) : null;
    const pagesEnd = pagesNum
      ? Math.min(currentPage + pagesNum, totalPages ?? Infinity)
      : undefined;

    setLoading(true);
    setSaveError(false);
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_book_id: userBook.id,
        book_id: userBook.book_id,
        mode: 'minutes',
        value: minutes,
        pages_start: pagesNum ? currentPage : undefined,
        pages_end: pagesEnd,
        source: 'timer',
        started_at: startTimeRef.current?.toISOString(),
        ended_at: new Date().toISOString(),
      }),
    });
    setLoading(false);

    if (res.ok) {
      if (onLogged && pagesEnd !== undefined) onLogged(pagesEnd);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        if (onComplete) onComplete();
      }, 1800);
    } else {
      setSaveError(true);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 gap-2">
        <CheckCircle className="w-10 h-10 text-emerald-500" />
        <p className="font-display font-semibold text-ink-900">Session logged!</p>
        <p className="text-xs text-ink-400">
          {Math.round(seconds / 60)} min{pagesInput ? ` · ${pagesInput} pages` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Timer display */}
      <div className="flex flex-col items-center py-6 gap-1.5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
          status === 'running' ? 'bg-brand-50' : 'bg-ink-50'
        }`}>
          <Timer className={`w-6 h-6 ${status === 'running' ? 'text-brand-500' : 'text-ink-400'}`} />
        </div>
        <span className="font-display text-5xl font-bold text-ink-950 tabular-nums tracking-tight">
          {formatTime(seconds)}
        </span>
        <span className="text-xs text-ink-400">
          {status === 'idle' && 'Start when you begin reading'}
          {status === 'running' && 'Reading\u2026'}
          {status === 'paused' && 'Paused \u2014 tap Resume to continue'}
          {status === 'stopped' && `${Math.round(seconds / 60)} min session`}
        </span>
      </div>

      {/* Controls */}
      {status === 'idle' && (
        <button onClick={start}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2">
          <Play className="w-4 h-4 fill-white" /> Start Timer
        </button>
      )}

      {(status === 'running' || status === 'paused') && (
        <div className="flex gap-2">
          <button
            onClick={status === 'running' ? pause : resume}
            className="flex-1 py-3 bg-ink-100 hover:bg-ink-200 text-ink-800 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2">
            {status === 'running'
              ? <><Pause className="w-4 h-4" /> Pause</>
              : <><Play className="w-4 h-4 fill-ink-800" /> Resume</>}
          </button>
          <button onClick={stop}
            className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2">
            <Square className="w-4 h-4 fill-red-500" /> Stop
          </button>
        </div>
      )}

      {status === 'stopped' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              Pages read this session <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              type="number"
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder={totalPages ? `Current page: ${currentPage} of ${totalPages}` : `Current page: ${currentPage}`}
              className="w-full px-3 py-2.5 bg-ink-50 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand-300 transition-colors"
            />
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging&hellip;</>
              : `Log ${Math.round(seconds / 60)} min session`}
          </button>
          {saveError && (
            <p className="text-xs text-red-500 text-center">Failed to save session — please try again.</p>
          )}
          <button onClick={reset}
            className="w-full py-2 text-xs text-ink-400 hover:text-ink-600 transition-colors">
            Reset timer
          </button>
        </div>
      )}
    </div>
  );
}
