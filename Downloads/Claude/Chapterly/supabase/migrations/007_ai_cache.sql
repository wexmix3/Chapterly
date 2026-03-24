-- AI response cache to prevent duplicate Claude calls for the same user+context.
-- TTL is enforced at the application layer (getCachedAI checks created_at).

CREATE TABLE IF NOT EXISTS ai_cache (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cache_key  text NOT NULL,
  response   jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index required for upsert on (user_id, cache_key)
CREATE UNIQUE INDEX IF NOT EXISTS ai_cache_user_key_idx ON ai_cache(user_id, cache_key);

-- Speed up TTL-filtered lookups
CREATE INDEX IF NOT EXISTS ai_cache_created_at_idx ON ai_cache(created_at);

-- RLS: users can only read/write their own cache rows
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ai_cache"
  ON ai_cache
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
