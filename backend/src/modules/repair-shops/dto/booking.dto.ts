import { IsUUID, IsDateString, IsOptional, IsObject } from 'class-validator';

export class BookingDto {
  @IsUUID()
  repairShopId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 