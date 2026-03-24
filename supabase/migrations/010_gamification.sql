-- Migration 010: Gamification — XP, reader level, avatar, streak freeze

-- Add XP and level to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reader_level integer NOT NULL DEFAULT 1;

-- Avatar selection (e.g. 'book', 'coffee', 'moon', 'zap', 'leaf', 'flame', 'star', 'target')
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type text NOT NULL DEFAULT 'book';

-- Streak freeze (one free pass available per week)
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freeze_available boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freeze_used_at date;
