import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    Sentry.init({
      dsn: this.configService.get<string>('monitoring.sentryDsn'),
      environment: this.configService.get<string>('app.env'),
      tracesSampleRate: 1.0,
    });
  }

  captureException(exception: any, context?: Record<string, any>) {
    Sentry.captureException(exception, { extra: context });
  }

  captureMessage(message: string, context?: Record<string, any>) {
    Sentry.captureMessage(message, { extra: context });
  }
}
