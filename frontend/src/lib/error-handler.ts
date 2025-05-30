import { z } from 'zod'

/**
 * Base application error with metadata
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// Specific client-side error types
export class ValidationError extends AppError {
  constructor(errors: z.ZodError) {
    super('Validation failed', 'VALIDATION_ERROR', 422, {
      validationErrors: errors.flatten(),
    })
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 503)
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429)
  }
}

export class ServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 'CONFLICT', 409)
  }
}

// Error handling utilities (frontend-safe)
export function handleError(error: unknown, context?: Record<string, unknown>): AppError {
  if (error instanceof AppError) {
    console.error('[Handled AppError]', error, context)
    return error
  }

  if (error instanceof z.ZodError) {
    const appError = new ValidationError(error)
    console.error('[Validation Error]', appError, context)
    return appError
  }

  const appError = new ServerError(
    error instanceof Error ? error.message : 'An unknown error occurred'
  )
  console.error('[Unhandled Error]', appError, context)
  return appError
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw handleError(error, context)
  }
}

export function serializeError(error: AppError) {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    metadata: error.metadata,
  }
}

// Export the error handler singleton
export const errorHandler = {
  handle: handleError,
  isAppError,
  withErrorHandling,
  serialize: serializeError,
}
