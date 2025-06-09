import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '@users/user.entity';
import { Review } from '@products/review.entity';
import { BaseEntity } from '@common/entities/base.entity';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsObject, IsUUID } from 'class-validator';
import { ProductCategory } from '@products/product-category.entity';

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RESERVED = 'reserved',
  INACTIVE = 'inactive',
}

@Entity('products')
export class Product extends BaseEntity {
  @IsString()
  @Column({ type: 'varchar' })
  title: string;

  @IsString()
  @Column('text')
  description: string;

  @IsNumber()
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @IsEnum(ProductCondition)
  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.GOOD,
  })
  condition: ProductCondition;

  @ManyToOne(() => ProductCategory, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @IsUUID()
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @IsOptional()
  @IsObject()
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @Column('text', { array: true, default: [] })
  images: string[];

  @IsOptional()
  @IsObject()
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location?: { type: string; coordinates: [number, number] };

  @IsEnum(ProductStatus)
  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @ManyToOne(() => User, user => user.products)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsUUID()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @IsNumber()
  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @IsNumber()
  @Column({ type: 'integer', default: 0 })
  reviewCount: number;
}