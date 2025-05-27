export type UserType = 'individual' | 'repair_shop' | 'organization';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type TransactionStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Point {
  latitude: number;
  longitude: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface LocationParams {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
  location?: LocationParams;
} 