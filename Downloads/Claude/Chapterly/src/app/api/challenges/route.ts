export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Supported goal types:
 *   yearly_books   — finish N books in the calendar year
 *   monthly_books  — finish N books in the current month
 *   weekly_pages   — read N pages in the current week
 *   daily_pages    — read N pages today
 *   monthly_genres — read books from N distinct genres this month
 */
type GoalType = 'yearly_books' | 'monthly_books' | 'weekly_pages' | 'daily_pages' | 'monthly_genres';

interface GoalProgress {
  id: string;
  year: number;
  goal_type: GoalType;
  goal_target: number;
  // legacy compat
  goal_books: number;
  goal_pages: number | null;
  current_value: number;
  current_books: number;
  current_pages: number;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    year: number;
    goal_type?: GoalType;
    goal_target?: number;
    // legacy support
    goal_books?: number;
    goal_pages?: number;
  };

  const goalType: GoalType = body.goal_type ?? 'yearly_books';
  const goalTarget = body.goal_target ?? body.goal_books ?? 12;

  const { data, error } = await supabase
    .from('reading_challenges')
    .upsert(
      {
        user_id: user.id,
        year: body.year,
        goal_type: goalType,
        goal_target: goalTarget,
        // keep legacy columns in sync for yearly_books
        goal_books: goalType === 'yearly_books' ? goalTarget : 0,
        goal_pages: body.goal_pages ?? null,
      },
      { onConflict: 'user_id,year,goal_type' }
    )
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01T00:00:00.000Z`;
  const yearEnd   = `${year + 1}-01-01T00:00:00.000Z`;

  // Fetch all goals for this year
  const { data: challenges } = await supabase
    .from('reading_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year);

  if (!challenges || challenges.length === 0) {
    return NextResponse.json({ data: null, goals: [] });
  }

  // ── Compute current progress for each goal type ────────────────────────────

  // Yearly books
  const { count: booksCount } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', yearStart)
    .lt('finished_at', yearEnd);

  // Weekly pages: pages logged in current week
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const weekEnd   = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('pages_delta')
    .eq('user_id', user.id)
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd);
  const weeklyPages = (weekSessions ?? []).reduce((s, r) => s + (r.pages_delta ?? 0), 0);

  // Monthly genres: distinct genres from books finished this month
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00'Z'");
  const monthEnd   = format(endOfMonth(new Date()),   "yyyy-MM-dd'T'23:59:59'Z'");
  const { data: monthBooks } = await supabase
    .from('user_books')
    .select('book:books(subjects)')
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', monthStart)
    .lte('finished_at', monthEnd);
  const genreSet = new Set<string>();
  for (const ub of monthBooks ?? []) {
    const subs = (ub.book as { subjects?: string[] } | null)?.subjects ?? [];
    for (const s of subs.slice(0, 3)) { if (s.trim()) genreSet.add(s.trim()); }
  }
  const monthlyGenres = genreSet.size;

  // Legacy pages count (full year)
  const { data: sessionPages } = await supabase
    .from('sessions')
    .select('pages_read')
    .eq('user_id', user.id)
    .gte('logged_at', yearStart)
    .lt('logged_at', yearEnd);
  const pagesCount = (sessionPages ?? []).reduce((s, r) => s + (r.pages_read ?? 0), 0);

  // Monthly books: books finished this month
  const { count: monthlyBooksCount } = await supabase
    .from('user_books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'read')
    .gte('finished_at', monthStart)
    .lte('finished_at', monthEnd);

  // Daily pages: pages logged today
  const todayStart = format(new Date(), "yyyy-MM-dd'T'00:00:00'Z'");
  const todayEnd   = format(new Date(), "yyyy-MM-dd'T'23:59:59'Z'");
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('pages_delta')
    .eq('user_id', user.id)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);
  const dailyPages = (todaySessions ?? []).reduce((s, r) => s + (r.pages_delta ?? 0), 0);

  const currentByType: Record<GoalType, number> = {
    yearly_books:   booksCount    ?? 0,
    monthly_books:  monthlyBooksCount ?? 0,
    weekly_pages:   weeklyPages,
    daily_pages:    dailyPages,
    monthly_genres: monthlyGenres,
  };

  const goals: GoalProgress[] = challenges.map(c => {
    const gt = (c.goal_type ?? 'yearly_books') as GoalType;
    return {
      id:             c.id,
      year:           c.year,
      goal_type:      gt,
      goal_target:    c.goal_target ?? c.goal_books ?? 12,
      goal_books:     c.goal_books  ?? 0,
      goal_pages:     c.goal_pages  ?? null,
      current_value:  currentByType[gt] ?? 0,
      current_books:  booksCount ?? 0,
      current_pages:  pagesCount,
    };
  });

  // Legacy: return first yearly_books goal as `data` for backwards compatibility
  const legacy = goals.find(g => g.goal_type === 'yearly_books') ?? goals[0];

  return NextResponse.json({ data: legacy, goals });
}
