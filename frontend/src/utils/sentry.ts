import * as Sentry from '@sentry/nextjs';

export const initializeSentry = () => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV;

  if (!dsn) {
    console.warn('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    // Enable tracing
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Enable profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Only enable in production
    enabled: environment === 'production',
    // Set the maximum breadcrumbs to capture
    maxBreadcrumbs: 50,
    // Enable debug mode in development
    debug: environment !== 'production',
    // Configure error filtering
    ignoreErrors: [
      // Add any errors you want to ignore
      'ResizeObserver loop limit exceeded',
      'Network request failed',
    ],
    // Configure URL filtering
    denyUrls: [
      // Add URLs you want to ignore
      /extensions\//i,
      /^chrome:\/\//i,
    ],
    // Configure which Release to track
    release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    // Automatically instrument React components
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/your-domain\.com/],
      }),
      new Sentry.Replay({
        // Configure session replay
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Configure replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}; 