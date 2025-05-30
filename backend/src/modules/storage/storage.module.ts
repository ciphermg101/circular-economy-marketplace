import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { StorageService } from '../../services/storage.service';
import { StorageController } from './storage.controller';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseConfig } from '../../config/supabase.config';

@Module({
  imports: [
    ConfigModule,
    MonitoringModule,
    SupabaseModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, SupabaseConfig],
  exports: [StorageService],
})
export class StorageModule {} 