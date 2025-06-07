import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService } from '@common/sentry/sentry.service';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly sentryService: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.sentryService.captureException(exception, {
      url: request.url,
      method: request.method,
      body: request.body,
      query: request.query,
    });

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
    } else {
      response.status(500).json({ message: 'Internal server error' });
    }
  }
}
