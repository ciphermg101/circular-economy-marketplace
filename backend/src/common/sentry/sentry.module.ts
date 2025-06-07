import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryService } from '@common/sentry/sentry.service';
import { SentryExceptionFilter } from '@common/sentry/sentry.filter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SentryService, SentryExceptionFilter],
  exports: [SentryService],
})
export class SentryModule {}
