import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Transaction } from '@transactions/transaction.entity';
import { User } from '@users/user.entity';
import { Product } from '@products/product.entity';
import { IsUUID, IsEnum, IsNumber } from 'class-validator';

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('offers')
export class Offer extends BaseEntity {
  @IsUUID()
  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction;

  @IsUUID()
  @Column({ name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @IsUUID()
  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @IsUUID()
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsNumber()
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @IsEnum(OfferStatus)
  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.PENDING })
  status: OfferStatus;
} 