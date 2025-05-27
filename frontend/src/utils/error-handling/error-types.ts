import { z } from 'zod';

export class BaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(public errors: z.ZodError) {
    super(
      'Validation failed',
      'VALIDATION_ERROR',
      422,
      { validationErrors: errors.flatten() }
    );
  }
}

export class NetworkError extends BaseError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
  }
}

export class ServerError extends BaseError {
  constructor(message = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
  }
}

export class ConflictError extends BaseError {
  constructor(message = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
  }
}

export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function toBaseError(error: unknown): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new ValidationError(error);
  }

  if (error instanceof Error) {
    return new ServerError(error.message);
  }

  return new ServerError('An unknown error occurred');
} 