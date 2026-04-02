import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  sendDefaultPii: true,

  // 100% in dev so you see everything locally, 10% in prod
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of error sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  enabled: process.env.NODE_ENV === 'production',
});

// Capture App Router navigation transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
