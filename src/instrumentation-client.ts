import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay for debugging
  replaysSessionSampleRate: 0.05, // 5% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'Load failed',
    'Failed to fetch',
    'NetworkError',
    'AbortError',
  ],

  // Set environment
  environment: process.env.NODE_ENV,
});

// Required for Next.js App Router navigation tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
