-- Migration 018: feed_comments
-- Generic comment table for feed events, reviews, quotes, etc.
-- target_type: 'feed_event' | 'review' | 'quote'

CREATE TABLE IF NOT EXISTS feed_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('feed_event', 'review', 'quote')),
  target_id   TEXT NOT NULL,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_comments_target_idx ON feed_comments (target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS feed_comments_user_idx ON feed_comments (user_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read comments
CREATE POLICY "feed_comments_select" ON feed_comments
  FOR SELECT TO authenticated USING (true);

-- Users can only insert their own comments
CREATE POLICY "feed_comments_insert" ON feed_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own comments
CREATE POLICY "feed_comments_delete" ON feed_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
