import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateProductDto, UpdateProductDto, SearchProductsDto, Product } from '../../dtos/product.dto';
import { PaginationParams } from '../../types/pagination.types';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private readonly supabase;
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly supabaseConfig: SupabaseConfig) {
    this.supabase = this.supabaseConfig.getClient();
  }

  async create(userId: string, dto: CreateProductDto) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert({
          user_id: userId,
          ...dto,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating product:', error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error finding products:', error);
      throw new InternalServerErrorException('Failed to find products');
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Product not found');
      return data;
    } catch (error) {
      this.logger.error('Error finding product:', error);
      throw new InternalServerErrorException('Failed to find product');
    }
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    try {
      const { data: product } = await this.supabase
        .from('products')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!product) throw new NotFoundException('Product not found');
      if (product.user_id !== userId) throw new Error('Not authorized to update this product');

      const { data, error } = await this.supabase
        .from('products')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating product:', error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(userId: string, id: string) {
    try {
      const { data: product } = await this.supabase
        .from('products')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!product) throw new NotFoundException('Product not found');
      if (product.user_id !== userId) throw new Error('Not authorized to delete this product');

      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  async findNearby(latitude: number, longitude: number, radius: number) {
    try {
      const { data, error } = await this.supabase
        .rpc('find_nearby_products', {
          lat: latitude,
          lng: longitude,
          radius_km: radius
        });

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error finding nearby products:', error);
      throw new InternalServerErrorException('Failed to find nearby products');
    }
  }

  async search(pagination: PaginationParams & { searchTerm?: string }) {
    try {
      const { page = 1, limit = 10, searchTerm } = pagination;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.textSearch('title', searchTerm);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        items: data,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      this.logger.error('Error searching products:', error);
      throw new InternalServerErrorException('Failed to search products');
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
        const nearbyProducts = await this.supabase
          .rpc('find_nearby_products', {
            lat: searchDto.location.latitude,
            lng: searchDto.location.longitude,
            radius_km: searchDto.radius
          });

        if (nearbyProducts.error) throw nearbyProducts.error;
        
        // Filter the query by the found product IDs
        query = query.in('id', nearbyProducts.data.map((p: Product) => p.id));
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
      this.logger.error('Error searching products:', error);
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
      this.logger.error('Error getting user products:', error);
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
} 