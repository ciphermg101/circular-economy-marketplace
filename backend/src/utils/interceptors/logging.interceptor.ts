// backend/src/utils/interceptors/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { logger } from '../logger'; // Import the logger instance
import { MetricsService } from '../../services/metrics.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService, private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const { method, url, query, body, headers } = request;
    const userId = (request as any).user?.id;

    const requestLog = {
      method,
      url,
      query: this.sanitizeData(query),
      body: this.sanitizeData(body),
      headers: this.sanitizeHeaders(headers),
      userId,
      timestamp: new Date().toISOString(),
    };

    // Create a child logger with request context
    const requestLogger = logger(this.configService); // Pass the configService to the logger

    requestLogger.info(`Incoming request: ${JSON.stringify(requestLog)}`); // Format the log message

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          const duration = Date.now() - startTime;
          const responseLog = {
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            responseSize: this.getResponseSize(data),
          };

          requestLogger.info(`Request completed successfully: ${JSON.stringify(responseLog)}`); // Format the log message

          // Record metrics
          this.metricsService.recordHttpRequest(
            method,
            url,
            response.statusCode,
            duration / 1000 // Convert to seconds
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const errorLog = {
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          };

          requestLogger.error(`Request failed: ${JSON.stringify(errorLog)}`); // Format the log message

          // Record error metrics
          this.metricsService.recordError({
            type: 'UNKNOWN_ERROR',
            severity: 'medium',
            context: 'http',
            path: url
          });
          this.metricsService.recordHttpRequest(
            method,
            url,
            response.statusCode,
            duration / 1000
          );
        },
      })
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        acc[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = this.sanitizeData(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    return Object.entries(headers).reduce((acc, [key, value]) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        acc[key] = '[REDACTED]';
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private getResponseSize(data: any): string {
    if (!data) return '0B';
    const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)}${units[unitIndex]}`;
  }
}