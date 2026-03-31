-- Migration 016: Expand reading goals to support multiple goal types
-- Adds goal_type + goal_target columns and relaxes the unique constraint
-- so a user can have multiple goal types per year (weekly_pages, monthly_genres, yearly_books).

-- 1. Add new columns (nullable so existing rows keep working)
ALTER TABLE public.reading_challenges
  ADD COLUMN IF NOT EXISTS goal_type  TEXT NOT NULL DEFAULT 'yearly_books',
  ADD COLUMN IF NOT EXISTS goal_target INT  NOT NULL DEFAULT 0;

-- 2. Migrate existing data: set goal_target = goal_books for existing rows
UPDATE public.reading_challenges
  SET goal_target = goal_books
  WHERE goal_type = 'yearly_books' AND goal_target = 0 AND goal_books > 0;

-- 3. Drop the old unique constraint and add a new one that includes goal_type
ALTER TABLE public.reading_challenges
  DROP CONSTRAINT IF EXISTS reading_challenges_user_id_year_key;

ALTER TABLE public.reading_challenges
  ADD CONSTRAINT reading_challenges_user_year_type_key UNIQUE (user_id, year, goal_type);

-- 4. Add an index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_reading_challenges_user_year
  ON public.reading_challenges (user_id, year);
