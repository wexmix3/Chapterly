-- Migration 015: Daily Quests — quest_completions table
-- One row per user per quest per day; drives XP rewards on the dashboard.

-- Daily quest completions (one row per user per quest per day)
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_key TEXT NOT NULL,  -- e.g. 'log_session', 'add_book', 'write_review'
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quest_key, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user_date ON quest_completions(user_id, completed_date);

ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own completions" ON quest_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
