import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { RepairShop } from '@repair-shops/repair-shop.entity';
import { Service } from '@repair-shops/service.entity';
import { User } from '@users/user.entity';
import { IsUUID, IsDate, IsEnum } from 'class-validator';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking extends BaseEntity {
  @IsUUID()
  @Column({ name: 'repair_shop_id' })
  repairShopId: string;

  @ManyToOne(() => RepairShop, shop => shop.bookings)
  @JoinColumn({ name: 'repair_shop_id' })
  repairShop: RepairShop;

  @IsUUID()
  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, service => service.bookings)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @IsUUID()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsDate()
  @Column({ type: 'timestamptz' })
  date: Date;

  @IsEnum(BookingStatus)
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;
} 