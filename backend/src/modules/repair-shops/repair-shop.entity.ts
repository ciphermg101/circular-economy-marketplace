import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@users/user.entity';
import { Service } from '@repair-shops/service.entity';
import { Booking } from '@repair-shops/booking.entity';
import { Review } from '@repair-shops/review.entity';
import { IsString, IsOptional, IsBoolean, IsUUID, IsEmail, IsObject } from 'class-validator';

@Entity('repair_shops')
export class RepairShop extends BaseEntity {
  @IsUUID()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.repairShops)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @IsString()
  @Column()
  name: string;

  @IsString()
  @Column('text')
  description: string;

  @IsObject()
  @Column('jsonb', { nullable: true })
  location?: Record<string, any>;

  @IsString()
  @Column()
  phone: string;

  @IsEmail()
  @Column()
  email: string;

  @IsBoolean()
  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Service, service => service.repairShop)
  services: Service[];

  @OneToMany(() => Booking, booking => booking.repairShop)
  bookings: Booking[];

  @OneToMany(() => Review, review => review.repairShop)
  reviews: Review[];
} 