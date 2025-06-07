import { IsOptional, IsString, IsObject, IsNumber } from 'class-validator';

export class SearchRepairShopsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsObject()
  location?: { latitude: number; longitude: number };

  @IsOptional()
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsString()
  service?: string;
} 