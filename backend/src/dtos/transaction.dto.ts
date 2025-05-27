import { IsString, IsNumber, IsEnum, IsUUID, IsOptional, Min, IsArray } from 'class-validator';

export enum TransactionStatus {
  PENDING = 'pending',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
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
  productId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}

export class CreateDisputeDto {
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenceUrls?: string[];
}

export class ResolveDisputeDto {
  @IsString()
  resolution: string;

  @IsEnum(TransactionStatus)
  finalStatus: TransactionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

export class ProcessPaymentDto {
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  paymentIntentId?: string;
} 