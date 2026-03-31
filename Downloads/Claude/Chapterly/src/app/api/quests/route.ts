export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { levelFromXP } from '@/lib/xp';

const QUESTS = [
  { key: 'log_session',  label: 'Log a reading session',   xp: 25, icon: '📖' },
  { key: 'add_book',     label: 'Add a book to your shelf', xp: 15, icon: '➕' },
  { key: 'write_review', label: 'Write a review',           xp: 30, icon: '✍️' },
] as const;

type QuestKey = typeof QUESTS[number]['key'];

const VALID_KEYS = new Set<string>(QUESTS.map((q) => q.key));

// ── GET /api/quests ────────────────────────────────────────────────────────────
// Returns today's quest list with completion status for the authenticated user.
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: completions, error } = await supabase
    .from('quest_completions')
    .select('quest_key, xp_awarded')
    .eq('user_id', user.id)
    .eq('completed_date', today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const completedKeys = new Set(
    (completions ?? []).map((c: { quest_key: string }) => c.quest_key)
  );

  const quests = QUESTS.map((q) => ({
    key: q.key,
    label: q.label,
    xp: q.xp,
    icon: q.icon,
    completed: completedKeys.has(q.key),
  }));

  return NextResponse.json({ quests });
}

// ── POST /api/quests ───────────────────────────────────────────────────────────
// Marks a quest complete for the authenticated user and awards XP.
// Body: { quest_key: string }
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { quest_key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { quest_key } = body;
  if (!quest_key || !VALID_KEYS.has(quest_key)) {
    return NextResponse.json({ error: 'Invalid quest_key' }, { status: 400 });
  }

  const quest = QUESTS.find((q) => q.key === (quest_key as QuestKey))!;
  const today = new Date().toISOString().slice(0, 10);

  // Insert completion — the UNIQUE(user_id, quest_key, completed_date) constraint
  // prevents duplicate completions on the same day.
  const { error: insertError } = await supabase
    .from('quest_completions')
    .insert({
      user_id: user.id,
      quest_key,
      completed_date: today,
      xp_awarded: quest.xp,
    });

  if (insertError) {
    // Postgres unique_violation code
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'already_completed' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fetch current XP and level then update both atomically
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('total_xp, reader_level')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError || !userData) {
    // Completion was already inserted — best-effort XP update
    console.error('[quests] Failed to fetch user XP for update:', fetchError?.message);
    return NextResponse.json({ xp_awarded: quest.xp });
  }

  const currentXP: number = (userData.total_xp as number | null) ?? 0;
  const newXP = currentXP + quest.xp;
  const newLevel = levelFromXP(newXP);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      total_xp: newXP,
      reader_level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('[quests] Failed to update user XP:', updateError.message);
  }

  const prevLevel = levelFromXP(currentXP);
  return NextResponse.json({ xp_awarded: quest.xp, prev_level: prevLevel, new_level: newLevel });
}
