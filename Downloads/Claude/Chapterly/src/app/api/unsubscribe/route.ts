export const dynamic = 'force-dynamic';

/**
 * GET /api/unsubscribe?token=xxx
 * One-click unsubscribe endpoint. No auth required.
 *
 * The token is HMAC-SHA256(userId, CRON_SECRET). Because the token is
 * deterministic we can brute-force check it against any userId that matches —
 * but rather than expose userId in the URL, we embed the userId in the token
 * itself as a prefix so we can look up and verify in one step.
 *
 * Token format (hex): HMAC(userId, secret)
 * We require the userId to be passed as a second query param so we can verify.
 *
 * URL format: /api/unsubscribe?token=<hmac>&uid=<userId>
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { verifyUnsubscribeToken } from '@/lib/email';

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Unsubscribed — Chapterly</title>
  <style>
    body { margin: 0; padding: 0; background: #fdfcfb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 20px; padding: 40px 32px; border: 1px solid #f0ece4; box-shadow: 0 1px 4px rgba(0,0,0,0.06); max-width: 400px; text-align: center; }
    h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
    p { font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
    a { display: inline-block; background: #ee7a1e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <p style="font-size:36px;margin:0 0 16px;">📚</p>
    <h1>You've been unsubscribed.</h1>
    <p>You won't receive digest or streak reminder emails from Chapterly anymore. You can re-enable them any time from your account settings.</p>
    <a href="https://getchapterly.com/dashboard">Back to Chapterly</a>
  </div>
</body>
</html>`;

const ERROR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Invalid link — Chapterly</title>
  <style>
    body { margin: 0; padding: 0; background: #fdfcfb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 20px; padding: 40px 32px; border: 1px solid #f0ece4; max-width: 400px; text-align: center; }
    h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px; }
    p { font-size: 14px; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <p style="font-size:36px;margin:0 0 16px;">❌</p>
    <h1>Invalid unsubscribe link.</h1>
    <p>This link may have expired or already been used. Log in to manage your notification preferences from your account settings.</p>
  </div>
</body>
</html>`;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const userId = request.nextUrl.searchParams.get('uid') ?? '';

  if (!token || !userId) {
    return new NextResponse(ERROR_HTML, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Verify the HMAC token
  if (!verifyUnsubscribeToken(userId, token)) {
    return new NextResponse(ERROR_HTML, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Update the user's email_notifications preference
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ email_notifications: false })
    .eq('id', userId);

  if (error) {
    console.error('[unsubscribe] failed to update user:', error);
    return new NextResponse(ERROR_HTML, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(SUCCESS_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
