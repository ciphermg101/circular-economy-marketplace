import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { ErrorCategory } from '../types/error.types';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  requestId?: string;
  code?: string;
  details?: any;
}

interface DatabaseError extends Error {
  driverError?: {
    code: string;
  };
}

class ExternalServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = configService.get('app.env') === 'production';
  }

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const [statusCode, message, errorCategory] = this.handleError(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      error: errorCategory,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    };

    // Log the error with context
    this.logError(exception, errorResponse, request);

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  private handleError(error: Error): [number, string, ErrorCategory] {
    if (error instanceof QueryFailedError) {
      return this.handleDatabaseError(error);
    } else if (error instanceof HttpException) {
      return this.handleHttpException(error);
    } else if (error instanceof ExternalServiceError) {
      return this.handleExternalServiceError(error);
    }

    return [HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', 'UNKNOWN_ERROR'];
  }

  private handleDatabaseError(error: QueryFailedError): [number, string, ErrorCategory] {
    const driverError = (error as any).driverError;
    if (!driverError?.code) {
      return [HttpStatus.INTERNAL_SERVER_ERROR, 'Database error', 'DATABASE_ERROR'];
    }

    switch (driverError.code) {
      case '23505': // unique_violation
        return [HttpStatus.CONFLICT, 'Resource already exists', 'DATABASE_ERROR'];
      case '23503': // foreign_key_violation
        return [HttpStatus.BAD_REQUEST, 'Related resource not found', 'DATABASE_ERROR'];
      case '23502': // not_null_violation
        return [HttpStatus.BAD_REQUEST, 'Required field is missing', 'DATABASE_ERROR'];
      case '42P01': // undefined_table
        return [HttpStatus.INTERNAL_SERVER_ERROR, 'Database configuration error', 'DATABASE_ERROR'];
      default:
        return [HttpStatus.INTERNAL_SERVER_ERROR, 'Database error', 'DATABASE_ERROR'];
    }
  }

  private handleHttpException(error: HttpException): [number, string, ErrorCategory] {
    const statusCode = error.getStatus();
    const message = error.message;

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return [statusCode, message, 'VALIDATION_ERROR'];
      case HttpStatus.UNAUTHORIZED:
        return [statusCode, message, 'AUTHENTICATION_ERROR'];
      case HttpStatus.FORBIDDEN:
        return [statusCode, message, 'AUTHORIZATION_ERROR'];
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return [statusCode, message, 'BUSINESS_LOGIC_ERROR'];
      default:
        return [statusCode, message, 'UNKNOWN_ERROR'];
    }
  }

  private handleExternalServiceError(error: ExternalServiceError): [number, string, ErrorCategory] {
    return [HttpStatus.SERVICE_UNAVAILABLE, error.message, 'EXTERNAL_SERVICE_ERROR'];
  }

  private logError(exception: Error, errorResponse: ErrorResponse, request: any) {
    const logContext = {
      ...errorResponse,
      userId: request.user?.id,
      method: request.method,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
      stack: exception.stack,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${errorResponse.error}] ${errorResponse.message}`,
        logContext,
      );
    } else {
      this.logger.warn(
        `[${errorResponse.error}] ${errorResponse.message}`,
        logContext,
      );
    }
  }

  private sanitizeHeaders(headers: any) {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    });
    
    return sanitized;
  }
}

@Injectable()
export class ErrorMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorMiddleware.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = configService.get('app.env') === 'production';
  }

  use(req: Request, res: Response, next: NextFunction) {
    const errorHandler = (error: any) => {
      this.logger.error('Unhandled error:', error);

      if (!res.headersSent) {
        const statusCode = error.status || 500;
        const message = this.isProduction
          ? 'Internal server error'
          : error.message || 'Something went wrong';

        res.status(statusCode).json({
          statusCode,
          message,
          timestamp: new Date().toISOString(),
          path: req.url,
          ...(this.isProduction ? {} : { stack: error.stack }),
        });
      }
    };

    process.on('unhandledRejection', errorHandler);
    process.on('uncaughtException', errorHandler);

    next();
  }
} 