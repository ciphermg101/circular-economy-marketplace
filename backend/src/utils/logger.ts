import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const { combine, timestamp, printf, colorize } = format;

const logDir = process.env.LOG_DIR || 'logs';
const logLevel = process.env.LOG_LEVEL || 'info';
const maxFiles = process.env.LOG_MAX_FILES || '14d';
const maxSize = process.env.LOG_MAX_SIZE || '20m';

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
export const logger = createLogger({
  level: logLevel,
  format: combine(
    timestamp(),
    format.json(),
    format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'circular-economy-marketplace' },
  transports: [
    // Console transport for development
    new transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        logFormat,
      ),
    }),
    
    // Rotating file transport for production
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize,
      maxFiles,
      level: 'error',
    }),
    
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize,
      maxFiles,
    }),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize,
      maxFiles,
    }),
  ],
  rejectionHandlers: [
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize,
      maxFiles,
    }),
  ],
});

// Add request context if available
export const addRequestContext = (req: any) => {
  return {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
  };
};

// Sanitize sensitive data
export const sanitizeData = (data: any): any => {
  if (!data) return data;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

// Sensitive data patterns to mask
const sensitivePatterns = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /authorization/i,
  /credit_card/i,
];

// Mask sensitive data in objects
export function maskSensitiveData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'object') {
    const masked = { ...data };
    for (const key in masked) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }
  
  return data;
}

// Request logger middleware
export function requestLogger(req: Request, res: any, next: () => void) {
  const start = Date.now();
  
  // Log request
  const requestLog = {
    method: req.method,
    url: req.url,
    query: maskSensitiveData(req.query),
    body: maskSensitiveData(req.body),
    headers: maskSensitiveData(req.headers),
    timestamp: new Date().toISOString(),
  };
  
  console.log('[Request]', JSON.stringify(requestLog));
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseLog = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
    console.log('[Response]', JSON.stringify(responseLog));
  });
  
  next();
} 