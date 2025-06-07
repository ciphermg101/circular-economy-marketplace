import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { TransactionStatus } from '@transactions/transaction.entity';

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;
} 