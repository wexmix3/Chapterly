import { Resend } from 'resend';

// Lazy-initialize so missing env var doesn't crash at build time
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL = 'Chapterly <hello@chapterly.app>';

// ─── Weekly Digest Email ────────────────────────────────────────
export interface DigestData {
  display_name: string;
  handle: string;
  pages_this_week: number;
  books_finished: string[];
  current_streak: number;
  books_read_this_year: number;
  goal_books: number;
  friend_activity: Array<{ name: string; action: string; book: string }>;
}

export function buildDigestHtml(d: DigestData): string {
  const streakBar = d.current_streak > 0
    ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:16px;">
        <span style="font-size:22px;">🔥</span>
        <strong style="color:#ea580c;font-size:16px;margin-left:8px;">${d.current_streak}-day streak!</strong>
        <span style="color:#9a3412;font-size:13px;margin-left:6px;">Keep it going.</span>
       </div>`
    : '';

  const goalProgress = d.goal_books > 0
    ? Math.min(100, Math.round((d.books_read_this_year / d.goal_books) * 100))
    : 0;

  const finishedBooks = d.books_finished.length > 0
    ? `<p style="color:#374151;font-size:14px;margin:4px 0 12px;">
        This week you finished: <strong>${d.books_finished.join(', ')}</strong> 🎉
       </p>`
    : '';

  const friendItems = d.friend_activity.slice(0, 3).map(f =>
    `<li style="font-size:13px;color:#6b7280;margin-bottom:6px;">
      <strong style="color:#374151;">${f.name}</strong> ${f.action} <em>${f.book}</em>
     </li>`
  ).join('');

  const friendSection = d.friend_activity.length > 0
    ? `<div style="border-top:1px solid #f3f4f6;padding-top:16px;margin-top:16px;">
        <p style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">What your friends read 📖</p>
        <ul style="list-style:none;padding:0;margin:0;">${friendItems}</ul>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Weekly Reading Digest</title></head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:32px 16px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:28px;">
    <p style="font-size:26px;font-weight:800;color:#1a1a1a;margin:0;letter-spacing:-0.5px;">📚 Chapterly</p>
    <p style="font-size:13px;color:#9ca3af;margin:4px 0 0;">Your weekly reading digest</p>
  </div>

  <!-- Card -->
  <div style="background:white;border-radius:20px;padding:24px;border:1px solid #f0ece4;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <p style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">Hey ${d.display_name} 👋</p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">Here's how your reading week went.</p>

    ${streakBar}

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
      <div style="background:#fdfcfb;border:1px solid #f0ece4;border-radius:12px;padding:12px;text-align:center;">
        <p style="font-size:22px;font-weight:800;color:#ee7a1e;margin:0;">${d.pages_this_week}</p>
        <p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">pages</p>
      </div>
      <div style="background:#fdfcfb;border:1px solid #f0ece4;border-radius:12px;padding:12px;text-align:center;">
        <p style="font-size:22px;font-weight:800;color:#059669;margin:0;">${d.books_read_this_year}</p>
        <p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">books this year</p>
      </div>
      <div style="background:#fdfcfb;border:1px solid #f0ece4;border-radius:12px;padding:12px;text-align:center;">
        <p style="font-size:22px;font-weight:800;color:#7c3aed;margin:0;">${goalProgress}%</p>
        <p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">of goal</p>
      </div>
    </div>

    ${finishedBooks}

    <!-- Progress bar -->
    ${d.goal_books > 0 ? `
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#9ca3af;margin-bottom:6px;">
        <span>Reading goal ${d.books_read_this_year}/${d.goal_books} books</span>
        <span>${goalProgress}%</span>
      </div>
      <div style="background:#f3f4f6;border-radius:99px;height:8px;overflow:hidden;">
        <div style="background:linear-gradient(90deg,#ee7a1e,#f97316);height:100%;width:${goalProgress}%;border-radius:99px;transition:width 0.3s;"></div>
      </div>
    </div>` : ''}

    ${friendSection}

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="https://chapterly.app/dashboard" style="display:inline-block;background:#ee7a1e;color:white;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px;">
        Open Chapterly →
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:24px;">
    <p style="font-size:11px;color:#d1d5db;margin:0;">
      You're receiving this because you have an account at chapterly.app &nbsp;·&nbsp;
      <a href="https://chapterly.app/u/${d.handle}" style="color:#d1d5db;">View profile</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

// ─── Streak Reminder Email ──────────────────────────────────────
export function buildStreakReminderHtml(display_name: string, streak: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Don't break your streak!</title></head>
<body style="margin:0;padding:0;background:#fdfcfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 16px;">
  <div style="background:white;border-radius:20px;padding:32px 24px;border:1px solid #f0ece4;text-align:center;">
    <p style="font-size:48px;margin:0 0 12px;">🔥</p>
    <h1 style="font-size:22px;font-weight:800;color:#1a1a1a;margin:0 0 8px;">
      ${streak > 1 ? `Don't lose your ${streak}-day streak!` : 'Start your reading streak today!'}
    </h1>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
      Hey ${display_name}, you haven't logged any reading today. Log even one page to keep your streak alive.
    </p>
    <a href="https://chapterly.app/dashboard?tab=streak"
       style="display:inline-block;background:#ee7a1e;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
      Log reading now →
    </a>
    <p style="font-size:11px;color:#d1d5db;margin-top:24px;">
      <a href="https://chapterly.app/dashboard" style="color:#d1d5db;">Manage notifications</a>
    </p>
  </div>
</div>
</body>
</html>`;
}
