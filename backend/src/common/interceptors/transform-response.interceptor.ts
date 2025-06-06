import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((result) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        let data: T;

        if (result && typeof result === 'object' && 'data' in result) {
          data = result.data;
        } else {
          data = result;
        }

        return {
          statusCode,
          data,
        };
      })
    );
  }
}