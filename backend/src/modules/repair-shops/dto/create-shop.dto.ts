import { IsString, IsNotEmpty, IsOptional, IsObject, IsEmail } from 'class-validator';

export class CreateRepairShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  email: string;
} 