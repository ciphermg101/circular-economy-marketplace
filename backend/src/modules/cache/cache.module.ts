import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from '../../services/cache.service';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule,
    MonitoringModule,
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {} 