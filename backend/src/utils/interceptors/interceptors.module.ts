import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringModule } from '../../modules/monitoring/monitoring.module';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [
    ConfigModule,
    MonitoringModule,
  ],
  providers: [LoggingInterceptor],
  exports: [LoggingInterceptor],
})
export class InterceptorsModule {} 