export interface ProfileInterface {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  userType: 'individual' | 'repair_shop' | 'organization';
  verificationStatus: 'unverified' | 'pending' | 'verified';
  isAdmin: boolean;
}

