import { IsString, IsNumber, IsEnum, IsUUID, IsOptional, Min, IsArray, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionStatus {
  PENDING = 'pending',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other'
}

export class CreateTransactionDto {
  @IsUUID()
  @ApiProperty()
  productId: string;

  @IsString()
  @ApiProperty()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  @ApiProperty({ enum: TransactionStatus })
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  notes?: string;
}

export class CreateDisputeDto {
  @IsString()
  @ApiProperty()
  reason: string;

  @IsString()
  @ApiProperty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ required: false, type: [String] })
  evidenceUrls?: string[];
}

export class ResolveDisputeDto {
  @IsString()
  @ApiProperty()
  resolution: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  refundAmount?: number;

  @IsEnum(TransactionStatus)
  @ApiProperty({ enum: TransactionStatus })
  finalStatus: TransactionStatus;
}

export class ProcessPaymentDto {
  @IsString()
  @IsPhoneNumber('KE')
  @ApiProperty({ 
    description: 'Phone number in the format 254XXXXXXXXX',
    example: '254712345678'
  })
  phoneNumber: string;
} 