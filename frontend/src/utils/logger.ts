interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private readonly isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(level: string, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
    };
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    const sanitizeObject = (obj: Record<string, any>) => {
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

  private persistLog(entry: LogEntry): void {
    // In development, log to console with formatting
    if (this.isDevelopment) {
      const colors = {
        error: '\x1b[31m', // red
        warn: '\x1b[33m',  // yellow
        info: '\x1b[36m',  // cyan
        debug: '\x1b[32m', // green
        reset: '\x1b[0m',
      };

      const color = colors[entry.level as keyof typeof colors] || colors.reset;
      console.log(
        `${color}[${entry.level.toUpperCase()}] ${entry.timestamp}${colors.reset}\n`,
        entry.message,
        entry.context ? '\nContext:' : '',
        entry.context || ''
      );
    } else {
      // In production, we might want to send logs to a service like Sentry or LogRocket
      if (window.Sentry && entry.level === 'error') {
        window.Sentry.captureMessage(entry.message, {
          level: entry.level,
          extra: entry.context,
        });
      }

      // You could also implement other production logging services here
    }
  }

  error(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry('error', message, context);
    this.persistLog(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry('warn', message, context);
    this.persistLog(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry('info', message, context);
    this.persistLog(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      const entry = this.formatLogEntry('debug', message, context);
      this.persistLog(entry);
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Declare global Sentry interface
declare global {
  interface Window {
    Sentry?: {
      captureMessage(message: string, options?: { level: string; extra?: Record<string, any> }): void;
    };
  }
} 