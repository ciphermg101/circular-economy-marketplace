import { IsOptional, IsString, IsUUID, IsNumber, IsEnum, IsObject } from 'class-validator';
import { ProductCondition } from '@products/product.entity';

export class SearchProductsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional()
  @IsObject()
  location?: { latitude: number; longitude: number };

  @IsOptional()
  @IsNumber()
  radius?: number;
} 