-- Add invite token to clubs table for shareable invite links
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS invite_token UUID;
CREATE INDEX IF NOT EXISTS clubs_invite_token_idx ON clubs(invite_token);
