import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Product } from '@products/product.entity';
import { User } from '@users/user.entity';
import { IsInt, Min, Max, IsString, Length, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('product_reviews')
@Check(`"rating" >= 1 AND "rating" <= 5`)
@Index(['userId', 'productId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the review' })
  id: string;

  @Column('integer')
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  @ApiProperty({ description: 'Product rating from 1 to 5', minimum: 1, maximum: 5 })
  rating: number;

  @Column('text')
  @IsString()
  @Length(10, 1000, { message: 'Comment must be between 10 and 1000 characters' })
  @ApiProperty({ description: 'Review comment', minLength: 10, maxLength: 1000 })
  comment: string;

  @ManyToOne(() => Product, product => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  @ApiProperty({ description: 'Product being reviewed' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  @ApiProperty({ description: 'ID of the product being reviewed' })
  productId: string;

  @ManyToOne(() => User, user => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ description: 'User who wrote the review' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  @ApiProperty({ description: 'ID of the user who wrote the review' })
  userId: string;

  @Column({ default: false })
  @IsBoolean()
  @ApiProperty({ description: 'Whether the reviewer has purchased the product' })
  isVerifiedPurchase: boolean;

  @Column('jsonb', { nullable: true })
  @IsOptional()
  @IsObject()
  @ApiProperty({ description: 'Additional metadata for the review', required: false })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ description: 'When the review was created' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ description: 'When the review was last updated' })
  updatedAt: Date;
}