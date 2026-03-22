export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/mood
 * Returns 4 book recommendations matching the user's current mood.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiGuard } from '@/lib/ai-guard';
import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guard = await aiGuard(supabase, user.id, 'mood');
  if (!guard.allowed) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { mood, prompt: moodPrompt } = await req.json() as { mood: string; prompt: string };
  if (!mood || !moodPrompt) return NextResponse.json({ error: 'Missing mood' }, { status: 400 });

  // Get their shelf to avoid duplicates
  const { data: shelf } = await supabase
    .from('user_books')
    .select('book:books(title)')
    .eq('user_id', user.id)
    .limit(50);

  type ShelfEntry = { book?: { title?: string } | null };
  const existingTitles = ((shelf ?? []) as ShelfEntry[])
    .map(b => b.book?.title ?? '')
    .filter(Boolean)
    .slice(0, 30)
    .join(', ');

  const prompt = `You are a book recommendation expert. The reader is in a "${mood}" mood and wants something ${moodPrompt}.

${existingTitles ? `Books they already have (DO NOT recommend): ${existingTitles}` : ''}

Recommend exactly 4 books that perfectly match this mood. Be specific and confident in your picks.
Return ONLY valid JSON, no markdown.

{
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "why": "One sentence on why this is perfect for this exact mood",
      "genre": "Primary genre",
      "vibe": "One emoji + 2-3 word vibe"
    }
  ]
}`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(text);

    // Enrich with covers from Google Books
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
          };
        } catch {
          return { ...rec, cover_url: null };
        }
      })
    );

    return NextResponse.json({ recommendations: enriched });
  } catch (err) {
    console.error('[ai/mood]', err);
    return NextResponse.json({ error: 'Failed to generate mood recommendations' }, { status: 500 });
  }
}
