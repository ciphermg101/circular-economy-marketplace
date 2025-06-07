import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { RepairShop } from '@repair-shops/repair-shop.entity';
import { Booking } from '@repair-shops/booking.entity';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

@Entity('services')
export class Service extends BaseEntity {
  @IsUUID()
  @Column({ name: 'repair_shop_id' })
  repairShopId: string;

  @ManyToOne(() => RepairShop, shop => shop.services)
  @JoinColumn({ name: 'repair_shop_id' })
  repairShop: RepairShop;

  @IsString()
  @Column()
  name: string;

  @IsOptional()
  @IsString()
  @Column('text', { nullable: true })
  description?: string;

  @IsNumber()
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @IsString()
  @Column()
  category: string;

  @OneToMany(() => Booking, booking => booking.service)
  bookings: Booking[];
} 