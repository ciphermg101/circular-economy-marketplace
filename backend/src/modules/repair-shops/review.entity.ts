import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { RepairShop } from '@repair-shops/repair-shop.entity';
import { User } from '@users/user.entity';
import { IsUUID, IsInt, Min, Max, IsString, Length, IsBoolean, IsOptional, IsObject } from 'class-validator';

@Entity('repair_shop_reviews')
export class Review extends BaseEntity {
  @IsUUID()
  @Column({ name: 'repair_shop_id' })
  repairShopId: string;

  @ManyToOne(() => RepairShop, shop => shop.reviews)
  @JoinColumn({ name: 'repair_shop_id' })
  repairShop: RepairShop;

  @IsUUID()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsInt()
  @Min(1)
  @Max(5)
  @Column('integer')
  rating: number;

  @IsString()
  @Length(10, 1000)
  @Column('text')
  comment: string;

  @IsBoolean()
  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @IsOptional()
  @IsObject()
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
} 