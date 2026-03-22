export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ── Achievement definitions ────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'reading' | 'streak' | 'social' | 'milestone';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;   // 0-100
  target?: number;
  current?: number;
}

const ACHIEVEMENTS = [
  // Reading volume
  { id: 'first_book',      title: 'First Chapter',      description: 'Finish your first book',         emoji: '📖', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 1 },
  { id: 'five_books',      title: 'Bookworm',           description: 'Finish 5 books',                 emoji: '📚', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 5,  target: 5 },
  { id: 'ten_books',       title: 'Library Card',       description: 'Finish 10 books',                emoji: '🏛️', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 10, target: 10 },
  { id: 'twenty_five',     title: 'Shelf Builder',      description: 'Finish 25 books',                emoji: '🗄️', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 25, target: 25 },
  { id: 'fifty_books',     title: 'Half Century',       description: 'Finish 50 books',                emoji: '🎯', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 50, target: 50 },
  { id: 'hundred_books',   title: 'Centurion',          description: 'Finish 100 books',               emoji: '💯', category: 'reading'   as const, req: (s: Stats) => s.booksRead >= 100, target: 100 },
  // Pages
  { id: 'thousand_pages',  title: 'Page Turner',        description: 'Read 1,000 pages',               emoji: '📄', category: 'milestone' as const, req: (s: Stats) => s.pagesRead >= 1000,  target: 1000 },
  { id: 'ten_k_pages',     title: 'Speed Reader',       description: 'Read 10,000 pages',              emoji: '⚡', category: 'milestone' as const, req: (s: Stats) => s.pagesRead >= 10000, target: 10000 },
  // Streaks
  { id: 'streak_3',        title: 'Getting Started',    description: '3-day reading streak',           emoji: '🔥', category: 'streak'    as const, req: (s: Stats) => s.maxStreak >= 3 },
  { id: 'streak_7',        title: 'Week Warrior',       description: '7-day reading streak',           emoji: '🔥', category: 'streak'    as const, req: (s: Stats) => s.maxStreak >= 7,  target: 7 },
  { id: 'streak_30',       title: 'Month of Reading',   description: '30-day reading streak',          emoji: '🌟', category: 'streak'    as const, req: (s: Stats) => s.maxStreak >= 30, target: 30 },
  { id: 'streak_100',      title: 'Iron Reader',        description: '100-day reading streak',         emoji: '🏆', category: 'streak'    as const, req: (s: Stats) => s.maxStreak >= 100, target: 100 },
  // Social
  { id: 'first_review',    title: 'Critic',             description: 'Write your first review',        emoji: '✍️', category: 'social'    as const, req: (s: Stats) => s.reviewsWritten >= 1 },
  { id: 'ten_reviews',     title: 'Literary Critic',    description: 'Write 10 reviews',               emoji: '🗒️', category: 'social'    as const, req: (s: Stats) => s.reviewsWritten >= 10, target: 10 },
  { id: 'first_follow',    title: 'Social Butterfly',   description: 'Follow another reader',          emoji: '👥', category: 'social'    as const, req: (s: Stats) => s.following >= 1 },
];

interface Stats {
  booksRead: number;
  pagesRead: number;
  maxStreak: number;
  reviewsWritten: number;
  following: number;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Gather stats in parallel
  const [booksRes, pagesRes, streakRes, reviewsRes, followRes] = await Promise.all([
    supabase.from('user_books').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'read'),
    supabase.from('sessions').select('pages_delta').eq('user_id', user.id),
    supabase.from('users').select('current_streak, longest_streak').eq('id', user.id).maybeSingle(),
    supabase.from('user_books').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('review_text', 'is', null),
    supabase.from('social_follow').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
  ]);

  const stats: Stats = {
    booksRead: booksRes.count ?? 0,
    pagesRead: (pagesRes.data ?? []).reduce((sum, s) => sum + (s.pages_delta ?? 0), 0),
    maxStreak: Math.max(streakRes.data?.longest_streak ?? 0, streakRes.data?.current_streak ?? 0),
    reviewsWritten: reviewsRes.count ?? 0,
    following: followRes.count ?? 0,
  };

  const achievements: Achievement[] = ACHIEVEMENTS.map(({ id, title, description, emoji, category, req, target }) => {
    const unlocked = req(stats);
    let current: number | undefined;
    let progress: number | undefined;

    if (target !== undefined) {
      // Map each achievement to its stat
      if (category === 'reading') current = stats.booksRead;
      else if (id.startsWith('streak')) current = stats.maxStreak;
      else if (id.includes('pages')) current = stats.pagesRead;
      else if (id.includes('review')) current = stats.reviewsWritten;
      progress = Math.min(100, Math.round(((current ?? 0) / target) * 100));
    }

    return { id, title, description, emoji, category, unlocked, progress, target, current };
  });

  return NextResponse.json({ data: achievements, stats });
}
