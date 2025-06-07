import { IsUUID, IsNumber } from 'class-validator';

export class OfferDto {
  @IsUUID()
  buyerId: string;

  @IsUUID()
  sellerId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  amount: number;
} 