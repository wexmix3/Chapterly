-- Migration 021: Referral system
-- Adds referral_code to users and a referrals tracking table.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_referral_code_idx ON public.users (referral_code) WHERE referral_code IS NOT NULL;

-- Referrals ledger: one row per converted referral
CREATE TABLE IF NOT EXISTS public.referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_id)   -- each user can only be referred once
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own referrals
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT TO authenticated USING (referrer_id = auth.uid());

-- Service role inserts referrals at signup
CREATE POLICY "referrals_insert_service" ON public.referrals
  FOR INSERT TO service_role WITH CHECK (true);
