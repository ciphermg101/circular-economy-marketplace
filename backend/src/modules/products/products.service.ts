import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from '../../dtos/product.dto';
import { PaginationParams } from '../../types/common.types';
import { logger } from '../../utils/logger';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseConfig: SupabaseConfig) {}

  private get supabase() {
    return this.supabaseConfig.getClient();
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert({
          user_id: userId,
          ...dto,
          status: 'available',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  async getProduct(productId: string) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Product not found');

      return data;
    } catch (error) {
      logger.error('Error getting product:', error);
      throw error;
    }
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .update(dto)
        .eq('id', productId)
        .eq('user_id', userId) // Ensure user owns the product
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Product not found or unauthorized');

      return data;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(userId: string, productId: string) {
    try {
      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId); // Ensure user owns the product

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async searchProducts(searchDto: SearchProductsDto, pagination: PaginationParams = {}) {
    try {
      let query = this.supabase
        .from('products')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `);

      // Apply search filters
      if (searchDto.query) {
        query = query.or(`title.ilike.%${searchDto.query}%,description.ilike.%${searchDto.query}%`);
      }

      if (searchDto.category) {
        query = query.eq('category', searchDto.category);
      }

      if (searchDto.condition) {
        query = query.eq('condition', searchDto.condition);
      }

      if (searchDto.minPrice !== undefined) {
        query = query.gte('price', searchDto.minPrice);
      }

      if (searchDto.maxPrice !== undefined) {
        query = query.lte('price', searchDto.maxPrice);
      }

      // Location-based search
      if (searchDto.location && searchDto.radius) {
        query = query.rpc('nearby_products', {
          lat: searchDto.location.latitude,
          lng: searchDto.location.longitude,
          radius_km: searchDto.radius,
        });
      }

      // Apply pagination
      const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc' } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      query = query
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  async getUserProducts(userId: string, pagination: PaginationParams = {}) {
    try {
      const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc' } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting user products:', error);
      throw error;
    }
  }

  async getAllProducts(pagination: PaginationParams = {}) {
    const { page = 1, limit = 10, search } = pagination;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }

    return {
      data,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async getSellerProducts(sellerId: string, pagination: PaginationParams = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching seller products: ${error.message}`);
    }

    return {
      data,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async findNearbyProducts(latitude: number, longitude: number, radius: number) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .filter('location', 'not.is.null')
      .filter('location', 'st_dwithin', `POINT(${longitude} ${latitude})`, radius * 1000);

    if (error) {
      throw new Error(`Error finding nearby products: ${error.message}`);
    }

    return data;
  }
} 