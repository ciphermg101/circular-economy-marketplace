import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { MetricsService } from './metrics.service';
import { logger } from '../utils/logger';

interface TransactionContext {
  name: string;
  op?: string;
  description?: string;
  tags?: Record<string, string>;
}

@Injectable()
export class MonitoringService {
  private readonly isDevelopment: boolean;
  private readonly errorTrends = new Map<string, { count: number; occurrences: any[] }>();
  private readonly logger: ReturnType<typeof logger>;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService
  ) {
    this.logger = logger(this.configService);
    this.isDevelopment = this.configService.get('monitoring.environment') === 'development';
    this.initializeSentry();
  }

  private initializeSentry() {
    const dsn = this.configService.get('monitoring.sentryDsn');
    if (!dsn) {
      this.logger.warn('Sentry DSN not provided, error tracking will be limited');
      return;
    }

    Sentry.init({
      dsn,
      environment: this.configService.get('monitoring.environment'),
      tracesSampleRate: this.isDevelopment ? 1.0 : 0.1,
    });
  }

  trackError(error: Error, context: { module: string }) {
    this.logger.error(`Error occurred in module ${context.module}: ${error.message}`, error.stack, context.module); // Pass context.module as a string

    this.metricsService.incrementErrorCount(error.name, context.module || 'unknown');
    this.updateErrorTrends(error, context);
  }

  private updateErrorTrends(error: Error, context: { module: string }) {
    const key = `${error.name}:${context.module}`;
    const now = new Date();

    const analytics = {
      timestamp: now,
      error,
      module: context.module,
      message: error.message,
      stack: error.stack,
    };

    const existing = this.errorTrends.get(key) || { count: 0, occurrences: [] };
    existing.count++;
    existing.occurrences.push(analytics);
    this.errorTrends.set(key, existing);
  }

  getErrorTrends(): Map<string, { count: number; occurrences: any[] }> {
    return this.errorTrends;
  }

  getRecentErrors(limit: number = 10): any[] {
    const allErrors: any[] = [];
    for (const trends of this.errorTrends.values()) {
      allErrors.push(...trends.occurrences);
    }
    return allErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  captureException(error: Error, context?: Record<string, any>) {
    this.logger.error(`Error captured: ${error.message}`, error.stack, context ? JSON.stringify(context) : undefined); // Convert context to string if necessary
    if (!this.isDevelopment) {
      Sentry.captureException(error);
    }
  }

  captureError(error: Error, context?: Record<string, any>) {
    this.captureException(error, context);
    this.metricsService.recordError({
      type: 'UNKNOWN_ERROR',
      severity: 'medium',
      context: context?.module || 'unknown',
      path: context?.path || 'unknown'
    });
  }

  captureEvent(eventName: string, metadata: Record<string, any> = {}) {
    try {
      this.logger.debug(`Event captured: ${eventName}`); // Update logging method
      
      // Track event metrics
      this.metricsService.increment('event_' + eventName + '_total', metadata); // Ensure increment method exists

      // Send to Sentry if in production
      if (!this.isDevelopment) {
        Sentry.captureEvent({
          message: eventName,
          level: 'info',
          extra: metadata,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to capture event ${eventName}:`, error); // Update logging method
    }
  }

  trackErrorAnalytics(analytics: {
    errorId: string;
    error: Error;
    type: string;
    severity: string;
    module: string;
    timestamp: string;
    userId?: string;
    requestId?: string;
    path: string;
    context: Record<string, any>;
  }) {
    // Format all relevant metadata into the message string
    const message = `Analytics - Error [${analytics.severity}] in ${analytics.module} at ${analytics.timestamp} | ID: ${analytics.errorId} | Message: ${analytics.error.message} | Path: ${analytics.path} | User: ${analytics.userId || 'N/A'} | Request: ${analytics.requestId || 'N/A'} | Context: ${JSON.stringify(analytics.context)}`;
  
    this.logger.error(
      message,
      analytics.error.stack,
      analytics.module // this is the `context` string
    );
  
    this.captureException(analytics.error, {
      module: analytics.module,
      errorId: analytics.errorId,
      path: analytics.path,
      requestId: analytics.requestId,
      userId: analytics.userId,
      context: analytics.context,
      type: analytics.type,
      severity: analytics.severity,
    });
  }   
}