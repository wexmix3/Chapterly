-- AI usage log for cost monitoring.
-- Rows are inserted fire-and-forget after each Claude call.
-- This table is append-only; no RLS needed (server-side writes only via service role).

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint      text NOT NULL,
  input_tokens  int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  cached        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_log_user_id_idx   ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_log_created_at_idx ON ai_usage_log(created_at);
