import { IsString, IsOptional, IsArray, IsObject, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Point } from '../types/common.types';

export class BusinessHours {
  @IsString()
  @IsOptional()
  monday?: string;

  @IsString()
  @IsOptional()
  tuesday?: string;

  @IsString()
  @IsOptional()
  wednesday?: string;

  @IsString()
  @IsOptional()
  thursday?: string;

  @IsString()
  @IsOptional()
  friday?: string;

  @IsString()
  @IsOptional()
  saturday?: string;

  @IsString()
  @IsOptional()
  sunday?: string;
}

export class ContactInfo {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  socialMedia?: string;
}

export class CreateRepairShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsObject()
  @IsNotEmpty()
  location: Point;

  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHours)
  businessHours: BusinessHours;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfo)
  contactInfo: ContactInfo;
}

export class UpdateRepairShopDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @IsObject()
  @IsOptional()
  location?: Point;

  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHours)
  @IsOptional()
  businessHours?: BusinessHours;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfo)
  @IsOptional()
  contactInfo?: ContactInfo;
}

export class SearchRepairShopsDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @IsObject()
  @IsOptional()
  location?: Point;

  @IsString()
  @IsOptional()
  radius?: string; // in kilometers

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];
} 