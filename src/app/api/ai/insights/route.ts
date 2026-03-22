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
import Anthropic from '@anthropic-ai/sdk';
import { format, subDays } from 'date-fns';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    // Strip markdown code fences if present (Claude sometimes wraps JSON in ```json ... ```)
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai/insights]', err);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
