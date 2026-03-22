'use client';

import { useEffect, useState } from 'react';
import { X, Share2, BookOpen, Trophy, Flame, Star } from 'lucide-react';

export type CelebrationEvent =
  | { type: 'book_finished'; bookTitle: string; bookCover?: string | null }
  | { type: 'streak'; days: number }
  | { type: 'challenge_complete'; booksRead: number; goal: number }
  | { type: 'pages_milestone'; pages: number };

interface Props {
  event: CelebrationEvent | null;
  onClose: () => void;
  onShare?: () => void;
}

function Confetti() {
  const pieces = Array.from({ length: 30 });
  const colors = ['#6d6aff', '#ff6584', '#ffd166', '#06d6a0', '#118ab2'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.6}s`;
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute top-0 animate-confetti-fall"
            style={{
              left,
              animationDelay: delay,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function getContent(event: CelebrationEvent) {
  switch (event.type) {
    case 'book_finished':
      return {
        icon: <BookOpen className="w-10 h-10 text-brand-500" />,
        emoji: '🎉',
        headline: 'You finished a book!',
        sub: event.bookTitle,
        shareText: `Just finished "${event.bookTitle}" on Chapterly! 📖`,
      };
    case 'streak':
      return {
        icon: <Flame className="w-10 h-10 text-orange-500" />,
        emoji: '🔥',
        headline: `${event.days}-day streak!`,
        sub: 'Keep the momentum going',
        shareText: `I'm on a ${event.days}-day reading streak on Chapterly! 🔥`,
      };
    case 'challenge_complete':
      return {
        icon: <Trophy className="w-10 h-10 text-amber-500" />,
        emoji: '🏆',
        headline: 'Reading goal complete!',
        sub: `${event.booksRead} of ${event.goal} books read this year`,
        shareText: `I hit my reading goal of ${event.goal} books this year on Chapterly! 🏆`,
      };
    case 'pages_milestone':
      return {
        icon: <Star className="w-10 h-10 text-yellow-500" />,
        emoji: '⭐',
        headline: `${event.pages.toLocaleString()} pages read!`,
        sub: 'You\'re on a roll',
        shareText: `I've read ${event.pages.toLocaleString()} pages on Chapterly! ⭐`,
      };
  }
}

export default function CelebrationModal({ event, onClose, onShare }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);
    }
  }, [event]);

  if (!event || !visible) return null;

  const { icon, emoji, headline, sub, shareText } = getContent(event);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText + '\n\nchapterly.app' });
      } catch {
        // dismissed
      }
    } else {
      await navigator.clipboard.writeText(shareText + '\n\nchapterly.app').catch(() => {});
      alert('Copied to clipboard!');
    }
    onShare?.();
  };

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-ink-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <Confetti />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors z-10"
        >
          <X className="w-4 h-4 text-ink-500" />
        </button>

        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{emoji}</div>
          <div className="flex justify-center mb-4">{icon}</div>
          <h2 className="text-2xl font-display font-bold text-ink-950 dark:text-paper-50 mb-2">
            {headline}
          </h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm mb-6">{sub}</p>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 text-sm font-medium hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
            >
              Continue reading
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
