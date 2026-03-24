export const dynamic = 'force-dynamic';

/**
 * GET /api/test-email
 * Sends a real test digest email to hello@getchapterly.com using Resend.
 * Protected by CRON_SECRET bearer token.
 *
 * Usage:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://your-domain/api/test-email
 *
 * Returns:
 *   { sent: true, messageId: "..." }   on success
 *   { error: "..." }                   on failure
 */
import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, buildDigestHtml, type DigestData } from '@/lib/email';

const TEST_RECIPIENT = 'hello@getchapterly.com';

export async function GET(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured. Set it in your environment variables.' },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check Resend is configured ──────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured. Add it to your environment variables.' },
      { status: 500 }
    );
  }

  // ── Build sample digest data ────────────────────────────────────────────────
  const sampleData: DigestData = {
    display_name: 'Test Reader',
    handle: 'testreader',
    pages_this_week: 247,
    books_finished: ['The Midnight Library', 'Project Hail Mary'],
    current_streak: 12,
    books_read_this_year: 8,
    goal_books: 24,
    friend_activity: [
      { name: 'Alex', action: 'finished', book: 'Dune' },
      { name: 'Jordan', action: 'started reading', book: 'Tomorrow, and Tomorrow, and Tomorrow' },
      { name: 'Sam', action: 'rated 5★', book: 'The Thursday Murder Club' },
    ],
    unsubscribe_token: 'test-token',
  };

  // ── Send the email ──────────────────────────────────────────────────────────
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_RECIPIENT,
      subject: `[TEST] 📚 Your weekly reading digest — 247 pages!`,
      html: buildDigestHtml(sampleData),
    });

    return NextResponse.json({
      sent: true,
      messageId: result.data?.id ?? null,
      recipient: TEST_RECIPIENT,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[test-email]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
