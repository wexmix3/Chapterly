-- =====================================================
-- CHAPTERLY — Migration 007: Streak Leaderboard + Wrapped
-- =====================================================

-- Streak milestones (badges earned)
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_days INT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, milestone_days)
);
ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_select" ON public.streak_milestones FOR SELECT USING (true);
CREATE POLICY "sm_insert" ON public.streak_milestones FOR INSERT WITH CHECK (user_id = auth.uid());

-- Year in Books (Wrapped) cache
CREATE TABLE IF NOT EXISTS public.year_wrapped (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, year)
);
ALTER TABLE public.year_wrapped ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yw_own" ON public.year_wrapped FOR ALL USING (user_id = auth.uid());
CREATE POLICY "yw_public_select" ON public.year_wrapped FOR SELECT USING (true);
