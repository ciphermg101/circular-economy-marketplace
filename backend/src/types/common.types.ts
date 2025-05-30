export type UserType = 'individual' | 'repair_shop' | 'organization';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export enum TransactionStatus {
  PENDING = 'pending',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Point {
  latitude: number;
  longitude: number;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface TimeRange {
  open: string; // HH:mm format
  close: string; // HH:mm format
}

export interface BusinessHours {
  monday?: TimeRange;
  tuesday?: TimeRange;
  wednesday?: TimeRange;
  thursday?: TimeRange;
  friday?: TimeRange;
  saturday?: TimeRange;
  sunday?: TimeRange;
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

export interface MpesaResponse {
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CustomerMessage: string;
}

export interface MpesaCallbackResult {
  success: boolean;
  checkoutRequestId: string;
  transactionId?: string;
  amount?: number;
  phoneNumber?: string;
  date?: string;
  resultCode?: string;
  resultDesc?: string;
} 