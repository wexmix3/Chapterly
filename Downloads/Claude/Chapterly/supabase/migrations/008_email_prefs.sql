-- Add email notification preference to users table.
-- Defaults to true so existing users keep receiving emails until they opt out.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;
