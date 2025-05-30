import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { logger } from '../logger'; // Import the logger instance
import { MonitoringService } from '../../services/monitoring.service';
import { v4 as uuidv4 } from 'uuid';

// Update the ErrorAnalytics interface to match the expected structure
interface ErrorAnalytics {
  errorId: string;
  error: Error; // Include the error property
  type: 'AUTH' | 'ACCESS' | 'NOT_FOUND' | 'VALIDATION' | 'SYSTEM' | 'UNKNOWN';
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: string; // Include the module property
  timestamp: string;
  userId?: string;
  requestId?: string;
  path: string;
  context: {
    errorId: string;
    method: string;
    headers: Record<string, any>;
    query: Record<string, any>;
    body: any;
    params: Record<string, any>;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = logger(new ConfigService()); // Initialize logger with ConfigService

  constructor(
    private configService: ConfigService,
    private monitoringService: MonitoringService
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorId = uuidv4();
    const timestamp = new Date();

    // Determine error severity based on status code
    const severity = this.getErrorSeverity(status);

    // Track error analytics
    const errorAnalytics: ErrorAnalytics = {
      errorId,
      error: exception, // Include the error object
      type: this.getErrorCategory(exception),
      severity,
      module: request.path,
      timestamp: timestamp.toISOString(),
      userId: (request as any).user?.id,
      requestId: request.headers['x-request-id'] as string,
      path: request.url,
      context: {
        errorId,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        body: this.sanitizeBody(request.body),
        params: request.params,
      },      
    };

    this.monitoringService.trackErrorAnalytics(errorAnalytics);

    // Log error details
    this.logger.error({
      message: 'Request error',
      errorId,
      path: request.url,
      error: exception.message,
      stack: exception.stack,
      status,
    });

    // Send error response
    response.status(status).json({
      statusCode: status,
      errorId,
      timestamp,
      path: request.url,
      message: this.getErrorMessage(exception),
    });
  }

  private getErrorSeverity(status: number): 'low' | 'medium' | 'high' | 'critical' {
    if (status >= 500) return 'critical';
    if (status >= 400) return 'high';
    if (status >= 300) return 'medium';
    return 'low';
  }

  private getErrorCategory(error: Error): 'AUTH' | 'ACCESS' | 'NOT_FOUND' | 'VALIDATION' | 'SYSTEM' | 'UNKNOWN' {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      if (status === HttpStatus.UNAUTHORIZED) return 'AUTH';
      if (status === HttpStatus.FORBIDDEN) return 'ACCESS';
      if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
      if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION';
      if (status >= 500) return 'SYSTEM';
    }
    return 'UNKNOWN';
  }

  private getErrorMessage(exception: Error): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'message' in response) {
        return Array.isArray(response.message)
          ? response.message.join(', ')
          : response.message as string;
      }
      return response as string;
    }
    return 'Internal server error';
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

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    return Object.entries(body).reduce((acc, [key, value]) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        acc[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = this.sanitizeBody(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }
}