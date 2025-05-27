import { BaseError, toBaseError } from './error-types';
import { logger } from '../logger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  rethrow?: boolean;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handle(error: unknown, options: ErrorHandlerOptions = {}): Promise<void> {
    const { showToast = true, rethrow = false, context = {} } = options;
    
    const baseError = toBaseError(error);
    
    // Log the error with context
    logger.error(baseError.message, {
      error: baseError,
      code: baseError.code,
      statusCode: baseError.statusCode,
      metadata: baseError.metadata,
      context,
      stack: baseError.stack,
    });

    // Show toast notification if enabled
    if (showToast) {
      this.showErrorToast(baseError);
    }

    // Optionally rethrow the error
    if (rethrow) {
      throw baseError;
    }
  }

  private showErrorToast(error: BaseError): void {
    // Get user-friendly message based on error type
    const message = this.getUserFriendlyMessage(error);
    
    // Use the toast context to show the error
    // This assumes you have a ToastContext set up
    const { showToast } = window.__toast || {};
    if (showToast) {
      showToast(message, 'error');
    }
  }

  private getUserFriendlyMessage(error: BaseError): string {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again';
      case 'NETWORK_ERROR':
        return 'Network error occurred. Please check your connection';
      case 'AUTHENTICATION_ERROR':
        return 'Please log in to continue';
      case 'AUTHORIZATION_ERROR':
        return 'You do not have permission to perform this action';
      case 'NOT_FOUND':
        return 'The requested resource was not found';
      case 'RATE_LIMIT':
        return 'Too many requests. Please try again later';
      case 'CONFLICT':
        return 'A conflict occurred with the requested operation';
      case 'SERVER_ERROR':
        return 'An unexpected error occurred. Please try again later';
      default:
        return error.message;
    }
  }
}

// Export a singleton instance
export const errorHandler = ErrorHandler.getInstance(); 