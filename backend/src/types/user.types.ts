export type UserType = 'individual' | 'repair_shop' | 'organization' | 'admin';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    user_type: UserType;
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  aud: string;
  created_at: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  user_type: UserType;
  bio?: string;
  phone?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  verification_status: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
} 