import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  buyerId: string;

  @IsUUID()
  sellerId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  offerId?: string;

  @IsNumber()
  amount: number;
} 