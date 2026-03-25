export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/mood
 * Returns 4 book recommendations matching the user's current mood.
 */
import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  return GET(req);
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

  // Support mood from query param (GET) or body (POST legacy)
  let mood: string | undefined;
  let moodPrompt: string | undefined;
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({})) as { mood?: string; prompt?: string };
    mood = body.mood;
    moodPrompt = body.prompt;
  } else {
    mood = req.nextUrl.searchParams.get('mood') ?? undefined;
    moodPrompt = req.nextUrl.searchParams.get('prompt') ?? mood;
  }
  if (!mood) return NextResponse.json({ error: 'Missing mood' }, { status: 400 });
  if (!moodPrompt) moodPrompt = mood;

  const cacheKey = `mood:${user.id}:${mood}`;
  if (!refresh) {
    const cached = await getCachedAI(supabase, user.id, 'mood', cacheKey);
    if (cached !== null) {
      logAIUsage(supabase, user.id, 'mood', 0, 0, true);
      return NextResponse.json({ ...cached as object, _cached: true });
    }
  }

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

  // ── Static fallback recs keyed by mood ────────────────────────────────────
  const STATIC_RECS: Record<string, Array<{ title: string; author: string; why: string; genre: string; vibe: string }>> = {
    Adventurous: [
      { title: 'Into Thin Air', author: 'Jon Krakauer', why: 'A gripping true account of the deadliest Everest expedition — pure adrenaline on every page.', genre: 'Adventure Nonfiction', vibe: '⛰️ Edge of your seat' },
      { title: 'The Alchemist', author: 'Paulo Coelho', why: 'A timeless journey across continents in pursuit of a personal legend — adventure meets philosophy.', genre: 'Literary Fiction', vibe: '🗺️ Soul journey' },
      { title: 'Wild', author: 'Cheryl Strayed', why: 'A raw, honest 1,100-mile solo hike that\'s as much internal as external.', genre: 'Memoir', vibe: '🌲 Raw & real' },
      { title: 'Endurance', author: 'Alfred Lansing', why: 'Shackleton\'s impossible Antarctic survival story — the ultimate adventure tale.', genre: 'Historical Nonfiction', vibe: '🧊 Epic survival' },
    ],
    Cozy: [
      { title: 'The House in the Cerulean Sea', author: 'TJ Klune', why: 'Warm, whimsical fantasy about found family — the literary equivalent of a hot drink by the fire.', genre: 'Fantasy', vibe: '☕ Warm & fuzzy' },
      { title: 'Remarkably Bright Creatures', author: 'Shelby Van Pelt', why: 'A charming mystery narrated partly by an octopus — cozy with unexpected depth.', genre: 'Literary Fiction', vibe: '🐙 Gentle mystery' },
      { title: 'A Man Called Ove', author: 'Fredrik Backman', why: 'A grumpy old man and his neighbours — quietly heartwarming and deeply funny.', genre: 'Contemporary Fiction', vibe: '🏠 Heartwarming' },
      { title: 'The Thursday Murder Club', author: 'Richard Osman', why: 'Retired detectives solving crimes — witty, cozy, and utterly delightful.', genre: 'Cozy Mystery', vibe: '🍵 Cozy crime' },
    ],
    Thoughtful: [
      { title: 'Sapiens', author: 'Yuval Noah Harari', why: 'A sweeping, provocative history of humankind that changes how you see everything.', genre: 'History / Philosophy', vibe: '🧠 Mind-expanding' },
      { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', why: 'A quiet meditation on duty, regret, and what it means to live well — devastatingly beautiful.', genre: 'Literary Fiction', vibe: '🍂 Quietly profound' },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', why: 'Nobel-winning insights into how your mind actually works — permanently changes your thinking.', genre: 'Psychology', vibe: '💡 Eye-opening' },
      { title: 'Stoner', author: 'John Williams', why: 'A plain, perfect novel about an ordinary life — it will make you reconsider what matters.', genre: 'Literary Fiction', vibe: '📜 Quietly devastating' },
    ],
    Thrilled: [
      { title: 'Gone Girl', author: 'Gillian Flynn', why: 'The twists will make you question everything — don\'t start this one late at night.', genre: 'Psychological Thriller', vibe: '😱 Jaw-dropping twists' },
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', why: 'A dark, compulsive Swedish thriller with one of fiction\'s most unforgettable protagonists.', genre: 'Crime Thriller', vibe: '🔥 Dark & gripping' },
      { title: 'The Silent Patient', author: 'Alex Michaelides', why: 'A woman who shoots her husband then never speaks again — the ending will stun you.', genre: 'Psychological Thriller', vibe: '🔮 Twisty mystery' },
      { title: 'Sharp Objects', author: 'Gillian Flynn', why: 'A haunting, deeply unsettling story of a journalist returning to her small Southern hometown.', genre: 'Thriller', vibe: '🌑 Dark & atmospheric' },
    ],
    Romantic: [
      { title: 'The Hating Game', author: 'Sally Thorne', why: 'Office rivals with undeniable chemistry — sharp, funny, and deeply swoony.', genre: 'Romance', vibe: '💕 Enemies to lovers' },
      { title: 'Beach Read', author: 'Emily Henry', why: 'Two writers swap genres for the summer — romantic, funny, and surprisingly emotional.', genre: 'Contemporary Romance', vibe: '🌊 Warm & witty' },
      { title: 'Persuasion', author: 'Jane Austen', why: 'Second chances at love — Austen\'s most emotionally mature and bittersweet romance.', genre: 'Classic Romance', vibe: '🌹 Timeless longing' },
      { title: 'It Ends with Us', author: 'Colleen Hoover', why: 'A raw, unflinching love story that will break your heart in the best possible way.', genre: 'Contemporary Romance', vibe: '💔 Emotionally raw' },
    ],
    Inspired: [
      { title: 'Atomic Habits', author: 'James Clear', why: 'The most practical system for building good habits — every page is immediately actionable.', genre: 'Self-Help', vibe: '⚡ Life-changing' },
      { title: 'When Breath Becomes Air', author: 'Paul Kalanithi', why: 'A dying neurosurgeon\'s meditation on meaning — one of the most profound books ever written.', genre: 'Memoir', vibe: '✨ Soul-stirring' },
      { title: 'Educated', author: 'Tara Westover', why: 'A memoir about self-invention against all odds — genuinely inspiring in the truest sense.', genre: 'Memoir', vibe: '🎓 Transformative' },
      { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', why: 'A Holocaust survivor\'s lessons on finding purpose — small book, enormous impact.', genre: 'Philosophy / Memoir', vibe: '🕯️ Deeply meaningful' },
    ],
    Escapist: [
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', why: 'The most immersive fantasy world ever built — you won\'t want to leave Kvothe\'s story.', genre: 'Epic Fantasy', vibe: '🔮 Fully immersive' },
      { title: 'The Night Circus', author: 'Erin Morgenstern', why: 'A magical circus appears without warning — lush, dream-like, and impossibly beautiful.', genre: 'Fantasy', vibe: '✨ Enchanting' },
      { title: 'Jonathan Strange & Mr Norrell', author: 'Susanna Clarke', why: 'Magic returns to England — a dense, extraordinary novel like nothing else.', genre: 'Historical Fantasy', vibe: '🎩 Utterly transporting' },
      { title: 'Piranesi', author: 'Susanna Clarke', why: 'A man lives in an infinite house of halls and statues — mysterious, original, unforgettable.', genre: 'Fantasy', vibe: '🌊 Strange & beautiful' },
    ],
    Funny: [
      { title: 'Good Omens', author: 'Terry Pratchett & Neil Gaiman', why: 'An angel and demon try to prevent the apocalypse — the funniest book about the end of the world ever written.', genre: 'Comic Fantasy', vibe: '😂 Hilarious' },
      { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', why: 'The answer to life, the universe and everything is 42 — and getting there is absurdly funny.', genre: 'Comic Sci-Fi', vibe: '🚀 Absurdly brilliant' },
      { title: 'I\'m Glad My Mom Died', author: 'Jennette McCurdy', why: 'A darkly funny, raw memoir — the title says it all and it\'s completely earned.', genre: 'Memoir', vibe: '😬 Dark comedy' },
      { title: 'Catch-22', author: 'Joseph Heller', why: 'WWII military bureaucracy taken to its logical, hilarious extreme — a classic for a reason.', genre: 'Classic Satire', vibe: '🎭 Satirical brilliance' },
    ],
  };

  const staticRecs = STATIC_RECS[mood] ?? STATIC_RECS.Adventurous;

  // If no API key, return static recs immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ recommendations: staticRecs });
  }

  // Only gate actual Claude calls
  const guard = await aiGuard(supabase, user.id, 'mood');
  if (!guard.allowed) return NextResponse.json({ recommendations: staticRecs });

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'mood',
      response.usage.input_tokens,
      response.usage.output_tokens,
      false,
    );

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

    const result = { recommendations: enriched };
    await setCachedAI(supabase, user.id, cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[ai/mood] Claude API failed, using static fallback:', err);
    return NextResponse.json({ recommendations: staticRecs });
  }
}
