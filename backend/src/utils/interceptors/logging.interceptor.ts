import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const requestLog = {
      method: request.method,
      url: request.url,
      query: this.sanitizeData(request.query),
      body: this.sanitizeData(request.body),
      headers: this.sanitizeHeaders(request.headers),
      userId: (request as any).user?.id,
      timestamp: new Date().toISOString(),
    };

    console.log('[Request]', JSON.stringify(requestLog));

    return next.handle().pipe(
      tap(() => {
        const responseLog = {
          statusCode: response.statusCode,
          duration: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString(),
        };

        console.log('[Response]', JSON.stringify(responseLog));
      }),
    );
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'authorization'];
      
      for (const key in sanitized) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
} 