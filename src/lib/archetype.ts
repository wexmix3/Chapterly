// Reader Archetype — computed from reading stats, no AI required

export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;        // Tailwind bg color class
  textColor: string;    // Tailwind text color class
  borderColor: string;  // Tailwind border color class
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'binge_reader',
    name: 'Binge Reader',
    emoji: '🔥',
    description: 'You devour books in one sitting. Once you start, there\'s no stopping.',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  {
    id: 'slow_savorer',
    name: 'Slow Savorer',
    emoji: '🍵',
    description: 'You take your time with every page, letting words sink in deeply.',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    emoji: '🧭',
    description: 'Variety is your spice of life — you roam freely across every genre.',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    emoji: '🌊',
    description: 'You return to the same genres and authors, going ever deeper.',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Your best reading happens after dark, when the world goes quiet.',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'streak_keeper',
    name: 'Streak Keeper',
    emoji: '⚡',
    description: 'Consistency is your superpower. Every day, without fail.',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'serial_starter',
    name: 'Serial Starter',
    emoji: '📚',
    description: 'You love the first chapter energy — always something new to begin.',
    color: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    emoji: '✅',
    description: 'You always finish what you start. DNF is not in your vocabulary.',
    color: 'bg-brand-100',
    textColor: 'text-brand-700',
    borderColor: 'border-brand-200',
  },
];

interface ArchetypeInput {
  booksRead: number;         // total books with status='read'
  avgPagesPerSession: number; // average pages logged per session
  dnfCount: number;           // books with status='dnf'
  genreCount: number;         // distinct subjects/genres
  currentStreak: number;      // consecutive days with a session
  toReadCount: number;        // books on 'to_read' shelf
  topGenreBooks: number;      // books in most-read genre
}

/**
 * Deterministically compute a reader archetype from stats.
 * Returns the archetype id that best fits.
 */
export function computeArchetype(input: ArchetypeInput): string {
  const {
    avgPagesPerSession,
    dnfCount,
    genreCount,
    currentStreak,
    toReadCount,
    booksRead,
    topGenreBooks,
  } = input;

  // Scores: higher = more archetypical fit
  const scores: Record<string, number> = {
    binge_reader: 0,
    slow_savorer: 0,
    genre_explorer: 0,
    deep_diver: 0,
    night_owl: 0,
    streak_keeper: 0,
    serial_starter: 0,
    completionist: 0,
  };

  // Binge reader — high pages per session
  if (avgPagesPerSession >= 80) scores.binge_reader += 3;
  else if (avgPagesPerSession >= 50) scores.binge_reader += 1;

  // Slow savorer — low pages per session but still reading
  if (avgPagesPerSession > 0 && avgPagesPerSession <= 25) scores.slow_savorer += 3;
  else if (avgPagesPerSession <= 40) scores.slow_savorer += 1;

  // Genre explorer — many distinct genres
  if (genreCount >= 8) scores.genre_explorer += 3;
  else if (genreCount >= 5) scores.genre_explorer += 1;

  // Deep diver — most books in one genre (high concentration)
  if (booksRead > 0) {
    const topRatio = topGenreBooks / Math.max(booksRead, 1);
    if (topRatio >= 0.6) scores.deep_diver += 3;
    else if (topRatio >= 0.4) scores.deep_diver += 1;
  }

  // Streak keeper
  if (currentStreak >= 14) scores.streak_keeper += 3;
  else if (currentStreak >= 7) scores.streak_keeper += 2;
  else if (currentStreak >= 3) scores.streak_keeper += 1;

  // Serial starter — big TBR pile
  if (toReadCount >= 20) scores.serial_starter += 3;
  else if (toReadCount >= 10) scores.serial_starter += 1;

  // Completionist — few DNFs relative to read
  if (booksRead >= 5 && dnfCount === 0) scores.completionist += 3;
  else if (booksRead > 0 && dnfCount / booksRead < 0.05) scores.completionist += 1;

  // Night owl is a fallback archetype (sessions data not available here)
  scores.night_owl = 0;

  // Pick highest scoring archetype, defaulting to 'slow_savorer' for new readers
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  if (best[1] === 0 || booksRead < 2) return 'slow_savorer';
  return best[0];
}

export function getArchetype(id: string): Archetype {
  return ARCHETYPES.find(a => a.id === id) ?? ARCHETYPES[1];
}
