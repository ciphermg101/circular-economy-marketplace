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