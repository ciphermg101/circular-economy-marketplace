import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '@transactions/transaction.entity';
import { Offer } from '@transactions/offer.entity';
import { TransactionsRepository } from '@transactions/transactions.repository';
import { TransactionsService } from '@transactions/transactions.service';
import { TransactionsController } from '@transactions/transactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Offer])],
  controllers: [TransactionsController],
  providers: [TransactionsRepository, TransactionsService],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {} 