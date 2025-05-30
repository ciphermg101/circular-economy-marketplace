import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Assuming ProductCondition is an enum, you need to define it properly
export enum ProductCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export interface Point {
  latitude: number;
  longitude: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  category: string;
  images: string[];
  location: Point;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Product category' })
  @IsString()
  category: string;

  @ApiProperty({ 
    enum: ProductCondition,
    description: 'Product condition',
    example: 'good'
  })
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @ApiPropertyOptional({ 
    description: 'Product price in KES',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Array of image URLs'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ 
    description: 'Product location coordinates',
    type: 'object' // Change to 'object' since Point is a type
  })
  @IsObject()
  @IsOptional()
  location?: Point;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Product category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ 
    enum: ProductCondition,
    description: 'Product condition',
    example: 'good'
  })
  @IsEnum(ProductCondition)
  @IsOptional()
  condition?: ProductCondition;

  @ApiPropertyOptional({ 
    description: 'Product price in KES',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Array of image URLs'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ 
    description: 'Product location coordinates',
    type: 'object' // Change to 'object' since Point is a type
  })
  @IsObject()
  @IsOptional()
  location?: Point;

  @ApiPropertyOptional({ 
    description: 'Product status',
    example: 'active'
  })
  @IsString()
  @IsOptional()
  status?: string;
}

export class SearchProductsDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ description: 'Product category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ 
    enum: ProductCondition,
    description: 'Product condition',
    example: 'good'
  })
  @IsEnum(ProductCondition)
  @IsOptional()
  condition?: ProductCondition;

  @ApiPropertyOptional({ 
    description: 'Minimum price in KES',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum price in KES',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Product location coordinates',
    type: 'object' // Change to 'object' since Point is a type
  })
  @IsObject()
  @IsOptional()
  location?: Point;

  @ApiPropertyOptional({ 
    description: 'Search radius in kilometers',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  radius?: number;
}