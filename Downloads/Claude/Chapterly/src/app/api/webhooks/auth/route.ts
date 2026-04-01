export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/auth
 * Handles Supabase Auth webhook events (signup, etc.).
 * Configure in Supabase Dashboard → Auth → Hooks → "Send email" or via custom webhook.
 * Secured by CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 *
 * For signup events, sends a welcome email via Resend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/email';

function buildWelcomeEmailHtml(displayName: string, appUrl: string): string {
  const name = displayName || 'Reader';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Chapterly</title>
</head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfcfb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:800;color:#2c6e49;letter-spacing:-0.5px;">Chapterly</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e8e4df;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                Welcome, ${name}! 📚
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your reading life just got a whole lot better. Chapterly is your personal reading tracker,
                stats engine, and community — all in one place.
              </p>

              <!-- Three steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f0eb;">
                    <span style="font-size:20px;margin-right:12px;">1️⃣</span>
                    <span style="font-size:14px;color:#374151;font-weight:600;">Add your first book</span>
                    <span style="font-size:13px;color:#9ca3af;margin-left:6px;">— search millions of titles</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f0eb;">
                    <span style="font-size:20px;margin-right:12px;">2️⃣</span>
                    <span style="font-size:14px;color:#374151;font-weight:600;">Log a reading session</span>
                    <span style="font-size:13px;color:#9ca3af;margin-left:6px;">— track pages &amp; time</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f0eb;">
                    <span style="font-size:20px;margin-right:12px;">3️⃣</span>
                    <span style="font-size:14px;color:#374151;font-weight:600;">Set a reading goal</span>
                    <span style="font-size:13px;color:#9ca3af;margin-left:6px;">— books, pages, or genres</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="font-size:20px;margin-right:12px;">4️⃣</span>
                    <span style="font-size:14px;color:#374151;font-weight:600;">Follow other readers</span>
                    <span style="font-size:13px;color:#9ca3af;margin-left:6px;">— see what friends are reading</span>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#2c6e49,#52b788);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
                      Start Reading →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Feature highlights -->
          <tr>
            <td style="padding:24px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="8">
                <tr>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#f0fdf4;border-radius:10px;padding:16px;border:1px solid #bbf7d0;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534;">📊 Reading Stats</p>
                      <p style="margin:0;font-size:12px;color:#4b7c5e;line-height:1.5;">Track streaks, pages, and your reading DNA over time.</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fff7ed;border-radius:10px;padding:16px;border:1px solid #fed7aa;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#9a3412;">🤖 AI Insights</p>
                      <p style="margin:0;font-size:12px;color:#7c5a3e;line-height:1.5;">Get personalized reading recommendations powered by AI.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#fdf4ff;border-radius:10px;padding:16px;border:1px solid #e9d5ff;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6b21a8;">👥 Social Feed</p>
                      <p style="margin:0;font-size:12px;color:#6b5e7c;line-height:1.5;">Follow readers and discover books through your network.</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <div style="background:#f0f9ff;border-radius:10px;padding:16px;border:1px solid #bae6fd;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#075985;">🏆 Book Clubs</p>
                      <p style="margin:0;font-size:12px;color:#3e6b87;line-height:1.5;">Join or create clubs to read together with friends.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                You received this email because you signed up for Chapterly.<br />
                <a href="${appUrl}/settings?tab=notifications" style="color:#9ca3af;">Manage email preferences</a>
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
  // Verify secret — Supabase webhook or internal call passes Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = (body.type as string) ?? '';

  // Only handle signup events
  if (event !== 'signup' && event !== 'INSERT') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Extract user info from Supabase Auth webhook payload
  // Supabase sends: { type: 'INSERT', table: 'users', record: { email, raw_user_meta_data, ... } }
  const record = (body.record as Record<string, unknown>) ?? {};
  const email = (record.email as string) ?? (body.email as string) ?? '';
  const meta = (record.raw_user_meta_data as Record<string, string>) ?? {};
  const displayName = meta.full_name ?? meta.name ?? (email.split('@')[0] ?? 'Reader');

  if (!email) {
    return NextResponse.json({ error: 'No email in payload' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getchapterly.com';

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to Chapterly, ${displayName}! 📚`,
      html: buildWelcomeEmailHtml(displayName, appUrl),
    });

    if (error) {
      console.error('[welcome-email] Resend error:', error);
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
    }

    console.log(`[welcome-email] Sent to ${email}`);
    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error('[welcome-email] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
