import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MpesaService } from '../../services/mpesa.service';
import { MpesaController } from './mpesa.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { RedisModule } from '../cache/redis.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    MonitoringModule,
    RedisModule,
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {} 