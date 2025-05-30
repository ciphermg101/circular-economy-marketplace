import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentalImpactService } from './environmental-impact.service';
import { EnvironmentalImpactController } from './environmental-impact.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { RedisModule } from '../cache/redis.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    RedisModule,
    MonitoringModule,
  ],
  controllers: [EnvironmentalImpactController],
  providers: [EnvironmentalImpactService],
  exports: [EnvironmentalImpactService],
})
export class EnvironmentalImpactModule {} 