export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/lapsed-readers
 * Finds users who haven't logged a reading session in 14+ days and sends a
 * re-engagement email via Resend.
 *
 * Protected by: Authorization: Bearer <CRON_SECRET>
 * Recommended Vercel Cron schedule: 0 10 * * 1  (Mondays at 10am UTC)
 * Skip users who have opted out of email notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { getResend, FROM_EMAIL, generateUnsubscribeToken } from '@/lib/email';
import { subDays, format, formatDistanceToNow } from 'date-fns';

function buildLapsedEmailHtml(opts: {
  displayName: string;
  lastBookTitle: string | null;
  daysSince: number;
  appUrl: string;
  unsubToken: string;
  userId: string;
}): string {
  const { displayName, lastBookTitle, daysSince, appUrl, unsubToken, userId } = opts;
  const name = displayName || 'Reader';
  const bookMsg = lastBookTitle
    ? `Last time you were reading <strong>${lastBookTitle}</strong>.`
    : 'Your bookshelf is waiting for you.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We miss you on Chapterly</title>
</head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfcfb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:26px;font-weight:800;color:#2c6e49;letter-spacing:-0.5px;">Chapterly</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e8e4df;padding:36px;">

              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">
                Hey ${name}, it's been ${daysSince} days 📖
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your reading streak is taking a nap. ${bookMsg} Even 10 minutes today keeps
                the habit alive.
              </p>

              <!-- Motivational quote -->
              <div style="background:#f0fdf4;border-left:4px solid #2c6e49;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#166534;font-style:italic;line-height:1.6;">
                  "A reader lives a thousand lives before he dies. The man who never reads lives only one."
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:#4ade80;">— George R.R. Martin</p>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#2c6e49,#52b788);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;">
                      Resume Reading →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Your books are right where you left them.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
                You're receiving this because you signed up for Chapterly.<br />
                <a href="${appUrl}/api/unsubscribe?user_id=${userId}&token=${unsubToken}" style="color:#9ca3af;">
                  Unsubscribe from re-engagement emails
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getchapterly.com';

  const cutoffDate = format(subDays(new Date(), 14), 'yyyy-MM-dd');

  // Find users whose most recent session is older than 14 days
  // We join with the users table to get email + display_name + email prefs
  const { data: users, error } = await supabase
    .from('users')
    .select('id, display_name, email_prefs')
    .eq('is_public', true); // proxy for "active account"

  if (error || !users) {
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch users' }, { status: 500 });
  }

  // Get last session date per user
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('user_id, created_at')
    .order('created_at', { ascending: false });

  const lastSessionByUser = new Map<string, string>();
  for (const s of recentSessions ?? []) {
    if (!lastSessionByUser.has(s.user_id)) {
      lastSessionByUser.set(s.user_id, s.created_at);
    }
  }

  // Get the last book each user was reading
  const { data: currentlyReading } = await supabase
    .from('user_books')
    .select('user_id, book:books(title)')
    .eq('status', 'reading')
    .order('updated_at', { ascending: false });

  const lastBookByUser = new Map<string, string>();
  for (const ub of currentlyReading ?? []) {
    if (!lastBookByUser.has(ub.user_id)) {
      const book = ub.book as { title?: string } | null;
      if (book?.title) lastBookByUser.set(ub.user_id, book.title);
    }
  }

  const lapsed = users.filter((u) => {
    const emailPrefs = (u.email_prefs as Record<string, boolean>) ?? {};
    if (emailPrefs.email_notifications === false) return false;
    const lastSession = lastSessionByUser.get(u.id);
    if (!lastSession) return false; // never logged — handled by onboarding
    return lastSession < cutoffDate + 'T00:00:00Z';
  });

  // We need emails — fetch from Supabase Auth (admin only)
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const au of authUsers?.users ?? []) {
    if (au.email) emailById.set(au.id, au.email);
  }

  let sent = 0;
  let skipped = 0;

  for (const user of lapsed) {
    const email = emailById.get(user.id);
    if (!email) { skipped++; continue; }

    const lastSessionTs = lastSessionByUser.get(user.id)!;
    const daysSince = Math.floor(
      (Date.now() - new Date(lastSessionTs).getTime()) / (1000 * 60 * 60 * 24)
    );
    const lastBookTitle = lastBookByUser.get(user.id) ?? null;
    const unsubToken = generateUnsubscribeToken(user.id);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${user.display_name || 'Reader'}, your books miss you 📚`,
      html: buildLapsedEmailHtml({
        displayName: user.display_name ?? '',
        lastBookTitle,
        daysSince,
        appUrl,
        unsubToken,
        userId: user.id,
      }),
    });

    if (emailErr) {
      console.error(`[lapsed-readers] Failed to send to ${email}:`, emailErr);
      skipped++;
    } else {
      sent++;
    }
  }

  return NextResponse.json({ sent, skipped, total_lapsed: lapsed.length });
}
