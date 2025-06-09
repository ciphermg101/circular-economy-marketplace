import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@users/user.entity';
import { Product } from '@products/product.entity';
import { Offer } from '@transactions/offer.entity';
import { IsUUID, IsEnum, IsNumber } from 'class-validator';

export enum TransactionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @IsUUID()
  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @IsUUID()
  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @IsUUID()
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @IsUUID()
  @Column({ type: 'uuid', name: 'offer_id', nullable: true })
  offerId?: string;

  @ManyToOne(() => Offer, { nullable: true })
  @JoinColumn({ name: 'offer_id' })
  offer?: Offer;

  @IsEnum(TransactionStatus)
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @IsNumber()
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
} 