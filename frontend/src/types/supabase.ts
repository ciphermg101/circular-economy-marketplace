export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          user_type: 'individual' | 'repair_shop' | 'organization';
          bio: string | null;
          phone: string | null;
          address: string | null;
          location: unknown | null; // PostGIS geography type
          verification_status: boolean;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type?: 'individual' | 'repair_shop' | 'organization';
          bio?: string | null;
          phone?: string | null;
          address?: string | null;
          location?: unknown | null;
          verification_status?: boolean;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type?: 'individual' | 'repair_shop' | 'organization';
          bio?: string | null;
          phone?: string | null;
          address?: string | null;
          location?: unknown | null;
          verification_status?: boolean;
          rating?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          price: number | null;
          images: string[];
          location: unknown | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          price?: number | null;
          images?: string[];
          location?: unknown | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          price?: number | null;
          images?: string[];
          location?: unknown | null;
          status?: string;
          updated_at?: string;
        };
      };
      repair_shops: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          services: string[];
          location: unknown;
          business_hours: Json;
          certifications: string[];
          contact_info: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          services?: string[];
          location: unknown;
          business_hours?: Json;
          certifications?: string[];
          contact_info?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          services?: string[];
          location?: unknown;
          business_hours?: Json;
          certifications?: string[];
          contact_info?: Json;
          updated_at?: string;
        };
      };
      tutorials: {
        Row: {
          id: string;
          author_id: string | null;
          title: string;
          content: string;
          category: string;
          difficulty: string;
          images: string[];
          video_url: string | null;
          views: number;
          likes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          title: string;
          content: string;
          category: string;
          difficulty: string;
          images?: string[];
          video_url?: string | null;
          views?: number;
          likes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          title?: string;
          content?: string;
          category?: string;
          difficulty?: string;
          images?: string[];
          video_url?: string | null;
          views?: number;
          likes?: number;
          updated_at?: string;
        };
      };
    };
  };
}; 