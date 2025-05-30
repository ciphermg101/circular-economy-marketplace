export type ErrorCategory = 
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'CIRCUIT_BREAKER'
  | 'UNKNOWN_ERROR';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DatabaseErrorDetail {
  code: string;
  table?: string;
  constraint?: string;
  detail?: string;
}

export interface ErrorDetail {
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  path?: string;
  databaseError?: DatabaseErrorDetail;
  context?: Record<string, unknown>;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ErrorDetail;
  requestId?: string;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly category: ErrorCategory,
    public readonly severity: ErrorSeverity = 'medium',
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
} 