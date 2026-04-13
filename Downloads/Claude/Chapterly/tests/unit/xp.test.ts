/**
 * Unit tests for XP / level math in src/lib/xp.ts
 *
 * Formulae under test:
 *   levelFromXP(xp)       = min(50, floor(sqrt(xp / 50)) + 1)
 *   xpForLevel(level)     = (level - 1)^2 * 50
 *   xpForNextLevel(level) = level^2 * 50
 *   progressToNextLevel(xp) = round(((xp - xpForLevel(L)) / (xpForNextLevel(L) - xpForLevel(L))) * 100)
 */
import { describe, it, expect } from 'vitest';
import {
  levelFromXP,
  xpForLevel,
  xpForNextLevel,
  progressToNextLevel,
  levelTitle,
  XP_REWARDS,
} from '@/lib/xp';

// ── levelFromXP ───────────────────────────────────────────────────────────────

describe('levelFromXP()', () => {
  it('returns level 1 at 0 XP', () => expect(levelFromXP(0)).toBe(1));
  it('returns level 1 at 1 XP', () => expect(levelFromXP(1)).toBe(1));
  it('returns level 1 at 49 XP (one below level 2 threshold)', () => expect(levelFromXP(49)).toBe(1));

  it('returns level 2 at exactly 50 XP', () => expect(levelFromXP(50)).toBe(2));
  it('returns level 2 at 199 XP (one below level 3 threshold)', () => expect(levelFromXP(199)).toBe(2));

  it('returns level 3 at 200 XP', () => expect(levelFromXP(200)).toBe(3));
  it('returns level 3 at 449 XP (one below level 4 threshold)', () => expect(levelFromXP(449)).toBe(3));

  it('returns level 4 at 450 XP', () => expect(levelFromXP(450)).toBe(4));
  it('returns level 5 at 800 XP', () => expect(levelFromXP(800)).toBe(5));

  it('caps at level 50 regardless of XP amount', () => {
    expect(levelFromXP(999_999_999)).toBe(50);
    expect(levelFromXP(1_000_000)).toBe(50);
  });

  it('level increases monotonically as XP increases', () => {
    const samples = [0, 50, 200, 450, 800, 1250, 5000, 10000];
    let prev = levelFromXP(samples[0]);
    for (const xp of samples.slice(1)) {
      const lvl = levelFromXP(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });
});

// ── xpForLevel ────────────────────────────────────────────────────────────────

describe('xpForLevel()', () => {
  it('level 1 requires 0 XP', () => expect(xpForLevel(1)).toBe(0));
  it('level 2 requires 50 XP', () => expect(xpForLevel(2)).toBe(50));
  it('level 3 requires 200 XP', () => expect(xpForLevel(3)).toBe(200));
  it('level 4 requires 450 XP', () => expect(xpForLevel(4)).toBe(450));
  it('level 5 requires 800 XP', () => expect(xpForLevel(5)).toBe(800));
  it('level 10 requires 4050 XP', () => expect(xpForLevel(10)).toBe(4050));

  it('is the left-inverse of levelFromXP at each level boundary (1–10)', () => {
    for (let level = 1; level <= 10; level++) {
      // Exactly at the threshold for this level → must be at that level
      expect(levelFromXP(xpForLevel(level))).toBe(level);
      // One XP below the threshold → must be one level below (except level 1)
      if (level > 1) {
        expect(levelFromXP(xpForLevel(level) - 1)).toBe(level - 1);
      }
    }
  });
});

// ── xpForNextLevel ────────────────────────────────────────────────────────────

describe('xpForNextLevel()', () => {
  it('level 1 → next threshold 50', () => expect(xpForNextLevel(1)).toBe(50));
  it('level 2 → next threshold 200', () => expect(xpForNextLevel(2)).toBe(200));
  it('level 3 → next threshold 450', () => expect(xpForNextLevel(3)).toBe(450));
  it('level 4 → next threshold 800', () => expect(xpForNextLevel(4)).toBe(800));

  it('xpForNextLevel(n) equals xpForLevel(n + 1) for levels 1–9', () => {
    for (let level = 1; level <= 9; level++) {
      expect(xpForNextLevel(level)).toBe(xpForLevel(level + 1));
    }
  });

  it('thresholds are strictly increasing', () => {
    let prev = xpForNextLevel(1);
    for (let level = 2; level <= 10; level++) {
      const next = xpForNextLevel(level);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });
});

// ── progressToNextLevel ───────────────────────────────────────────────────────

describe('progressToNextLevel()', () => {
  // Level 1 window: 0 → 50 XP
  it('returns 0 at 0 XP (start of level 1)', () => expect(progressToNextLevel(0)).toBe(0));
  it('returns 50 at 25 XP (halfway to level 2)', () => expect(progressToNextLevel(25)).toBe(50));
  it('returns 98 at 49 XP (just before level 2)', () => {
    // 49/50 * 100 = 98
    expect(progressToNextLevel(49)).toBe(98);
  });

  // Level 2 window: 50 → 200 XP (width 150)
  it('returns 0 at 50 XP (start of level 2)', () => expect(progressToNextLevel(50)).toBe(0));
  it('returns 50 at 125 XP (halfway between level 2 and 3)', () => expect(progressToNextLevel(125)).toBe(50));

  // Level 3 window: 200 → 450 XP (width 250)
  it('returns 0 at 200 XP (start of level 3)', () => expect(progressToNextLevel(200)).toBe(0));
  it('returns 50 at 325 XP (halfway between level 3 and 4)', () => expect(progressToNextLevel(325)).toBe(50));

  // Level 50 cap
  it('returns 100 at max level (50)', () => {
    expect(progressToNextLevel(999_999_999)).toBe(100);
  });

  it('is always in range [0, 100] for any non-negative XP', () => {
    const samples = [0, 1, 25, 49, 50, 100, 199, 200, 500, 1000, 5000, 50000, 999999];
    for (const xp of samples) {
      const p = progressToNextLevel(xp);
      expect(p, `XP=${xp}`).toBeGreaterThanOrEqual(0);
      expect(p, `XP=${xp}`).toBeLessThanOrEqual(100);
    }
  });
});

// ── levelTitle ────────────────────────────────────────────────────────────────

describe('levelTitle()', () => {
  const cases: Array<[number[], string]> = [
    [[1, 2, 3, 4, 5], 'Newcomer'],
    [[6, 7, 8, 9, 10], 'Bookworm'],
    [[11, 15, 20], 'Avid Reader'],
    [[21, 25, 30], 'Literary Scout'],
    [[31, 35, 40], 'Book Enthusiast'],
    [[41, 45, 49], 'Reading Master'],
    [[50], 'Legend'],
  ];

  for (const [levels, title] of cases) {
    it(`levels ${levels[0]}–${levels[levels.length - 1]} are titled "${title}"`, () => {
      for (const level of levels) {
        expect(levelTitle(level), `level ${level}`).toBe(title);
      }
    });
  }

  it('covers all levels 1–50 without undefined', () => {
    for (let level = 1; level <= 50; level++) {
      expect(typeof levelTitle(level)).toBe('string');
      expect(levelTitle(level).length).toBeGreaterThan(0);
    }
  });
});

// ── XP_REWARDS contract ───────────────────────────────────────────────────────

describe('XP_REWARDS constants', () => {
  it('all reward values are positive integers', () => {
    for (const [key, value] of Object.entries(XP_REWARDS)) {
      expect(value, key).toBeGreaterThan(0);
      expect(Number.isInteger(value), key).toBe(true);
    }
  });

  it('BOOK_FINISHED > REVIEW_WRITTEN > STREAK_DAY (incentive ordering)', () => {
    expect(XP_REWARDS.BOOK_FINISHED).toBeGreaterThan(XP_REWARDS.REVIEW_WRITTEN);
    expect(XP_REWARDS.REVIEW_WRITTEN).toBeGreaterThan(XP_REWARDS.STREAK_DAY);
  });

  it('FIRST_BOOK is the highest one-time bonus', () => {
    expect(XP_REWARDS.FIRST_BOOK).toBeGreaterThan(XP_REWARDS.BOOK_FINISHED);
  });
});
