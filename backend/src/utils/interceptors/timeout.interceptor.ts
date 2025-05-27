import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeout: number;

  constructor(private configService: ConfigService) {
    this.defaultTimeout = this.configService.get('REQUEST_TIMEOUT', 30000); // Default 30 seconds
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get custom timeout from route metadata if set
    const handler = context.getHandler();
    const customTimeout = Reflect.getMetadata('timeout', handler);
    const timeoutValue = customTimeout || this.defaultTimeout;

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException(
            'Request processing timeout. Please try again later.'
          ));
        }
        return throwError(() => err);
      }),
    );
  }
} 