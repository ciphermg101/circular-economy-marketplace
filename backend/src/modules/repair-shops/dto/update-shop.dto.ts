import { IsString, IsOptional, IsObject, IsEmail } from 'class-validator';

export class UpdateRepairShopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
} 