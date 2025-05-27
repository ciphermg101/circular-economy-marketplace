import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Span, SpanContext } from '@sentry/types';
import { MetricsService } from './metrics.service';

interface ErrorContext {
  [key: string]: any;
}

interface TransactionContext {
  name: string;
  op: string;
  description?: string;
  tags?: Record<string, string>;
}

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly isDevelopment: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.isDevelopment = configService.get('NODE_ENV') === 'development';
  }

  onModuleInit() {
    this.initializeSentry();
  }

  private initializeSentry() {
    const sentryDsn = this.configService.get('monitoringConfig.sentryDsn');
    const environment = this.configService.get('monitoringConfig.environment');

    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        tracesSampleRate: 1.0,
      });
    }
  }

  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  captureMessage(message: string, context?: Record<string, any>) {
    Sentry.captureMessage(message, {
      extra: context,
    });
  }

  startTransaction(name: string) {
    return Sentry.startTransaction({
      name,
      op: 'transaction',
    });
  }

  setUser(user: { id: string; email?: string }) {
    Sentry.setUser(user);
  }

  clearUser() {
    Sentry.setUser(null);
  }

  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  setExtra(key: string, value: any) {
    Sentry.setExtra(key, value);
  }

  captureException(error: Error, context?: ErrorContext) {
    this.logger.error(error.message, {
      error,
      context,
    });

    if (!this.isDevelopment) {
      Sentry.withScope(scope => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, MonitoringService.sanitizeData(value));
          });
        }
        Sentry.captureException(error);
      });
    }
  }

  finishTransaction(span: Span) {
    span.finish();
    this.logger.debug(`Transaction ${span.op} took ${span.endTimestamp! - span.startTimestamp}ms`);
  }

  startSpan(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  async withTransaction<T>(
    context: TransactionContext,
    callback: (span: Span) => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(context.name);

    try {
      const result = await callback(transaction);
      return result;
    } catch (error) {
      this.captureException(error, { transactionName: context.name });
      throw error;
    } finally {
      this.finishTransaction(transaction);
    }
  }

  private static sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'creditCard',
    ];

    const sanitizeObject = (obj: any) => {
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  private handleError(error: Error) {
    // Log the error
    this.logger.error(error.message, error.stack);

    // Capture error in Sentry
    Sentry.captureException(error);
  }

  private measureTransactionDuration(name: string, duration: number) {
    this.logger.debug(`Transaction ${name} took ${duration}ms`);
  }
} 