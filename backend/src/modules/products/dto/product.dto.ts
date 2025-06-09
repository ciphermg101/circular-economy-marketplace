import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsArray, IsObject, IsUUID } from 'class-validator';
import { ProductCondition } from '@products/product.entity';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

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
