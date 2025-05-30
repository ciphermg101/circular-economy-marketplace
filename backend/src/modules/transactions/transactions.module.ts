import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MpesaModule } from '../mpesa/mpesa.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    MpesaModule,
    MonitoringModule,
    SupabaseModule,
    WebsocketModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {} 