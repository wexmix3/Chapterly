export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/recommend
 * Uses Claude to generate personalized book recommendations
 * based on the user's reading history, ratings, and genres.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiGuard } from '@/lib/ai-guard';
import { getCachedAI, setCachedAI } from '@/lib/ai-cache';
import { logAIUsage } from '@/lib/ai-usage-log';
import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export async function POST(req: import('next/server').NextRequest) {
  return GET(req);
}

export async function GET(req: import('next/server').NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

  const cacheKey = `recommend:${user.id}`;
  if (!refresh) {
    const cached = await getCachedAI(supabase, user.id, 'recommend', cacheKey);
    if (cached !== null) {
      logAIUsage(supabase, user.id, 'recommend', 0, 0, true);
      return NextResponse.json({ ...cached as object, _cached: true });
    }
  }

  // Gather reading history
  const { data: shelf } = await supabase
    .from('user_books')
    .select('status, rating, book:books(title, authors, subjects)')
    .eq('user_id', user.id)
    .in('status', ['read', 'reading', 'dnf', 'to_read'])
    .order('updated_at', { ascending: false })
    .limit(30);

  if (!shelf || shelf.length === 0) {
    return NextResponse.json({
      recommendations: [],
      message: 'Add some books to your shelf first so I can learn your taste!',
    });
  }

  // Build a compact reading profile
  type ShelfBook = { status: string; rating?: number | null; book?: { title?: string; authors?: string[]; subjects?: string[] } | null };
  const read = (shelf as ShelfBook[]).filter(b => b.status === 'read');
  const topRated = read.filter(b => (b.rating ?? 0) >= 4).slice(0, 8);
  const recentlyRead = read.slice(0, 5);
  const allTitles = (shelf as ShelfBook[]).map(b => b.book?.title ?? '').filter(Boolean);
  const wantToRead = (shelf as ShelfBook[]).filter(b => b.status === 'to_read').slice(0, 8);

  const genreCounts: Record<string, number> = {};
  for (const ub of shelf as ShelfBook[]) {
    for (const s of ub.book?.subjects ?? []) {
      genreCounts[s] = (genreCounts[s] ?? 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);

  const prompt = `You are a passionate book recommendation expert. Based on this reader's history, recommend 6 books they'll love.

THEIR READING PROFILE:
- Top-rated books (4-5★): ${topRated.map(b => `"${b.book?.title}" by ${b.book?.authors?.[0]} (${b.rating}★)`).join(', ') || 'none yet'}
- Recently read: ${recentlyRead.map(b => `"${b.book?.title}"`).join(', ') || 'none'}
- Want to read: ${wantToRead.map(b => `"${b.book?.title}"`).join(', ') || 'none'}
- Favourite genres: ${topGenres.join(', ') || 'varied'}
- Total books on shelf: ${shelf.length}
- Books already on shelf (DO NOT recommend these): ${allTitles.slice(0, 20).join(', ')}

INSTRUCTIONS:
- Recommend 6 books NOT already on their shelf
- Mix familiar favorites with exciting discoveries
- Include a brief (1 sentence) reason for each pick that's specific to their taste
- Return ONLY valid JSON, no markdown, no extra text

REQUIRED FORMAT:
{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "why": "One sentence explanation tailored to their reading taste",
      "genre": "Primary genre",
      "vibe": "One emoji + 2-3 word vibe (e.g. '🔥 Dark & Gripping')"
    }
  ]
}`;

  // If no API key, skip rate limit and return empty state
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      recommendations: [],
      message: 'AI recommendations require an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables to enable this feature.',
    });
  }

  // Only gate actual Claude calls — not fallbacks
  const guard = await aiGuard(supabase, user.id, 'recommend');
  if (!guard.allowed) {
    return NextResponse.json({ recommendations: [], message: guard.error });
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'recommend',
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);

    // Enrich each recommendation with a cover and short description from Google Books
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';

    type RawRec = { title: string; author: string; why: string; genre: string; vibe: string };
    const enriched = await Promise.all(
      (parsed.recommendations as RawRec[]).map(async (rec) => {
        try {
          const q = encodeURIComponent(`intitle:${rec.title} inauthor:${rec.author}`);
          const gbRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1${keyParam}`,
            { next: { revalidate: 86400 } }
          );
          if (!gbRes.ok) return rec;
          const gbData = await gbRes.json();
          const vol = gbData.items?.[0]?.volumeInfo;
          return {
            ...rec,
            cover_url: vol?.imageLinks?.thumbnail?.replace('http:', 'https:') ?? null,
            description: vol?.description
              ? vol.description.replace(/<[^>]+>/g, '').slice(0, 200) + '…'
              : null,
          };
        } catch {
          return { ...rec, cover_url: null, description: null };
        }
      })
    );

    const result = { recommendations: enriched };
    await setCachedAI(supabase, user.id, cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[ai/recommend]', err);
    return NextResponse.json({
      recommendations: [],
      message: 'Recommendations are temporarily unavailable. Please try again shortly.',
    });
  }
}
