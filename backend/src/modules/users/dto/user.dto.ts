export enum UserType {
  INDIVIDUAL = 'individual',
  REPAIR_SHOP = 'repair_shop',
  ORGANIZATION = 'organization',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
}

export class CreateProfileDto {
  username: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  userType?: UserType;
  verificationStatus?: VerificationStatus;
  isAdmin?: boolean;
}

export class UpdateProfileDto {
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  userType?: UserType;
  verificationStatus?: VerificationStatus;
  isAdmin?: boolean;
}

export class VerifyProfileDto {
  isVerified: boolean;
}

// UserRole is used for access control (RBAC)
export enum UserRole {
  INDIVIDUAL = 'individual',
  REPAIR_SHOP = 'repair_shop',
  ORGANIZATION = 'organization',
  ADMIN = 'admin',
  BUYER = 'buyer',
  SELLER = 'seller',
} 