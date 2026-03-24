'use client';

import { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/layout/Navigation';
import { BookOpen, Star, Zap, Calendar, Clock, ChevronRight, ChevronLeft, Share2, Loader2 } from 'lucide-react';

interface WrappedData {
  year: number;
  totalBooks: number;
  totalPages: number;
  totalMinutes: number;
  streakDays: number;
  bestMonth: { name: string; count: number } | null;
  topGenres: string[];
  topRated: { title?: string; cover_url?: string | null; rating?: number } | null;
  fastestRead: { title?: string; cover_url?: string | null; days: number } | null;
  avgRating: string | null;
  monthlyBooks: number[];
  allCovers: Array<{ title?: string; cover_url?: string | null }>;
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function WrappedClient() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/wrapped')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.data) setData(j.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 flex items-center justify-center">
        <Navigation />
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-ink-500">Building your Year in Books…</p>
        </div>
      </div>
    );
  }

  if (!data || data.totalBooks === 0) {
    return (
      <div className="min-h-screen bg-paper-50 pt-[52px]">
        <Navigation />
        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-sm space-y-4">
            <BookOpen className="w-12 h-12 text-ink-200 mx-auto" />
            <h1 className="font-display text-2xl font-bold text-ink-800">{new Date().getFullYear()} isn&apos;t over yet!</h1>
            <p className="text-sm text-ink-500">Finish and log some books this year to unlock your Year in Books.</p>
          </div>
        </main>
      </div>
    );
  }

  const slides = buildSlides(data);

  return (
    <div className="min-h-screen bg-paper-50 pt-[52px]">
      <Navigation />
      <main className="pb-12">
        <div className="max-w-sm mx-auto px-4 pt-6 space-y-4">

          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-ink-900">
              {data.year} in Books
            </h1>
            <p className="text-sm text-ink-500 mt-1">Your reading year, wrapped.</p>
          </div>

          {/* Slide card */}
          <div ref={containerRef} className="relative">
            <div
              className="rounded-3xl overflow-hidden shadow-xl select-none"
              style={{ aspectRatio: '9/16', maxHeight: '560px' }}
            >
              {slides[slide]}
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setSlide(s => Math.max(0, s - 1))}
                disabled={slide === 0}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-paper-200 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:bg-paper-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-brand-500' : 'w-2 h-2 bg-ink-200'}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))}
                disabled={slide === slides.length - 1}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-paper-200 flex items-center justify-center text-ink-600 disabled:opacity-30 hover:bg-paper-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `My ${data.year} in Books`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-ink-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-ink-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share your Year in Books
          </button>

        </div>
      </main>
    </div>
  );
}

function buildSlides(d: WrappedData) {
  const totalHours = Math.round(d.totalMinutes / 60);

  const slide1 = (
    <div className="w-full h-full bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-6 gap-1 p-2">
          {d.allCovers.map((c, i) => c.cover_url && (
            <img key={i} src={c.cover_url} alt="" className="aspect-[2/3] object-cover rounded" />
          ))}
        </div>
      </div>
      <div className="relative z-10 space-y-4">
        <p className="text-brand-300 text-xs font-medium tracking-widest uppercase">Your {d.year}</p>
        <p className="text-white font-display text-5xl font-bold">{d.totalBooks}</p>
        <p className="text-white/70 text-lg">books read</p>
        <div className="w-12 h-px bg-brand-500 mx-auto" />
        <p className="text-white/50 text-sm">{d.totalPages.toLocaleString()} pages · {totalHours}h read</p>
        <p className="text-brand-400 text-xs mt-6">Powered by Chapterly</p>
      </div>
    </div>
  );

  const maxMonth = Math.max(...d.monthlyBooks);
  const slide2 = (
    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex flex-col p-8 text-white">
      <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Reading by month</p>
      <p className="font-display text-3xl font-bold mb-6">When you read most</p>
      <div className="flex-1 flex items-end gap-1">
        {d.monthlyBooks.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-white/30 transition-all"
              style={{ height: maxMonth > 0 ? `${Math.max(4, (count / maxMonth) * 100)}%` : '4%' }}
            >
              {count > 0 && (
                <div className="w-full h-full rounded-t-lg bg-white flex items-start justify-center pt-1">
                  <span className="text-[9px] font-bold text-brand-700">{count}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] text-white/60">{MONTH_LABELS[i]}</span>
          </div>
        ))}
      </div>
      {d.bestMonth && (
        <p className="mt-4 text-white/80 text-sm">
          Your best month was <strong className="text-white">{d.bestMonth.name}</strong> with {d.bestMonth.count} book{d.bestMonth.count !== 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );

  const slide3 = (
    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center p-8 text-center text-white space-y-5">
      <Zap className="w-10 h-10" />
      <p className="font-display text-4xl font-bold">{d.streakDays}</p>
      <p className="text-xl text-white/80">streak days this year</p>
      <div className="w-12 h-px bg-white/40" />
      {d.totalPages > 0 && (
        <p className="text-sm text-white/70">
          That&apos;s {d.totalPages.toLocaleString()} pages across {d.totalBooks} books.
          {totalHours > 0 && ` You spent ${totalHours} hours reading.`}
        </p>
      )}
    </div>
  );

  const slide4 = (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex flex-col items-center justify-center p-8 text-center text-white space-y-6">
      <Star className="w-8 h-8 fill-white text-white" />
      <p className="text-white/70 text-sm uppercase tracking-wider">Your top genres</p>
      {d.topGenres.length > 0 ? (
        <div className="space-y-2">
          {d.topGenres.map((g, i) => (
            <div key={g} className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white/30">#{i + 1}</span>
              <span className="font-display text-xl font-bold">{g}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/70 text-sm">Not enough genre data yet.</p>
      )}
      {d.avgRating && (
        <p className="text-white/60 text-sm">Average rating: {d.avgRating}★</p>
      )}
    </div>
  );

  const slide5 = (
    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-8 text-white space-y-4">
      {d.topRated ? (
        <>
          <p className="text-white/70 text-xs uppercase tracking-widest">Your highest-rated book</p>
          {d.topRated.cover_url && (
            <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
              <img src={d.topRated.cover_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="font-display text-xl font-bold text-center">{d.topRated.title}</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <Star key={n} className={`w-5 h-5 ${n <= Math.round(d.topRated!.rating ?? 0) ? 'fill-white text-white' : 'text-white/30'}`} />
            ))}
          </div>
        </>
      ) : (
        <>
          <BookOpen className="w-10 h-10" />
          <p className="font-display text-xl font-bold">Rate your books</p>
          <p className="text-white/70 text-sm text-center">Rate the books you read to unlock your top picks next year.</p>
        </>
      )}
      {d.fastestRead && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-xs uppercase tracking-wide">Fastest read</p>
          <p className="text-sm font-semibold">{d.fastestRead.title}</p>
          <div className="flex items-center justify-center gap-1 text-white/70 text-xs mt-0.5">
            <Clock className="w-3 h-3" />{d.fastestRead.days} day{d.fastestRead.days !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );

  const slide6 = (
    <div className="w-full h-full bg-ink-900 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <p className="text-brand-400 text-xs font-medium tracking-widest uppercase">That&apos;s a wrap on {d.year}</p>
      <p className="font-display text-4xl font-bold text-white">{d.totalBooks} books.</p>
      <p className="text-ink-300 text-sm leading-relaxed max-w-xs">
        {d.totalPages.toLocaleString()} pages. {d.streakDays} streak days. {d.topGenres[0] ? `A love for ${d.topGenres[0]}.` : 'A year of reading.'} Here&apos;s to more in {d.year + 1}.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {d.allCovers.slice(0, 9).map((c, i) => (
          <div key={i} className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-ink-800">
            {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-brand-500">
        <Calendar className="w-4 h-4" />
        <p className="text-sm font-medium">Chapterly — Track your reading life</p>
      </div>
    </div>
  );

  return [slide1, slide2, slide3, slide4, slide5, slide6];
}
