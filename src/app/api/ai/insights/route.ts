export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/insights
 * Uses Claude to generate personalized reading insights:
 * - Reading speed patterns
 * - Best reading times
 * - Genre preferences
 * - Surprising observations
 * - Encouragement / coaching nudges
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiGuard } from '@/lib/ai-guard';
import { getCachedAI, setCachedAI } from '@/lib/ai-cache';
import { logAIUsage } from '@/lib/ai-usage-log';
import Anthropic from '@anthropic-ai/sdk';
import { format, subDays } from 'date-fns';

interface Insight {
  emoji: string;
  title: string;
  body: string;
  type: 'pattern' | 'achievement' | 'suggestion' | 'encouragement';
}

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export async function GET(req: import('next/server').NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

  // Cache-first: serve cache unless explicitly refreshing
  const cacheKey = `insights:${user.id}`;
  if (!refresh) {
    const cached = await getCachedAI(supabase, user.id, 'insights', cacheKey);
    if (cached !== null) {
      logAIUsage(supabase, user.id, 'insights', 0, 0, true);
      return NextResponse.json({ ...cached as object, _cached: true });
    }
  }

  const guard = await aiGuard(supabase, user.id, 'insights');
  if (!guard.allowed) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  // Sessions from last 30 days
  const { data: sessions } = await supabase
    .from('sessions')
    .select('started_at, pages_delta, minutes_delta, mode, source')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true });

  // Books read this year
  const { data: booksRead } = await supabase
    .from('user_books')
    .select('status, rating, started_at, finished_at, book:books(title, authors, subjects, page_count)')
    .eq('user_id', user.id)
    .in('status', ['read', 'dnf'])
    .gte('created_at', `${new Date().getFullYear()}-01-01`);

  // Stats
  const { data: stats } = await supabase
    .from('stats_daily')
    .select('date, pages, minutes, is_streak_day')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: true });

  if (!sessions || sessions.length < 3) {
    return NextResponse.json({
      insights: [{
        emoji: '📖',
        title: 'Keep reading!',
        body: 'Log at least 3 reading sessions to unlock your personalized reading insights.',
        type: 'encouragement',
      }],
    });
  }

  // Compute session stats
  const totalPages = sessions.reduce((s, r) => s + (r.pages_delta ?? 0), 0);
  const totalMinutes = sessions.reduce((s, r) => s + (r.minutes_delta ?? 0), 0);
  const avgPagesPerSession = sessions.length > 0 ? Math.round(totalPages / sessions.length) : 0;

  const hourCounts: Record<number, number> = {};
  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const bestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
  const bestTimeLabel = bestHour !== undefined
    ? (Number(bestHour) < 6 ? 'late night' : Number(bestHour) < 12 ? 'morning' : Number(bestHour) < 17 ? 'afternoon' : Number(bestHour) < 21 ? 'evening' : 'night')
    : null;

  const streakDays = (stats ?? []).filter(s => s.is_streak_day).length;
  const genreCounts: Record<string, number> = {};
  for (const ub of booksRead ?? []) {
    for (const s of (ub.book as { subjects?: string[] } | null)?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const dataProfile = `
READING DATA (last 30 days):
- Sessions: ${sessions.length}
- Total pages read: ${totalPages}
- Total minutes: ${totalMinutes}
- Avg pages per session: ${avgPagesPerSession}
- Best reading time: ${bestTimeLabel ?? 'varies'}
- Streak days: ${streakDays}/30
- Books finished this year: ${(booksRead ?? []).filter(b => b.status === 'read').length}
- Top genre: ${topGenre ?? 'mixed'}
`.trim();

  // ── Computational fallback (used when no API key is set or API call fails) ──
  function computedInsights(): Insight[] {
    const results: Insight[] = [];
    const safeSessions = sessions ?? [];

    // Reading pace insight
    if (totalPages > 0 && safeSessions.length > 0) {
      const pagesPerDay = Math.round(totalPages / 30);
      if (pagesPerDay >= 20) {
        results.push({
          emoji: '🔥',
          title: 'You\'re on fire this month',
          body: `You've averaged ${pagesPerDay} pages/day over the last 30 days across ${safeSessions.length} sessions. That puts you well above most readers.`,
          type: 'achievement',
        });
      } else if (pagesPerDay > 0) {
        results.push({
          emoji: '📖',
          title: `${pagesPerDay} pages a day`,
          body: `You've read ${totalPages} pages across ${safeSessions.length} sessions this month — roughly ${pagesPerDay} pages per day. Small sessions compound fast.`,
          type: 'pattern',
        });
      }
    }

    // Best reading time insight
    if (bestTimeLabel) {
      const sessionCount = safeSessions.length;
      results.push({
        emoji: bestTimeLabel === 'morning' ? '🌅' : bestTimeLabel === 'afternoon' ? '☀️' : bestTimeLabel === 'evening' ? '🌆' : '🌙',
        title: `You\'re a ${bestTimeLabel} reader`,
        body: `Most of your ${sessionCount} sessions happen in the ${bestTimeLabel}. Knowing your peak reading window helps you protect that time and build a stronger habit.`,
        type: 'pattern',
      });
    }

    // Streak insight
    if (streakDays >= 7) {
      results.push({
        emoji: '🔥',
        title: `${streakDays} streak days this month`,
        body: `You read on ${streakDays} out of 30 days — that's consistency. Readers with 7+ streak days per month finish 3× more books on average.`,
        type: 'achievement',
      });
    } else if (streakDays > 0) {
      results.push({
        emoji: '🎯',
        title: 'Build your reading streak',
        body: `You read on ${streakDays} days this month. Try for just 10 minutes every day — consistency beats long sporadic sessions every time.`,
        type: 'suggestion',
      });
    }

    // Genre insight
    if (topGenre) {
      results.push({
        emoji: '🎭',
        title: `Your go-to genre: ${topGenre}`,
        body: `Your shelf leans heavily toward ${topGenre}. Once you find a genre you love, your reading speed tends to increase because the vocabulary and pacing feel familiar.`,
        type: 'pattern',
      });
    }

    // Session length insight
    if (avgPagesPerSession > 0) {
      const style = avgPagesPerSession >= 50 ? 'marathon reader' : avgPagesPerSession >= 25 ? 'steady reader' : 'sprint reader';
      results.push({
        emoji: '⏱️',
        title: `You\'re a ${style}`,
        body: `Your average session covers ${avgPagesPerSession} pages. ${
          avgPagesPerSession >= 50
            ? 'Long focused sessions are great for complex books that need immersion.'
            : 'Short, consistent sessions are proven to help with retention — your brain loves the spaced repetition.'
        }`,
        type: 'encouragement',
      });
    }

    // Books finished insight
    const booksFinished = (booksRead ?? []).filter(b => b.status === 'read').length;
    if (booksFinished > 0) {
      results.push({
        emoji: '✅',
        title: `${booksFinished} book${booksFinished === 1 ? '' : 's'} finished this year`,
        body: `You've completed ${booksFinished} book${booksFinished === 1 ? '' : 's'} so far this year. The average person finishes 4 books a year — you're already ahead of the curve.`,
        type: 'achievement',
      });
    }

    // Return top 4 insights
    return results.slice(0, 4);
  }

  // ── Prompt for Claude (if API key is available) ────────────────────────────
  const prompt = `You are an encouraging, insightful reading coach. Analyze this reader's data and generate 4 personalized insights.

${dataProfile}

Make insights feel personal, surprising, and motivating — NOT generic. Reference their actual numbers.
Return ONLY valid JSON, no markdown, no extra text.

{
  "insights": [
    {
      "emoji": "single emoji",
      "title": "Short punchy title (max 8 words)",
      "body": "2-3 sentences. Reference their specific data. Be conversational and warm, not clinical.",
      "type": "pattern|achievement|suggestion|encouragement"
    }
  ]
}`;

  // If no API key, return computed insights immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ insights: computedInsights() });
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'insights',
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    // Strip markdown code fences if present (Claude sometimes wraps JSON in ```json ... ```)
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);

    await setCachedAI(supabase, user.id, cacheKey, parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai/insights] Claude API failed, using computed fallback:', err);
    // Fall back to computed insights on any API error
    return NextResponse.json({ insights: computedInsights() });
  }
}
