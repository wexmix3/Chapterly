export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/personality
 * Generates a personalized reading personality card based on the user's stats.
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

  const [{ data: sessions }, { data: shelf }, { data: stats }] = await Promise.all([
    supabase.from('sessions')
      .select('started_at, pages_delta, minutes_delta')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo),
    supabase.from('user_books')
      .select('status, rating, book:books(title, authors, subjects)')
      .eq('user_id', user.id),
    supabase.from('stats_daily')
      .select('date, pages, minutes, is_streak_day')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo),
  ]);

  if (!sessions || sessions.length < 2) {
    return NextResponse.json({
      type: 'The Fresh Start Reader',
      badge: '🌱',
      tagline: 'Every great reading journey starts with page one.',
      element: 'earth',
      traits: [
        'Just getting started — the best chapter is ahead',
        'Building your reading identity',
        'Open to any genre, any world',
      ],
    });
  }

  const totalPages = sessions.reduce((s, r) => s + (r.pages_delta ?? 0), 0);
  const totalMinutes = sessions.reduce((s, r) => s + (r.minutes_delta ?? 0), 0);
  const avgPagesPerSession = sessions.length > 0 ? Math.round(totalPages / sessions.length) : 0;
  const streakDays = (stats ?? []).filter(s => s.is_streak_day).length;

  const hourCounts: Record<number, number> = {};
  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }
  const bestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
  const bestTimeLabel = bestHour !== undefined
    ? (Number(bestHour) < 6 ? 'late night' : Number(bestHour) < 12 ? 'morning' : Number(bestHour) < 17 ? 'afternoon' : 'evening')
    : 'varies';

  const genreCounts: Record<string, number> = {};
  type ShelfBook = { rating?: number | null; book?: { subjects?: string[] } | null };
  for (const ub of (shelf ?? []) as ShelfBook[]) {
    for (const s of ub.book?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'varied';
  const avgRating = (() => {
    const rated = ((shelf ?? []) as ShelfBook[]).filter(b => b.rating);
    return rated.length ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1) : null;
  })();

  const prompt = `You are a fun, insightful reading personality analyzer. Based on this reader's data, craft a unique reading personality card.

THEIR DATA:
- Sessions last 30 days: ${sessions.length}
- Total pages read: ${totalPages}
- Total reading time: ${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m
- Avg pages per session: ${avgPagesPerSession}
- Best reading time: ${bestTimeLabel}
- Streak days: ${streakDays}/30
- Favourite genre: ${topGenre}
- Average rating they give books: ${avgRating ?? 'hasn\'t rated yet'}
- Books on shelf: ${(shelf ?? []).length}

Create a personality type that feels PERSONAL and SPECIFIC to their data — not generic.
Return ONLY valid JSON, no markdown.

{
  "type": "The [Adjective] [Noun] Reader — 4-5 words, creative and evocative, e.g. 'The Midnight Devourer', 'The Selective Connoisseur'",
  "badge": "one emoji that represents them",
  "tagline": "One punchy sentence about their reading soul — warm, specific to their data",
  "element": "one of: fire|water|earth|air|lightning|moon",
  "traits": ["trait 1 with actual data", "trait 2 with actual data", "trait 3 with actual data"]
}`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai/personality]', err);
    return NextResponse.json({ error: 'Failed to generate personality' }, { status: 500 });
  }
}
