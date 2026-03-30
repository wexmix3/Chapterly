import Anthropic from '@anthropic-ai/sdk';

interface MessageParams {
  model: string;
  max_tokens: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  system?: string;
}

/**
 * Wraps anthropic.messages.create() with retry logic for transient errors.
 *
 * Retries up to 3 attempts on 429 (rate limit) and 529 (overloaded) only.
 * Delays: 1.5s then 3s between attempts.
 * Non-retryable errors (400, 401, etc.) are thrown immediately.
 */
export async function createMessageWithRetry(
  anthropic: Anthropic,
  params: MessageParams
): Promise<Anthropic.Message> {
  const delays = [1500, 3000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (err) {
      const status = err instanceof Anthropic.APIError ? err.status : null;
      const isRetryable = status === 429 || status === 529;

      if (!isRetryable || attempt === delays.length) throw err;

      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }

  // Never reached — TypeScript satisfaction
  throw new Error('createMessageWithRetry: exhausted retries');
}
