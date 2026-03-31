export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/habit-nudge
 *
 * Returns a personalized habit nudge for today:
 *   - Optimal reading window (time of day, based on past session data)
 *   - A short motivational message tailored to the user's current streak and pace
 *   - A micro-goal for today (e.g. "15 pages tonight while cooking")
 *   - A "why this matters" hook tied to their progress
 *
 * Cached for 8 hours — fresh enough to feel current, cheap enough to not rate-limit.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getCachedAI, setCachedAI } from '@/lib/ai-cache';
import { logAIUsage } from '@/lib/ai-usage-log';
import { aiGuard } from '@/lib/ai-guard';
import Anthropic from '@anthropic-ai/sdk';
import { createMessageWithRetry } from '@/lib/ai-retry';
import { format, subDays } from 'date-fns';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// ── Computed fallback ─────────────────────────────────────────────────────────

interface NudgeResult {
  optimal_window: string;
  nudge_message: string;
  micro_goal: string;
  why_it_matters: string;
  current_streak: number;
}

function computedNudge(params: {
  bestTimeLabel: string;
  currentStreak: number;
  avgPagesPerSession: number;
  booksThisYear: number;
  currentlyReadingTitle: string | null;
}): NudgeResult {
  const { bestTimeLabel, currentStreak, avgPagesPerSession, booksThisYear, currentlyReadingTitle } = params;

  const timeMap: Record<string, string> = {
    morning:   '6–9am',
    afternoon: '1–4pm',
    evening:   '7–10pm',
    night:     '9pm–midnight',
    'late night': '10pm–1am',
  };

  const window = timeMap[bestTimeLabel] ?? 'any quiet window today';
  const pages = Math.max(10, Math.min(avgPagesPerSession, 50));

  const bookPart = currentlyReadingTitle
    ? `in "${currentlyReadingTitle}"`
    : 'in whatever you\'re reading';

  const nudgeMessages = [
    `Your ${bestTimeLabel} sessions are when you do your best reading — protect that time today.`,
    `${currentStreak > 0 ? `${currentStreak}-day streak going` : 'Start your streak today'} — even 10 minutes counts.`,
    `You've finished ${booksThisYear} book${booksThisYear !== 1 ? 's' : ''} this year. One session today keeps that momentum alive.`,
    `Readers who protect their daily reading window finish 4× more books than those who read when time permits.`,
  ];

  return {
    optimal_window: window,
    nudge_message: nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)],
    micro_goal: `Read ${pages} pages ${bookPart} during your ${bestTimeLabel} window today.`,
    why_it_matters: `Even ${pages} pages a day compounds to ${Math.round(pages * 365 / 300)} books this year — without changing your schedule.`,
    current_streak: currentStreak,
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Cache: 8 hours — nudge changes throughout the day but not by the minute
  const cacheKey = `habit-nudge:${user.id}:${format(new Date(), 'yyyy-MM-dd-HH').slice(0, 13)}`;
  const cached = await getCachedAI(supabase, user.id, 'habit-nudge', cacheKey);
  if (cached !== null) {
    logAIUsage(supabase, user.id, 'habit-nudge', 0, 0, true);
    return NextResponse.json({ ...(cached as object), _cached: true });
  }

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [{ data: sessions }, { data: stats }, { data: currentlyReading }] = await Promise.all([
    supabase.from('sessions')
      .select('started_at, pages_delta, minutes_delta')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo),
    supabase.from('stats_daily')
      .select('date, pages, is_streak_day')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false }),
    supabase.from('user_books')
      .select('book:books(title)')
      .eq('user_id', user.id)
      .eq('status', 'reading')
      .limit(1),
  ]);

  // Compute best time of day from sessions
  const hourCounts: Record<number, number> = {};
  for (const s of sessions ?? []) {
    if (!s.started_at) continue;
    const hour = new Date(s.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const bestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
  const bestTimeLabel = bestHour !== undefined
    ? (Number(bestHour) < 6 ? 'late night' : Number(bestHour) < 12 ? 'morning' : Number(bestHour) < 17 ? 'afternoon' : Number(bestHour) < 21 ? 'evening' : 'night')
    : 'evening';

  // Streak
  const sorted = [...(stats ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const dates = sorted.map(d => d.date);
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  let streak = 0;
  const startDate = dates.includes(today) ? today : dates[0] === yesterday ? yesterday : null;
  if (startDate) {
    let cursor = startDate;
    while (dates.includes(cursor)) {
      streak++;
      cursor = format(subDays(new Date(cursor), 1), 'yyyy-MM-dd');
    }
  }

  const totalPages = (sessions ?? []).reduce((s, r) => s + (r.pages_delta ?? 0), 0);
  const avgPagesPerSession = (sessions ?? []).length > 0 ? Math.round(totalPages / (sessions ?? []).length) : 20;

  const { count: booksThisYear } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', `${new Date().getFullYear()}-01-01`);

  type CREntry = { book?: { title?: string } | null };
  const currentlyReadingTitle = ((currentlyReading ?? []) as CREntry[])[0]?.book?.title ?? null;

  const fallbackParams = {
    bestTimeLabel,
    currentStreak: streak,
    avgPagesPerSession,
    booksThisYear: booksThisYear ?? 0,
    currentlyReadingTitle,
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(computedNudge(fallbackParams));
  }

  const guard = await aiGuard(supabase, user.id, 'habit-nudge');
  if (!guard.allowed) {
    return NextResponse.json(computedNudge(fallbackParams));
  }

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const prompt = `You are a compassionate reading habit coach. Today is ${todayName} at ${timeNow}.

READER DATA:
- Current reading streak: ${streak} day${streak !== 1 ? 's' : ''}
- Best reading time (based on sessions): ${bestTimeLabel}
- Avg pages per session: ${avgPagesPerSession}
- Books finished this year: ${booksThisYear ?? 0}
- Currently reading: ${currentlyReadingTitle ?? 'nothing (between books)'}
- Sessions logged in last 30 days: ${(sessions ?? []).length}

Create a personalized habit nudge for today. Be warm, specific, brief. Avoid clichés.

Return ONLY valid JSON, no markdown:
{
  "optimal_window": "time range today (e.g. '7–9pm this evening')",
  "nudge_message": "1-2 sentences. Warm, personal, references their actual data. No generic 'keep it up' phrases.",
  "micro_goal": "One specific, tiny reading goal for today (e.g. '20 pages of [book] before you put your phone down tonight')",
  "why_it_matters": "1 sentence connecting today's session to a bigger outcome — specific to their year so far",
  "current_streak": ${streak}
}`;

  try {
    const anthropic = getAnthropic();
    const response = await createMessageWithRetry(anthropic, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'habit-nudge',
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text) as NudgeResult;

    await setCachedAI(supabase, user.id, cacheKey, parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai/habit-nudge] Claude API failed, using computed fallback:', err);
    return NextResponse.json(computedNudge(fallbackParams));
  }
}
