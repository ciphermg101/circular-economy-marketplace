import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateRepairShopDto, UpdateRepairShopDto, SearchRepairShopsDto } from '../../dtos/repair-shop.dto';
import { PaginationParams } from '../../types/common.types';
import { logger } from '../../utils/logger';

@Injectable()
export class RepairShopsService {
  constructor(private readonly supabaseConfig: SupabaseConfig) {}

  private get supabase() {
    return this.supabaseConfig.getClient();
  }

  async createRepairShop(userId: string, dto: CreateRepairShopDto) {
    try {
      // Check if user already has a repair shop
      const { data: existingShop } = await this.supabase
        .from('repair_shops')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingShop) {
        throw new ConflictException('User already has a repair shop');
      }

      const { data, error } = await this.supabase
        .from('repair_shops')
        .insert({
          user_id: userId,
          ...dto,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating repair shop:', error);
      throw error;
    }
  }

  async getRepairShop(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('repair_shops')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('id', shopId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Repair shop not found');

      return data;
    } catch (error) {
      logger.error('Error getting repair shop:', error);
      throw error;
    }
  }

  async updateRepairShop(userId: string, shopId: string, dto: UpdateRepairShopDto) {
    try {
      const { data, error } = await this.supabase
        .from('repair_shops')
        .update(dto)
        .eq('id', shopId)
        .eq('user_id', userId) // Ensure user owns the shop
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Repair shop not found or unauthorized');

      return data;
    } catch (error) {
      logger.error('Error updating repair shop:', error);
      throw error;
    }
  }

  async deleteRepairShop(userId: string, shopId: string) {
    try {
      const { error } = await this.supabase
        .from('repair_shops')
        .delete()
        .eq('id', shopId)
        .eq('user_id', userId); // Ensure user owns the shop

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting repair shop:', error);
      throw error;
    }
  }

  async searchRepairShops(searchDto: SearchRepairShopsDto, pagination: PaginationParams = {}) {
    try {
      let query = this.supabase
        .from('repair_shops')
        .select(`
          *,
          user:profiles(username, avatar_url, verification_status)
        `);

      // Apply search filters
      if (searchDto.query) {
        query = query.or(`name.ilike.%${searchDto.query}%,description.ilike.%${searchDto.query}%`);
      }

      if (searchDto.services && searchDto.services.length > 0) {
        query = query.contains('services', searchDto.services);
      }

      if (searchDto.certifications && searchDto.certifications.length > 0) {
        query = query.contains('certifications', searchDto.certifications);
      }

      // Location-based search
      if (searchDto.location && searchDto.radius) {
        query = query.rpc('nearby_repair_shops', {
          lat: searchDto.location.latitude,
          lng: searchDto.location.longitude,
          radius_km: parseFloat(searchDto.radius),
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
      logger.error('Error searching repair shops:', error);
      throw error;
    }
  }

  async getShopsByService(service: string, pagination: PaginationParams = {}) {
    try {
      const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc' } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error } = await this.supabase
        .from('repair_shops')
        .select(`
          *,
          user:profiles(username, avatar_url, verification_status)
        `)
        .contains('services', [service])
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting shops by service:', error);
      throw error;
    }
  }

  async getMyShop(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('repair_shops')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Repair shop not found');

      return data;
    } catch (error) {
      logger.error('Error getting user repair shop:', error);
      throw error;
    }
  }

  async findNearbyShops(latitude: number, longitude: number, radius: number) {
    const { data, error } = await this.supabase.rpc('find_nearby_repair_shops', {
      lat: latitude,
      lng: longitude,
      radius_km: radius,
    });

    if (error) {
      throw new Error(`Error finding nearby repair shops: ${error.message}`);
    }

    return data;
  }
} 