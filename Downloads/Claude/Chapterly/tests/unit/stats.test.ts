/**
 * Unit tests for computeStreak() in src/lib/stats.ts
 *
 * These tests are fully deterministic — all calls to new Date() inside the
 * function are frozen to FIXED_TODAY via vi.useFakeTimers / vi.setSystemTime.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeStreak } from '@/lib/stats';
import type { DailyStats } from '@/types';

// ── Fixed point in time ──────────────────────────────────────────────────────
const FIXED_TODAY = '2026-04-12';
const FIXED_NOW = new Date('2026-04-12T12:00:00Z');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal DailyStats row for a given ISO date string. */
function day(date: string): DailyStats {
  return { user_id: 'u-test', date, pages: 20, minutes: 30, sessions_count: 1, is_streak_day: true };
}

/** Return an ISO date string N days before FIXED_TODAY. */
function daysAgo(n: number): string {
  const d = new Date(FIXED_NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate `count` consecutive daily-stats rows ending on `endDate` (inclusive).
 * E.g. consecutiveDays('2026-04-12', 3) → ['2026-04-12', '2026-04-11', '2026-04-10']
 */
function consecutiveDays(endDate: string, count: number): DailyStats[] {
  const end = new Date(endDate + 'T12:00:00Z');
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    return day(d.toISOString().slice(0, 10));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeStreak()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Empty / zero cases ────────────────────────────────────────────────────

  it('returns all-zero StreakInfo for an empty array', () => {
    expect(computeStreak([])).toEqual({
      current: 0,
      longest: 0,
      today_logged: false,
      streak_protection_available: false,
    });
  });

  // ── Single-day cases ──────────────────────────────────────────────────────

  it('counts a single day TODAY as streak of 1 with today_logged=true', () => {
    const result = computeStreak([day(FIXED_TODAY)]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
    expect(result.today_logged).toBe(true);
    expect(result.streak_protection_available).toBe(false); // < 3
  });

  it('counts a single day YESTERDAY as streak of 1 with today_logged=false', () => {
    const result = computeStreak([day(daysAgo(1))]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
    expect(result.today_logged).toBe(false);
  });

  it('does NOT count a day 2+ days ago as an active streak (current=0)', () => {
    const result = computeStreak([day(daysAgo(2))]);
    expect(result.current).toBe(0);
    // Even though no active streak, the user DID read that day — longest must be 1.
    expect(result.longest).toBe(1);
    expect(result.today_logged).toBe(false);
  });

  // ── Consecutive-day streaks ───────────────────────────────────────────────

  it('computes a 3-day streak ending today', () => {
    const result = computeStreak(consecutiveDays(FIXED_TODAY, 3));
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
    expect(result.today_logged).toBe(true);
    expect(result.streak_protection_available).toBe(true); // >= 3
  });

  it('computes a 7-day streak ending today', () => {
    const result = computeStreak(consecutiveDays(FIXED_TODAY, 7));
    expect(result.current).toBe(7);
    expect(result.longest).toBe(7);
    expect(result.today_logged).toBe(true);
    expect(result.streak_protection_available).toBe(true);
  });

  it('computes a 7-day streak ending yesterday (today not logged)', () => {
    const result = computeStreak(consecutiveDays(daysAgo(1), 7));
    expect(result.current).toBe(7);
    expect(result.today_logged).toBe(false);
    expect(result.streak_protection_available).toBe(true);
  });

  it('computes a 30-day streak correctly', () => {
    const result = computeStreak(consecutiveDays(FIXED_TODAY, 30));
    expect(result.current).toBe(30);
    expect(result.longest).toBe(30);
  });

  // ── streak_protection_available boundary ─────────────────────────────────

  it('streak_protection_available is false at 2 days', () => {
    expect(computeStreak(consecutiveDays(FIXED_TODAY, 2)).streak_protection_available).toBe(false);
  });

  it('streak_protection_available is true at exactly 3 days', () => {
    expect(computeStreak(consecutiveDays(FIXED_TODAY, 3)).streak_protection_available).toBe(true);
  });

  // ── Gap / broken streak ───────────────────────────────────────────────────

  it('breaks streak on a gap: today + yesterday + 3 days ago = current 2', () => {
    const days = [day(FIXED_TODAY), day(daysAgo(1)), day(daysAgo(3))];
    const result = computeStreak(days);
    expect(result.current).toBe(2);
  });

  it('tracks longest streak across multiple separate runs', () => {
    // Run 1: 5 consecutive days ending 20 days ago
    const run1 = consecutiveDays(daysAgo(20), 5);
    // Run 2: 3 consecutive days ending today
    const run2 = consecutiveDays(FIXED_TODAY, 3);

    const result = computeStreak([...run1, ...run2]);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(5);
  });

  it('longest equals current when only one run exists', () => {
    const result = computeStreak(consecutiveDays(FIXED_TODAY, 10));
    expect(result.longest).toBe(result.current);
  });

  // ── Order independence ────────────────────────────────────────────────────

  it('handles unordered input — result is same regardless of input order', () => {
    const ordered = consecutiveDays(FIXED_TODAY, 5);
    const shuffled = [...ordered].sort(() => Math.random() - 0.5);

    const r1 = computeStreak(ordered);
    const r2 = computeStreak(shuffled);

    expect(r1).toEqual(r2);
  });

  // ── Edge: same-day duplicate rows ────────────────────────────────────────

  it('handles duplicate date entries gracefully (does not double-count)', () => {
    // Two rows for the same date — should still be streak of 1
    const result = computeStreak([day(FIXED_TODAY), day(FIXED_TODAY)]);
    expect(result.current).toBe(1);
    expect(result.today_logged).toBe(true);
  });
});
