-- Migration 017: Feed reactions (heart/like on feed events)

CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT        NOT NULL, -- 'user_book' | 'review' | 'quote'
  target_id   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feed_reactions_unique UNIQUE (user_id, target_type, target_id)
);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_reactions_select" ON public.feed_reactions
  FOR SELECT USING (true);

CREATE POLICY "feed_reactions_insert" ON public.feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_reactions_delete" ON public.feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_reactions_target
  ON public.feed_reactions (target_type, target_id);
