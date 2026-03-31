import posthog from 'posthog-js';

type AnalyticsEvent =
  | { event: 'signed_up'; properties: { provider: string } }
  | { event: 'book_added'; properties: { status: string; source: string } }
  | { event: 'session_logged'; properties: { mode: 'pages' | 'minutes'; value: number } }
  | { event: 'ai_feature_used'; properties: { feature: 'insights' | 'mood' | 'dna' | 'personality' | 'recommend' | 'reading-coach' | 'habit-nudge'; mode?: string } }
  | { event: 'premium_upgrade_clicked'; properties: { source: string } }
  | { event: 'goal_set'; properties: { goal_books: number } }
  | { event: 'friend_followed'; properties: Record<string, never> }
  | { event: 'review_written'; properties: { rating: number } }
  | { event: 'share_card_created'; properties: { template: string } };

export function track(payload: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  posthog.capture(payload.event, payload.properties);
}

export function identify(userId: string, traits: { email?: string; is_premium?: boolean }) {
  posthog.identify(userId, traits);
}

export function reset() {
  posthog.reset();
}
