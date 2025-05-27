import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

export const initializeSentry = (configService: ConfigService) => {
  const dsn = configService.get('monitoringConfig.sentryDsn');
  const environment = configService.get('app.env');

  if (!dsn) {
    console.warn('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Attach stack traces to errors
    attachStacktrace: true,
    // Set the maximum breadcrumbs to capture
    maxBreadcrumbs: 50,
    // Enable debug mode in development
    debug: environment !== 'production',
  });
}; 