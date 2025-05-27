import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MpesaModule } from '../mpesa/mpesa.module';

@Module({
  imports: [ConfigModule, MpesaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {} 