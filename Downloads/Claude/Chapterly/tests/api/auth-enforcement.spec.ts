/**
 * API contract tests — authentication enforcement
 *
 * Every protected route MUST return HTTP 401 when called without a valid
 * session cookie.  These tests run against the live production URL and
 * require no browser.  They are intentionally fast: each is a single
 * un-authenticated HTTP request.
 *
 * If a route appears here and starts returning a non-401 status on unauthenticated
 * requests, that is a security regression that must be fixed immediately.
 *
 * Run:  npx playwright test tests/api/auth-enforcement.spec.ts --project=api
 */
import { test, expect } from '@playwright/test';

// ── Route inventory ───────────────────────────────────────────────────────────
//
// Format: [METHOD, PATH]
// All routes listed here must require authentication.

const PROTECTED: [string, string][] = [
  // ── Reading sessions
  ['GET',    '/api/sessions'],
  ['POST',   '/api/sessions'],

  // ── User library (shelf)
  ['GET',    '/api/user-books'],
  ['POST',   '/api/user-books'],
  ['PATCH',  '/api/user-books'],

  // ── Statistics
  ['GET',    '/api/stats'],
  ['GET',    '/api/stats/rich'],
  ['GET',    '/api/stats/genres'],
  ['GET',    '/api/stats/calendar'],

  // ── Social
  ['GET',    '/api/feed'],
  ['GET',    '/api/social'],
  ['GET',    '/api/leaderboard'],
  ['GET',    '/api/people/suggestions'],
  ['GET',    '/api/friend-recommendations'],

  // ── Reviews & comments
  ['GET',    '/api/reviews'],
  ['POST',   '/api/reviews'],
  ['GET',    '/api/comments'],
  ['POST',   '/api/comments'],
  ['GET',    '/api/review-comments'],

  // ── AI features
  ['GET',    '/api/ai/insights'],
  ['POST',   '/api/ai/recommend'],
  ['POST',   '/api/ai/pace'],
  ['POST',   '/api/ai/mood'],
  ['GET',    '/api/ai/dna'],
  ['GET',    '/api/ai/personality'],
  ['GET',    '/api/ai/archetype'],
  ['POST',   '/api/ai/reading-coach'],
  ['POST',   '/api/ai/habit-nudge'],

  // ── Gamification
  ['GET',    '/api/achievements'],
  ['GET',    '/api/quests'],
  ['POST',   '/api/xp/award'],
  ['POST',   '/api/streak/freeze'],

  // ── Profile
  ['GET',    '/api/profile'],
  ['PATCH',  '/api/profile'],

  // ── Account
  ['GET',    '/api/account'],
  ['DELETE', '/api/account'],

  // ── Lists
  ['GET',    '/api/lists'],
  ['POST',   '/api/lists'],

  // ── Clubs
  ['GET',    '/api/clubs'],
  ['POST',   '/api/clubs'],

  // ── Challenges
  ['GET',    '/api/challenges'],
  ['POST',   '/api/challenges'],

  // ── Notifications
  ['GET',    '/api/notifications'],
  ['POST',   '/api/push/subscribe'],

  // ── Referral
  ['GET',    '/api/referral'],
  ['POST',   '/api/referral'],

  // ── Export
  ['GET',    '/api/export'],

  // ── Recommendations
  ['GET',    '/api/recommendations'],

  // ── Reading wrapped
  ['GET',    '/api/wrapped'],

  // ── Reactions
  ['POST',   '/api/reactions'],

  // ── Series
  ['GET',    '/api/series'],

  // ── Quotes (user-specific)
  ['GET',    '/api/quotes'],
  ['POST',   '/api/quotes'],

  // ── Stripe (must not expose billing without auth)
  ['POST',   '/api/stripe/checkout'],
  ['POST',   '/api/stripe/portal'],
];

// ── Dynamic per-route tests ───────────────────────────────────────────────────

for (const [method, path] of PROTECTED) {
  test(`${method} ${path} → 401 (unauthenticated)`, async ({ request }) => {
    let response;

    switch (method) {
      case 'GET':
        response = await request.get(path);
        break;
      case 'POST':
        response = await request.post(path, { data: {} });
        break;
      case 'PATCH':
        response = await request.patch(path, { data: {} });
        break;
      case 'DELETE':
        response = await request.delete(path);
        break;
      default:
        throw new Error(`Unhandled method: ${method}`);
    }

    expect(
      response.status(),
      `${method} ${path} must return 401 for unauthenticated requests`,
    ).toBe(401);
  });
}

// ── Extra: 401 body shape ─────────────────────────────────────────────────────

test('401 response includes JSON error field', async ({ request }) => {
  const response = await request.get('/api/stats');
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toHaveProperty('error');
  expect(typeof body.error).toBe('string');
  expect(body.error.length).toBeGreaterThan(0);
});
