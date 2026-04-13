/**
 * Unit tests for createMessageWithRetry() in src/lib/ai-retry.ts
 *
 * Retry contract:
 *   - 429 (rate limit) and 529 (overloaded) → retry, up to 3 total attempts
 *   - Delays between retries: 1500ms then 3000ms  (fake-timers used)
 *   - Any other APIError status  → throw immediately (no retry)
 *   - Non-APIError exceptions    → throw immediately (no retry)
 *   - Success on any attempt     → return the response
 *
 * The Anthropic SDK is mocked so tests run entirely in-process with no
 * network calls and near-instant timer resolution.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── SDK mock — hoisted above all imports by Vitest ──────────────────────────
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    readonly status: number;
    constructor(status: number, message?: string) {
      super(message ?? `HTTP ${status}`);
      this.name = 'APIError';
      this.status = status;
    }
  }
  return {
    default: class Anthropic {
      static readonly APIError = APIError;
    },
    APIError,
  };
});

import { createMessageWithRetry } from '@/lib/ai-retry';
import Anthropic from '@anthropic-ai/sdk';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PARAMS = {
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 100,
  messages: [{ role: 'user' as const, content: 'ping' }],
};

const MOCK_RESPONSE = { id: 'msg_test', content: [{ type: 'text', text: 'pong' }] };

type FakeClient = { messages: { create: ReturnType<typeof vi.fn> } };

function makeClient(): FakeClient {
  return { messages: { create: vi.fn() } };
}

/** Build an Anthropic.APIError with the given HTTP status (uses mocked class). */
function apiError(status: number): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Anthropic as any).APIError(status);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createMessageWithRetry()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns the response on a first-attempt success (no retries)', async () => {
    const client = makeClient();
    client.messages.create.mockResolvedValueOnce(MOCK_RESPONSE);

    const result = await createMessageWithRetry(client as unknown as Anthropic, PARAMS);

    expect(result).toBe(MOCK_RESPONSE);
    expect(client.messages.create).toHaveBeenCalledTimes(1);
    expect(client.messages.create).toHaveBeenCalledWith(PARAMS);
  });

  // ── 429 retry logic ───────────────────────────────────────────────────────

  it('retries once on 429 and returns result on 2nd attempt', async () => {
    const client = makeClient();
    client.messages.create
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(MOCK_RESPONSE);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(MOCK_RESPONSE);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
  });

  it('retries twice on 429 and returns result on 3rd attempt', async () => {
    const client = makeClient();
    client.messages.create
      .mockRejectedValueOnce(apiError(429))
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(MOCK_RESPONSE);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(MOCK_RESPONSE);
    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  // ── 529 retry logic ───────────────────────────────────────────────────────

  it('retries on 529 and returns result on 2nd attempt', async () => {
    const client = makeClient();
    client.messages.create
      .mockRejectedValueOnce(apiError(529))
      .mockResolvedValueOnce(MOCK_RESPONSE);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(MOCK_RESPONSE);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
  });

  it('retries on 529/429 mixed and returns result on 3rd attempt', async () => {
    const client = makeClient();
    client.messages.create
      .mockRejectedValueOnce(apiError(529))
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(MOCK_RESPONSE);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(MOCK_RESPONSE);
    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  // ── Retry exhaustion ──────────────────────────────────────────────────────

  it('throws after exhausting all 3 attempts on persistent 429', async () => {
    const client = makeClient();
    const finalError = apiError(429);
    client.messages.create
      .mockRejectedValueOnce(apiError(429))
      .mockRejectedValueOnce(apiError(429))
      .mockRejectedValueOnce(finalError);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    // Attach rejection handler BEFORE advancing timers so the rejection is never
    // "unhandled" — vi.runAllTimersAsync() completes all retries synchronously.
    const caught = promise.catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await caught;
    expect(err).toBe(finalError);
    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all 3 attempts on persistent 529', async () => {
    const client = makeClient();
    const err529 = apiError(529);
    client.messages.create
      .mockRejectedValueOnce(apiError(529))
      .mockRejectedValueOnce(apiError(529))
      .mockRejectedValueOnce(err529);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    const caught = promise.catch((e: unknown) => e);

    await vi.runAllTimersAsync();

    const err = await caught;
    expect(err).toBeInstanceOf(Error);
    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  // ── Non-retryable errors (throw immediately) ──────────────────────────────

  it('throws immediately on 400 without retrying', async () => {
    const client = makeClient();
    const err = apiError(400);
    client.messages.create.mockRejectedValueOnce(err);

    await expect(
      createMessageWithRetry(client as unknown as Anthropic, PARAMS),
    ).rejects.toBe(err);

    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on 401 without retrying', async () => {
    const client = makeClient();
    const err = apiError(401);
    client.messages.create.mockRejectedValueOnce(err);

    await expect(
      createMessageWithRetry(client as unknown as Anthropic, PARAMS),
    ).rejects.toBe(err);

    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on 500 without retrying', async () => {
    const client = makeClient();
    const err = apiError(500);
    client.messages.create.mockRejectedValueOnce(err);

    await expect(
      createMessageWithRetry(client as unknown as Anthropic, PARAMS),
    ).rejects.toBe(err);

    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('throws immediately on plain Error (not an APIError)', async () => {
    const client = makeClient();
    const networkError = new Error('ECONNRESET');
    client.messages.create.mockRejectedValueOnce(networkError);

    await expect(
      createMessageWithRetry(client as unknown as Anthropic, PARAMS),
    ).rejects.toBe(networkError);

    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  // ── Params forwarded correctly ────────────────────────────────────────────

  it('passes through all params unchanged on every attempt', async () => {
    const client = makeClient();
    client.messages.create
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(MOCK_RESPONSE);

    const promise = createMessageWithRetry(client as unknown as Anthropic, PARAMS);
    await vi.runAllTimersAsync();
    await promise;

    // Both calls (attempt 1 + retry) must use the exact same params
    expect(client.messages.create).toHaveBeenNthCalledWith(1, PARAMS);
    expect(client.messages.create).toHaveBeenNthCalledWith(2, PARAMS);
  });
});
