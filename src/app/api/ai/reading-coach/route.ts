export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/reading-coach
 *
 * The reading coach helps users read BETTER — not just track more.
 *
 * Modes:
 *   "pre_session"  — Focus questions to guide the upcoming reading session.
 *                    Returns 3 targeted prompts for the current book/page.
 *   "post_book"    — Deep-reflection package after finishing a book:
 *                    discussion questions, key themes, retention summary,
 *                    and a "read-alike" so the book stays alive.
 *
 * Body: { user_book_id: string; mode: 'pre_session' | 'post_book' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiGuard } from '@/lib/ai-guard';
import { getCachedAI, setCachedAI } from '@/lib/ai-cache';
import { logAIUsage } from '@/lib/ai-usage-log';
import Anthropic from '@anthropic-ai/sdk';
import { createMessageWithRetry } from '@/lib/ai-retry';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// ── Static fallback data ───────────────────────────────────────────────────────

const PRE_SESSION_FALLBACK = {
  mode: 'pre_session' as const,
  prompts: [
    {
      question: 'What do you think will happen next?',
      purpose: 'Activates predictive thinking — one of the strongest comprehension aids.',
    },
    {
      question: 'What is the author trying to make you feel right now?',
      purpose: 'Trains emotional attunement, which improves recall of narrative arcs.',
    },
    {
      question: 'What question are you hoping the next section answers?',
      purpose: 'Sets an intention that keeps your mind actively engaged while reading.',
    },
  ],
  tip: 'Read with a question in mind. Your brain retains information better when it is searching for an answer.',
};

function postBookFallback(title: string) {
  return {
    mode: 'post_book' as const,
    discussion_questions: [
      `What was the central conflict in "${title}" and how was it resolved?`,
      'Which character changed the most and what drove that change?',
      'What is one idea from this book you will apply to your own life?',
      'What did the author leave deliberately unresolved, and why do you think that was?',
    ],
    key_themes: ['character development', 'conflict and resolution', 'authorial intent'],
    retention_summary: `You have just finished "${title}". Take 2 minutes to write down: the one scene that stays with you, the one sentence that captured the book\'s soul, and one question it left unanswered.`,
    read_alike_prompt: 'To find your next book, think: did this one hook you because of the plot, the voice, or the ideas? Search for books praised for the same quality.',
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    user_book_id?: string;
    mode?: 'pre_session' | 'post_book';
    refresh?: boolean;
  };

  const { user_book_id, mode = 'pre_session', refresh = false } = body;
  if (!user_book_id) return NextResponse.json({ error: 'Missing user_book_id' }, { status: 400 });

  // Fetch the book data
  const { data: ub } = await supabase
    .from('user_books')
    .select(`
      id, current_page, status, rating,
      book:books(id, title, authors, subjects, description, page_count)
    `)
    .eq('id', user_book_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!ub) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

  type BookData = {
    id: string;
    title: string;
    authors: string[];
    subjects: string[] | null;
    description: string | null;
    page_count: number | null;
  };
  const book = ub.book as unknown as BookData | null;
  if (!book) return NextResponse.json({ error: 'Book data unavailable' }, { status: 404 });

  const cacheKey = `reading-coach:${user_book_id}:${mode}`;

  if (!refresh) {
    const cached = await getCachedAI(supabase, user.id, 'reading-coach', cacheKey);
    if (cached !== null) {
      logAIUsage(supabase, user.id, 'reading-coach', 0, 0, true);
      return NextResponse.json({ ...(cached as object), _cached: true });
    }
  }

  // ── Build prompt ─────────────────────────────────────────────────────────────

  const title = book.title;
  const author = book.authors?.[0] ?? 'the author';
  const genres = (book.subjects ?? []).slice(0, 4).join(', ') || 'unknown genre';
  const currentPage = ub.current_page ?? 0;
  const totalPages = book.page_count ?? 0;
  const progressPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  // Fetch recent notes/quotes from this book for extra context
  const { data: quotes } = await supabase
    .from('quotes')
    .select('text, page_number')
    .eq('user_id', user.id)
    .eq('book_id', book.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const quotesContext = (quotes ?? []).length > 0
    ? `Recent highlights:\n${(quotes ?? []).map(q => `  "${q.text.slice(0, 120)}"${q.page_number ? ` (p.${q.page_number})` : ''}`).join('\n')}`
    : '';

  let prompt: string;

  if (mode === 'pre_session') {
    prompt = `You are a skilled reading coach helping a reader get more out of their current book.

BOOK: "${title}" by ${author}
GENRES: ${genres}
PROGRESS: Page ${currentPage} of ${totalPages || '?'} (${progressPct}% complete)
${quotesContext}

Generate exactly 3 focus questions for this reader's next reading session. Each question should:
- Be specific to this book's themes, not generic
- Activate a different comprehension skill (prediction, analysis, personal connection, authorial intent)
- Be phrased as something to keep in mind WHILE reading (not a quiz question after)

Also include one short reading tip (1 sentence) that's tailored to where they are in the book.

Return ONLY valid JSON, no markdown:
{
  "mode": "pre_session",
  "prompts": [
    { "question": "...", "purpose": "one sentence on what cognitive skill this activates" }
  ],
  "tip": "one actionable reading tip for this exact point in the book"
}`;
  } else {
    // post_book
    const rating = ub.rating ? `${ub.rating}/5` : 'not yet rated';
    prompt = `You are a reading coach helping a reader reflect deeply on a book they just finished.

BOOK: "${title}" by ${author}
GENRES: ${genres}
READER RATING: ${rating}
${quotesContext ? `Things they highlighted:\n${quotesContext}` : ''}

Create a post-book reflection package to maximize retention and comprehension. Include:
1. 4 discussion questions — the kind that reveal whether you truly understood the book vs. just read the words
2. 3-4 key themes distilled from the book
3. A retention summary: 2-3 sentences the reader can return to in 6 months to remember what mattered
4. A short read-alike prompt (1 sentence) describing what kind of next book would deepen what this one started

Return ONLY valid JSON, no markdown:
{
  "mode": "post_book",
  "discussion_questions": ["...", "...", "...", "..."],
  "key_themes": ["...", "...", "..."],
  "retention_summary": "...",
  "read_alike_prompt": "..."
}`;
  }

  // ── Fallback (no API key) ─────────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    const fb = mode === 'pre_session' ? PRE_SESSION_FALLBACK : postBookFallback(title);
    return NextResponse.json(fb);
  }

  const guard = await aiGuard(supabase, user.id, 'reading-coach');
  if (!guard.allowed) {
    const fb = mode === 'pre_session' ? PRE_SESSION_FALLBACK : postBookFallback(title);
    return NextResponse.json(fb);
  }

  try {
    const anthropic = getAnthropic();
    const response = await createMessageWithRetry(anthropic, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    });

    logAIUsage(
      supabase, user.id, 'reading-coach',
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
    console.error('[ai/reading-coach] Claude API failed, using fallback:', err);
    const fb = mode === 'pre_session' ? PRE_SESSION_FALLBACK : postBookFallback(title);
    return NextResponse.json(fb);
  }
}
