export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  BUYER = 'buyer',
  REPAIR_SHOP = 'repair_shop',
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}