'use client';

import { useState } from 'react';
import { BookOpen, Minus, Plus, CheckCircle, Loader2, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { useLogSession } from '@/hooks';
import type { UserBook } from '@/types';

const PAGE_PRESETS = [5, 10, 25, 50];
const MIN_PRESETS = [5, 15, 30, 60];

interface Props {
  userBook: UserBook;
  onComplete?: () => void;
  onLogged?: (newPage: number) => void;
}

export default function QuickLog({ userBook, onComplete, onLogged }: Props) {
  const [mode, setMode] = useState<'pages' | 'minutes'>('pages');
  const [value, setValue] = useState(mode === 'pages' ? 10 : 15);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [done, setDone] = useState(false);
  const { logSession, loading } = useLogSession();
  const { book } = userBook;

  const currentPage = userBook.current_page ?? 0;
  const totalPages = book?.page_count ?? null;
  const projectedPage = totalPages
    ? Math.min(currentPage + value, totalPages)
    : currentPage + value;
  const currentPct = totalPages ? Math.round((currentPage / totalPages) * 100) : null;
  const projectedPct = totalPages ? Math.round((projectedPage / totalPages) * 100) : null;
  const willFinish = totalPages !== null && projectedPage >= totalPages;

  const handleModeChange = (newMode: 'pages' | 'minutes') => {
    setMode(newMode);
    setValue(newMode === 'pages' ? 10 : 15);
  };

  const handleSubmit = async () => {
    const newPage = mode === 'pages' ? projectedPage : undefined;
    const res = await logSession({
      user_book_id: userBook.id,
      book_id: userBook.book_id,
      mode,
      value,
      pages_start: mode === 'pages' ? currentPage : undefined,
      pages_end: newPage,
      notes: notes || undefined,
    });

    if (res.ok) {
      if (quoteText.trim()) {
        await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book_id: userBook.book_id,
            text: quoteText.trim(),
            page_number: quotePage ? parseInt(quotePage) : null,
            is_public: true,
          }),
        });
      }

      if (onLogged && newPage !== undefined) onLogged(newPage);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        if (onComplete) onComplete();
      }, 1800);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
        <p className="font-display font-semibold text-ink-900">
          {willFinish ? 'You finished the book! 🎉' : 'Keep that streak going 🔥'}
        </p>
        {totalPages && (
          <p className="text-sm text-ink-500">
            Page {projectedPage} of {totalPages} · {projectedPct}% complete
          </p>
        )}
        {quoteText && <p className="text-xs text-ink-500 italic">Quote saved ✓</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Book info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-[60px] bg-paper-200 rounded-lg overflow-hidden flex-shrink-0">
          {book?.cover_url ? (
            <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-ink-300" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-ink-900 text-sm truncate">{book?.title}</p>
          <p className="text-xs text-ink-500 truncate">{book?.authors[0]}</p>
        </div>
      </div>

      {/* Progress bar — pages mode only */}
      {mode === 'pages' && totalPages !== null && (
        <div className="bg-ink-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-500">
              Page <span className="font-semibold text-ink-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-ink-800">{totalPages}</span>
            </span>
            <span className={`font-semibold ${currentPct === 100 ? 'text-emerald-600' : 'text-brand-600'}`}>
              {currentPct}% complete
            </span>
          </div>

          {/* Progress bar with projected overlay */}
          <div className="relative h-2.5 bg-ink-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-brand-200 rounded-full transition-all duration-200"
              style={{ width: `${projectedPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-brand-500 rounded-full"
              style={{ width: `${currentPct}%` }}
            />
          </div>

          {/* After-session projection */}
          {value > 0 && projectedPage > currentPage && (
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span>After this session:</span>
              <span className={`font-medium ${willFinish ? 'text-emerald-600' : 'text-brand-500'}`}>
                {willFinish
                  ? `Page ${totalPages} · Finished! 🎉`
                  : `Page ${projectedPage} · ${projectedPct}%`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex bg-ink-50 rounded-xl p-1 gap-1">
        {(['pages', 'minutes'] as const).map((m) => (
          <button key={m} onClick={() => handleModeChange(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}>
            {m === 'pages' ? '📄 Pages' : '⏱ Minutes'}
          </button>
        ))}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setValue(Math.max(1, value - 1))}
          className="w-11 h-11 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center text-ink-700 transition-colors active:scale-95">
          <Minus className="w-4 h-4" />
        </button>
        <input type="number" value={value} min={1}
          onChange={(e) => setValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-20 text-center font-display text-3xl font-bold text-ink-950 bg-transparent border-none outline-none" />
        <button onClick={() => setValue(value + 1)}
          className="w-11 h-11 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center text-ink-700 transition-colors active:scale-95">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-2 justify-center">
        {(mode === 'pages' ? PAGE_PRESETS : MIN_PRESETS).map((p) => (
          <button key={p} onClick={() => setValue(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              value === p ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Optional notes */}
      <div>
        <button onClick={() => setNotesOpen(!notesOpen)}
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors">
          {notesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Add a note (optional)
        </button>
        {notesOpen && (
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="How was this reading session?"
            rows={2}
            className="mt-2 w-full px-3 py-2 bg-ink-50 border border-ink-100 rounded-xl text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-300 resize-none transition-colors" />
        )}
      </div>

      {/* Quote capture */}
      <div>
        <button onClick={() => setQuoteOpen(!quoteOpen)}
          className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors">
          <Quote className="w-3 h-3" />
          {quoteOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Save a quote (optional)
        </button>
        {quoteOpen && (
          <div className="mt-2 space-y-2">
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="Type a memorable quote from this book…"
              rows={3}
              className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-300 resize-none transition-colors italic"
            />
            <input
              type="number"
              value={quotePage}
              onChange={e => setQuotePage(e.target.value)}
              placeholder="Page number (optional)"
              className="w-full px-3 py-2 bg-ink-50 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand-300"
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading}
        className={`w-full py-3 disabled:opacity-60 text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 ${
          willFinish ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-brand-500 hover:bg-brand-600'
        }`}>
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Logging…</>
        ) : willFinish ? (
          `Finish book · ${totalPages} pages 🎉`
        ) : (
          `Log ${value} ${mode === 'pages' ? 'pages' : 'min'}`
        )}
      </button>
    </div>
  );
}
