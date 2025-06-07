import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '@products/product.entity';
import { Review } from '@products/review.entity';
import { UserType, VerificationStatus, UserRole } from '@users/dto/user.dto';
import { RepairShop } from '@repair-shops/repair-shop.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INDIVIDUAL,
  })
  role: UserRole;

  @Column({ unique: true, nullable: true })
  username: string | null;

  @Column({ name: 'full_name', nullable: true })
  fullName: string | null;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string | null;

  @Column({ nullable: true })
  address: string | null;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.INDIVIDUAL,
    name: 'user_type',
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.UNVERIFIED,
    name: 'verification_status',
  })
  verificationStatus: VerificationStatus;

  @OneToMany(() => RepairShop, repairShop => repairShop.user)
  repairShops: RepairShop[];
}
