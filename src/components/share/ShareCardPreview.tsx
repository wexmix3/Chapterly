'use client';

import { useState, useRef } from 'react';
import { CARD_THEMES, type CardThemeName } from '@/lib/shareCards';
import { Share2, Download, Palette, BookOpen, Flame, BarChart3, Check, Loader2 } from 'lucide-react';

type CardType = 'now_reading' | 'streak' | 'recap';

interface Props {
  bookTitle?: string; bookAuthor?: string; coverUrl?: string | null;
  currentPage?: number; totalPages?: number; streak?: number;
  booksRead?: number; pagesRead?: number;
}

export default function ShareCardPreview({
  bookTitle = 'The Great Gatsby', bookAuthor = 'F. Scott Fitzgerald', coverUrl,
  currentPage = 184, totalPages = 412, streak = 7, booksRead = 12, pagesRead = 3420,
}: Props) {
  const [theme, setTheme] = useState<CardThemeName>('warm');
  const [cardType, setCardType] = useState<CardType>('now_reading');
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = CARD_THEMES[theme];
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const handleShare = async () => {
    setSharing(true);
    const text = cardType === 'now_reading'
      ? `I'm reading "${bookTitle}" by ${bookAuthor} — ${progress}% done! 📚 Track your reading on Chapterly`
      : cardType === 'streak'
      ? `${streak}-day reading streak and counting! 🔥 Track your reading on Chapterly`
      : `I've read ${booksRead} books and ${pagesRead.toLocaleString()} pages recently 📚 Track yours on Chapterly`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'My Reading Update', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
    setSharing(false);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `chapterly-${cardType}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card type selector */}
      <div className="flex gap-2">
        {([
          { value: 'now_reading', icon: <BookOpen className="w-4 h-4" />, label: 'Now Reading' },
          { value: 'streak', icon: <Flame className="w-4 h-4" />, label: 'Streak' },
          { value: 'recap', icon: <BarChart3 className="w-4 h-4" />, label: 'Recap' },
        ] as const).map((ct) => (
          <button key={ct.value} onClick={() => setCardType(ct.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${cardType === ct.value ? 'bg-brand-500 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'}`}>
            {ct.icon} {ct.label}
          </button>
        ))}
      </div>

      {/* Card preview (9:16) */}
      <div ref={cardRef} className="share-card aspect-[9/16] max-w-[280px] mx-auto p-6 flex flex-col justify-between relative overflow-hidden" style={{ background: t.bgGradient }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        <p className="relative text-xs tracking-[3px] uppercase" style={{ color: t.textSecondary }}>📖 Chapterly</p>

        <div className="relative flex-1 flex flex-col justify-center">
          {cardType === 'now_reading' && (<>
            <div className="w-16 h-24 rounded-md mb-4 overflow-hidden" style={{ background: t.accent + '22', border: `1px solid ${t.accent}44` }}>
              {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">📚</div>}
            </div>
            <p className="text-lg font-bold leading-tight mb-1" style={{ color: t.text, fontFamily: 'Georgia' }}>{bookTitle}</p>
            <p className="text-xs mb-4" style={{ color: t.textSecondary }}>by {bookAuthor}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]" style={{ color: t.textSecondary }}>
                <span>Page {currentPage} of {totalPages}</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.accent + '33' }}>
                <div className="h-full rounded-full progress-fill" style={{ width: `${progress}%`, background: t.accent }} />
              </div>
            </div>
          </>)}

          {cardType === 'streak' && (
            <div className="text-center">
              <p className="text-5xl mb-2">🔥</p>
              <p className="text-4xl font-bold" style={{ color: t.text, fontFamily: 'Georgia' }}>{streak}</p>
              <p className="text-sm mt-1" style={{ color: t.textSecondary }}>day streak</p>
              <p className="text-xs mt-6" style={{ color: t.accent }}>Reading instead of doomscrolling</p>
            </div>
          )}

          {cardType === 'recap' && (
            <div className="space-y-4">
              <p className="text-xs tracking-[2px] uppercase" style={{ color: t.accent }}>This Month</p>
              <div className="space-y-3">
                <div><p className="text-3xl font-bold" style={{ color: t.text, fontFamily: 'Georgia' }}>{booksRead}</p><p className="text-xs" style={{ color: t.textSecondary }}>books finished</p></div>
                <div><p className="text-3xl font-bold" style={{ color: t.text, fontFamily: 'Georgia' }}>{pagesRead.toLocaleString()}</p><p className="text-xs" style={{ color: t.textSecondary }}>pages turned</p></div>
              </div>
            </div>
          )}
        </div>

        {cardType === 'now_reading' && streak > 0 && (
          <div className="relative flex items-center gap-1" style={{ color: t.badge }}>
            <span className="text-sm">🔥</span><span className="text-xs font-medium">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Theme selector */}
      <div className="flex items-center justify-center gap-2">
        <Palette className="w-4 h-4 text-ink-400" />
        {(Object.keys(CARD_THEMES) as CardThemeName[]).map((name) => (
          <button key={name} onClick={() => setTheme(name)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${theme === name ? 'border-brand-500 scale-110' : 'border-ink-200'}`}
            style={{ background: CARD_THEMES[name].bg }} title={name} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={handleShare} disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl font-medium transition-colors">
          {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
        </button>
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-ink-50 hover:bg-ink-100 disabled:opacity-60 text-ink-600 rounded-xl font-medium transition-colors">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
