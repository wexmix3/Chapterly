export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/personality
 * Generates a personalized reading personality card based on the user's stats.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiGuard } from '@/lib/ai-guard';
import { getCachedAI, setCachedAI } from '@/lib/ai-cache';
import { logAIUsage } from '@/lib/ai-usage-log';
import Anthropic from '@anthropic-ai/sdk';
import { format, subDays } from 'date-fns';

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

  const cacheKey = `personality:${user.id}`;
  if (!refresh) {
    const cached = await getCachedAI(supabase, user.id, 'personality', cacheKey);
    if (cached !== null) {
      logAIUsage(supabase, user.id, 'personality', 0, 0, true);
      return NextResponse.json({ ...cached as object, _cached: true });
    }
  }

  const guard = await aiGuard(supabase, user.id, 'personality');
  if (!guard.allowed) return NextResponse.json({ error: guard.error }, { status: guard.status });

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

  // ── Computed personality fallback ─────────────────────────────────────────
  function computedPersonality() {
    const totalPages = sessions!.reduce((s, r) => s + (r.pages_delta ?? 0), 0);
    const totalMinutes = sessions!.reduce((s, r) => s + (r.minutes_delta ?? 0), 0);
    const avgPagesPerSession = sessions!.length > 0 ? Math.round(totalPages / sessions!.length) : 0;
    const streakDays = (stats ?? []).filter(s => s.is_streak_day).length;

    const hourCounts: Record<number, number> = {};
    for (const s of sessions!) {
      const hour = new Date(s.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
    const bestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
    const isNight = bestHour !== undefined && (Number(bestHour) >= 21 || Number(bestHour) < 6);
    const isMorning = bestHour !== undefined && Number(bestHour) >= 5 && Number(bestHour) < 12;

    const genreCounts: Record<string, number> = {};
    type ShelfBook = { rating?: number | null; book?: { subjects?: string[] } | null };
    for (const ub of (shelf ?? []) as ShelfBook[]) {
      for (const s of ub.book?.subjects ?? []) {
        genreCounts[s] = (genreCounts[s] ?? 0) + 1;
      }
    }
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'varied';
    const rated = ((shelf ?? []) as ShelfBook[]).filter(b => b.rating);
    const avgRating = rated.length ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length : null;
    const isPicky = avgRating !== null && avgRating <= 3.5;
    const isGenerous = avgRating !== null && avgRating >= 4.5;

    if (isNight && avgPagesPerSession >= 40) {
      return { type: 'The Midnight Devourer', badge: '🌙', tagline: `You read ${totalPages} pages in the dark — mystery is your fuel.`, element: 'moon',
        traits: [`Night owl — most sessions happen after 9pm`, `Covers ${avgPagesPerSession} pages per sitting`, `${streakDays} reading days this month`] };
    }
    if (isMorning && streakDays >= 10) {
      return { type: 'The Dawn Ritual Reader', badge: '🌅', tagline: 'Pages before people — your mornings belong to books.', element: 'air',
        traits: [`Morning reader with ${streakDays} consistent days`, `${avgPagesPerSession} pages per session`, `Favourite genre: ${topGenre}`] };
    }
    if (isPicky) {
      return { type: 'The Selective Connoisseur', badge: '🔍', tagline: 'You don\'t finish bad books — life is too short.', element: 'earth',
        traits: [`Rates books an average of ${avgRating?.toFixed(1)}★ — high standards`, `${sessions!.length} sessions logged this month`, `Prefers: ${topGenre}`] };
    }
    if (isGenerous) {
      return { type: 'The Enthusiastic Adventurer', badge: '✨', tagline: 'Every book is a gift — you read with an open heart.', element: 'fire',
        traits: [`Rates books a generous ${avgRating?.toFixed(1)}★ on average`, `${totalPages} pages read this month`, `Favourite genre: ${topGenre}`] };
    }
    if (avgPagesPerSession >= 60) {
      return { type: 'The Deep Diver', badge: '🐋', tagline: `${avgPagesPerSession} pages per session — you go deep and stay there.`, element: 'water',
        traits: [`Marathon sessions averaging ${avgPagesPerSession} pages`, `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m read this month`, `Genre of choice: ${topGenre}`] };
    }
    return { type: 'The Steady Pacer', badge: '📚', tagline: 'Consistent, curious, and always making progress.', element: 'earth',
      traits: [`${sessions!.length} sessions logged this month`, `${totalPages} pages read across ${Math.round(totalMinutes / 60)} hours`, `Favourite genre: ${topGenre}`] };
  }

  // If no API key, return computed personality immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(computedPersonality());
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'personality',
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);

    await setCachedAI(supabase, user.id, cacheKey, parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[ai/personality] Claude API failed, using computed fallback:', err);
    return NextResponse.json(computedPersonality());
  }
}
