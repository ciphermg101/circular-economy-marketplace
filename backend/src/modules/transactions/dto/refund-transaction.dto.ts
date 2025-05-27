import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RefundTransactionDto {
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @IsString()
  @IsOptional()
  reason?: string;
} 