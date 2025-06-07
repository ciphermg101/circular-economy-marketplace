import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(
    error: any,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    message = 'An unexpected error occurred. Please try again later.',
  ) {
    super(
      {
        message,
        reason: error?.message,
        details: error,
      },
      status,
    );
  }
}
