-- Migration 020: push_subscriptions
-- Stores Web Push (VAPID) subscriptions per user device.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own subscriptions
CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Service role can read all subscriptions to send push notifications
CREATE POLICY "push_subscriptions_service_select" ON push_subscriptions
  FOR SELECT TO service_role USING (true);
