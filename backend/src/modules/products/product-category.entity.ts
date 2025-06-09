import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { IsString, IsOptional } from 'class-validator';

@Entity('product_categories')
export class ProductCategory extends BaseEntity {
  @IsString()
  @Column({ type: 'varchar', unique: true })
  name: string;

  @IsOptional()
  @IsString()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];
} 