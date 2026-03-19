import Stripe from 'stripe';

// Lazy-initialize so build doesn't fail on missing env var
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
  }
  return _stripe;
}

export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID ?? '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export const PREMIUM_FEATURES = [
  'Unlimited book clubs (free: 1)',
  'Advanced stats & insights',
  'Custom share card themes',
  '1 streak freeze per month',
  'Ad-free experience',
  'Priority support',
] as const;

export const PREMIUM_PRICE_DISPLAY = '$4.99/mo';
