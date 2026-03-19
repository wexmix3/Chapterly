export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/recommend
 * Uses Claude to generate personalized book recommendations
 * based on the user's reading history, ratings, and genres.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

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

  // Gather reading history
  const { data: shelf } = await supabase
    .from('user_books')
    .select('status, rating, book:books(title, authors, subjects)')
    .eq('user_id', user.id)
    .in('status', ['read', 'reading', 'dnf'])
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

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
