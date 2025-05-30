import { 
  IsString, IsNumber, IsEnum, IsUUID, IsOptional, Min, IsArray, IsPhoneNumber, IsNotEmpty 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionStatus, MpesaCallbackResult } from '../types/common.types';

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other',
}

export class CreateTransactionDto {
  @ApiProperty({ 
    description: 'ID of the product being purchased',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ 
    description: 'ID of the seller',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({ 
    description: 'Transaction amount in KES',
    minimum: 1,
    example: 1000
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Additional notes for the transaction',
    example: 'Please deliver to the address provided'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ 
    enum: TransactionStatus,
    description: 'New status of the transaction',
    example: TransactionStatus.PAYMENT_COMPLETED
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ 
    description: 'Payment intent ID from payment provider',
    example: 'pi_3NkCmE2eZvKYlo2C1gHOKZLx'
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiPropertyOptional({ 
    description: 'Payment ID from payment provider',
    example: 'pay_3NkCmE2eZvKYlo2C1gHOKZLx'
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({ 
    description: 'Date when payment was done',
    example: '23-10-2025'
  })
  @IsOptional()
  @IsString()
  payment_date?: string;

  @ApiPropertyOptional({ 
    description: 'Error message if payment failed',
    example: 'Insufficient funds'
  })
  @IsOptional()
  @IsString()
  paymentError?: string;

  @ApiPropertyOptional({ 
    description: 'Tracking number for shipped items',
    example: 'TRACK123456789'
  })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes or updates',
    example: 'Package has been dispatched'
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateDisputeDto {
  @ApiProperty({ 
    enum: DisputeReason,
    description: 'Reason for the dispute',
    example: DisputeReason.ITEM_NOT_RECEIVED
  })
  @IsEnum(DisputeReason)
  @IsNotEmpty()
  reason: DisputeReason;

  @ApiProperty({ 
    description: 'Detailed description of the dispute',
    example: 'I have not received the item even though it shows as delivered'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ 
    type: [String],
    description: 'URLs of evidence files',
    example: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ 
    description: 'Resolution details',
    example: 'Refund approved based on evidence provided'
  })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiProperty({ 
    enum: TransactionStatus,
    description: 'Final status after resolution',
    example: TransactionStatus.REFUNDED
  })
  @IsEnum(TransactionStatus)
  @IsNotEmpty()
  finalStatus: TransactionStatus;

  @ApiPropertyOptional({ 
    description: 'Amount to be refunded if applicable',
    minimum: 0,
    example: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  refundAmount?: number;
}

export class ProcessPaymentDto {
  @ApiProperty({ 
    description: 'Phone number for M-Pesa payment',
    example: '254712345678',
    pattern: '^254[0-9]{9}$'
  })
  @IsString()
  @IsPhoneNumber('KE')
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ 
    description: 'Amount to be paid',
    minimum: 0,
    example: 1000
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;
}

export { MpesaCallbackResult, TransactionStatus };
