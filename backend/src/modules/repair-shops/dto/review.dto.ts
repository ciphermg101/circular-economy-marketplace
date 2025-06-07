import { IsUUID, IsInt, Min, Max, IsString, Length, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class ReviewDto {
  @IsUUID()
  repairShopId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Length(10, 1000)
  comment: string;

  @IsBoolean()
  isVerifiedPurchase: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 