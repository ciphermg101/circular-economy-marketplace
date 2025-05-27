import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject, Min } from 'class-validator';
import { Point, ProductCondition } from '../types/common.types';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  condition: ProductCondition;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsObject()
  @IsOptional()
  location?: Point;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  @IsOptional()
  condition?: ProductCondition;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsObject()
  @IsOptional()
  location?: Point;

  @IsString()
  @IsOptional()
  status?: string;
}

export class SearchProductsDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  @IsOptional()
  condition?: ProductCondition;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @IsObject()
  @IsOptional()
  location?: Point;

  @IsNumber()
  @Min(0)
  @IsOptional()
  radius?: number; // in kilometers
} 