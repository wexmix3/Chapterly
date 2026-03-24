export const XP_REWARDS = {
  PAGE_READ: 1,           // per page logged
  BOOK_FINISHED: 50,      // per book completed
  REVIEW_WRITTEN: 25,     // per review submitted
  FRIEND_FOLLOWED: 10,    // per person followed
  STREAK_DAY: 5,          // per streak day maintained
  FIRST_BOOK: 100,        // bonus: first book ever
  CHALLENGE_COMPLETE: 75, // per reading challenge completed
} as const;

export type XPAction = keyof typeof XP_REWARDS;

/** Level = floor(sqrt(xp / 50)) + 1, capped at 50 */
export function levelFromXP(xp: number): number {
  return Math.min(50, Math.floor(Math.sqrt(xp / 50)) + 1);
}

/** Minimum XP required to reach the given level */
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 50;
}

/** Minimum XP required to reach the level after current */
export function xpForNextLevel(level: number): number {
  return level * level * 50;
}

/** Progress percentage (0-100) toward the next level */
export function progressToNextLevel(xp: number): number {
  const level = levelFromXP(xp);
  if (level >= 50) return 100;
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForNextLevel(level);
  return Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
}

/** Human-readable level title */
export function levelTitle(level: number): string {
  if (level <= 5)  return 'Newcomer';
  if (level <= 10) return 'Bookworm';
  if (level <= 20) return 'Avid Reader';
  if (level <= 30) return 'Literary Scout';
  if (level <= 40) return 'Book Enthusiast';
  if (level <= 49) return 'Reading Master';
  return 'Legend';
}
