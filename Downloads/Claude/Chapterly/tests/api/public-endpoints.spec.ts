/**
 * API contract tests — public endpoints
 *
 * Tests endpoints that must be accessible WITHOUT authentication, and verifies
 * that they enforce their own validation rules (query length, etc.).
 *
 * Run:  npx playwright test tests/api/public-endpoints.spec.ts --project=api
 */
import { test, expect } from '@playwright/test';

// ── /api/health ───────────────────────────────────────────────────────────────

test.describe('GET /api/health', () => {
  test('responds with 200 or 503 (never 4xx)', async ({ request }) => {
    const response = await request.get('/api/health');
    expect([200, 503]).toContain(response.status());
  });

  test('response body has required shape: { ok, checks, total_ms }', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    expect(typeof body.ok).toBe('boolean');
    expect(typeof body.checks).toBe('object');
    expect(body.checks).not.toBeNull();
    expect(typeof body.total_ms).toBe('number');
    expect(body.total_ms).toBeGreaterThanOrEqual(0);
  });

  test('checks.env is present and has ok field', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    expect(body.checks).toHaveProperty('env');
    expect(typeof body.checks.env.ok).toBe('boolean');
  });

  test('checks.db is present and has ok field', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    expect(body.checks).toHaveProperty('db');
    expect(typeof body.checks.db.ok).toBe('boolean');
  });

  test('status code matches body.ok (200 when ok=true, 503 when ok=false)', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    if (body.ok) {
      expect(response.status()).toBe(200);
    } else {
      expect(response.status()).toBe(503);
    }
  });
});

// ── /api/books/search — input validation ─────────────────────────────────────

test.describe('GET /api/books/search — input validation', () => {
  test('returns 400 when query param is absent (defaults to empty string)', async ({ request }) => {
    const response = await request.get('/api/books/search');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 when q is 1 character (below minimum length of 2)', async ({ request }) => {
    const response = await request.get('/api/books/search?q=a');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toMatch(/short/i);
  });

  test('returns 400 when q is empty string', async ({ request }) => {
    const response = await request.get('/api/books/search?q=');
    expect(response.status()).toBe(400);
  });

  test('accepts q with exactly 2 characters (does not return 400)', async ({ request }) => {
    const response = await request.get('/api/books/search?q=ab');
    // 200 = search worked; 429 = rate limited; 502 = external API down — all OK here
    expect(response.status()).not.toBe(400);
  });

  test('returns results array (or graceful error) for valid query', async ({ request }) => {
    const response = await request.get('/api/books/search?q=harry+potter');
    const body = await response.json();

    if (response.status() === 200) {
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      // Results should have expected book shape
      if (body.data.length > 0) {
        const first = body.data[0];
        expect(typeof first.title).toBe('string');
        expect(Array.isArray(first.authors)).toBe(true);
        expect(typeof first.source).toBe('string');
        expect(typeof first.source_id).toBe('string');
      }
    } else if (response.status() === 502) {
      // External search (Google Books / OpenLibrary) is temporarily down — acceptable
      expect(body).toHaveProperty('error');
    } else if (response.status() === 429) {
      // Rate limited
      expect(body).toHaveProperty('error');
    } else {
      // Unexpected status
      throw new Error(`Unexpected status ${response.status()} for book search`);
    }
  });

  test('response content-type is application/json', async ({ request }) => {
    const response = await request.get('/api/books/search?q=a');
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

// ── /api/discover/trending — public discovery ─────────────────────────────────

test.describe('GET /api/discover/trending', () => {
  test('returns 401 without auth (trending is personalised)', async ({ request }) => {
    const response = await request.get('/api/discover/trending');
    // Trending is a protected route — confirm it doesn't leak data
    expect(response.status()).toBe(401);
  });
});

// ── /api/auth/signout ─────────────────────────────────────────────────────────

test.describe('POST /api/auth/signout', () => {
  test('returns 200 even when called without an active session', async ({ request }) => {
    // Sign-out should never crash the server — idempotent behaviour
    const response = await request.post('/api/auth/signout');
    expect([200, 302, 307]).toContain(response.status());
  });
});

// ── /api/stats/public — public profile stats ─────────────────────────────────

test.describe('GET /api/stats/public', () => {
  test('returns 400 or 404 when no handle param is given', async ({ request }) => {
    const response = await request.get('/api/stats/public');
    expect([400, 404, 422]).toContain(response.status());
  });
});
