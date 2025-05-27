import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { SupabaseConfig } from '../../config/supabase.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, SupabaseConfig],
  exports: [TransactionsService],
})
export class TransactionsModule {} 