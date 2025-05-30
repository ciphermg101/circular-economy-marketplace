import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Point,
  GeoPoint,
  BusinessHours as IBusinessHours,
  TimeRange,
} from '../types/common.types';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export interface RepairShop {
  id: string;
  name: string;
  description: string;
  services: string[];
  certifications: string[];
  location: GeoPoint;
  business_hours: IBusinessHours;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class TimeRangeDto implements TimeRange {
  @ApiProperty({ description: 'Opening time in HH:mm format', example: '09:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  open: string;

  @ApiProperty({ description: 'Closing time in HH:mm format', example: '17:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:mm format',
  })
  close: string;
}

export class BusinessHoursDto implements IBusinessHours {
  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  monday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  tuesday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  wednesday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  thursday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  friday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  saturday?: TimeRangeDto;

  @ApiPropertyOptional({ type: TimeRangeDto }) @IsOptional() @ValidateNested() @Type(() => TimeRangeDto)
  sunday?: TimeRangeDto;
}

export class ContactInfoDto {
  @ApiProperty({ description: 'Contact email address' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Invalid email format',
  })
  email: string;

  @ApiProperty({ description: 'Contact phone number', example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+254[0-9]{9}$/, {
    message: 'Phone number must be in format: +254XXXXXXXXX',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+\..+$/, {
    message: 'Invalid website URL format',
  })
  website?: string;

  @ApiPropertyOptional({ description: 'Social media handle' })
  @IsOptional()
  @IsString()
  socialMedia?: string;
}

export class CreateRepairShopDto {
  @ApiProperty({ description: 'Name of the repair shop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the repair shop' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: [String],
    description: 'List of services offered',
    example: ['Phone Repair', 'Laptop Repair', 'Tablet Repair'],
  })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ApiProperty({
    type: [String],
    description: 'List of certifications',
    example: ['Apple Certified', 'Samsung Certified'],
  })
  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @ApiProperty({
    type: 'object',
    description: 'Location of the repair shop',
    example: {
      type: 'Point',
      coordinates: [36.8219, -1.2921],
    },
  })
  @IsObject()
  @IsNotEmpty()
  location: GeoPoint;

  @ApiProperty({ type: BusinessHoursDto })
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  business_hours: BusinessHoursDto;

  @ApiProperty({ type: ContactInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;
}

export class UpdateRepairShopDto {
  @ApiPropertyOptional({ description: 'Name of the repair shop' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the repair shop' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of services offered',
    example: ['Phone Repair', 'Laptop Repair'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of certifications',
    example: ['Apple Certified', 'Samsung Certified'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({
    type: 'object',
    description: 'Location of the repair shop',
    example: {
      type: 'Point',
      coordinates: [36.8219, -1.2921],
    },
  })
  @IsOptional()
  @IsObject()
  location?: GeoPoint;

  @ApiPropertyOptional({ type: BusinessHoursDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  business_hours?: BusinessHoursDto;

  @ApiPropertyOptional({ type: ContactInfoDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}

export class SearchRepairShopsDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Filter by services',
    example: ['Phone Repair', 'Laptop Repair']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ 
    type: [String],
    description: 'Filter by certifications',
    example: ['Apple Certified', 'Samsung Certified']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ 
    type: 'object', // Change to 'object' since Point is a type
    description: 'Search location coordinates',
    example: {
      latitude: -1.2921,
      longitude: 36.8219
    }
  })
  @IsOptional()
  @IsObject()
  location?: Point;

  @ApiPropertyOptional({ 
    description: 'Search radius in kilometers',
    example: '10'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'Radius must be a valid number',
  })
  radius?: string;
}
