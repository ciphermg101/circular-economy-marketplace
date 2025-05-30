import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateRepairShopDto, UpdateRepairShopDto, SearchRepairShopsDto, RepairShop } from '../../dtos/repair-shop.dto';
import { PaginationParams, Point, GeoPoint } from '../../types/common.types';
import { Logger } from '@nestjs/common';

@Injectable()
export class RepairShopsService {
  private supabase;
  private readonly logger = new Logger(RepairShopsService.name);

  constructor(private readonly supabaseConfig: SupabaseConfig) {
    this.supabase = this.supabaseConfig.getClient();
  }

  private convertPointToGeoPoint(point: Point): GeoPoint {
    return {
      type: 'Point',
      coordinates: [point.longitude, point.latitude],
    };
  }

  private convertGeoPointToPoint(geoPoint: GeoPoint): Point {
    return {
      latitude: geoPoint.coordinates[1],
      longitude: geoPoint.coordinates[0],
    };
  }

  async create(userId: string, dto: CreateRepairShopDto) {
    try {
      const { data: existingShop } = await this.supabase
        .from('repair_shops')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingShop) {
        throw new BadRequestException('User already has a repair shop');
      }

      const { data, error } = await this.supabase
        .from('repair_shops')
        .insert({
          user_id: userId,
          ...dto,
          location: dto.location,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating repair shop:', error);
      throw new InternalServerErrorException('Failed to create repair shop');
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.supabase
        .from('repair_shops')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error finding repair shops:', error);
      throw new InternalServerErrorException('Failed to find repair shops');
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('repair_shops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Repair shop not found');
      return data;
    } catch (error) {
      this.logger.error('Error finding repair shop:', error);
      throw new InternalServerErrorException('Failed to find repair shop');
    }
  }

  async findByUserId(userId: string) {
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
      this.logger.error('Error finding repair shop:', error);
      throw new InternalServerErrorException('Failed to find repair shop');
    }
  }

  async update(userId: string, id: string, dto: UpdateRepairShopDto) {
    try {
      const { data: shop } = await this.supabase
        .from('repair_shops')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!shop) throw new NotFoundException('Repair shop not found');
      if (shop.user_id !== userId) throw new BadRequestException('Not authorized to update this shop');

      const { data, error } = await this.supabase
        .from('repair_shops')
        .update({
          ...dto,
          location: dto.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating repair shop:', error);
      throw new InternalServerErrorException('Failed to update repair shop');
    }
  }

  async remove(userId: string, id: string) {
    try {
      const { data: shop } = await this.supabase
        .from('repair_shops')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!shop) throw new NotFoundException('Repair shop not found');
      if (shop.user_id !== userId) throw new BadRequestException('Not authorized to delete this shop');

      const { error } = await this.supabase
        .from('repair_shops')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { message: 'Repair shop deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting repair shop:', error);
      throw new InternalServerErrorException('Failed to delete repair shop');
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
        const geoPoint = this.convertPointToGeoPoint(searchDto.location);
        const nearbyShops = await this.supabase
          .rpc('find_nearby_repair_shops', {
            lat: searchDto.location.latitude,
            lng: searchDto.location.longitude,
            radius_km: parseFloat(searchDto.radius)
          });

        if (nearbyShops.error) throw nearbyShops.error;
        
        // Filter the query by the found shop IDs
        query = query.in('id', nearbyShops.data.map((s: RepairShop) => s.id));
      }

      // Apply pagination
      const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc' } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      query = query
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        items: data,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      this.logger.error('Error searching repair shops:', error);
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
      this.logger.error('Error getting shops by service:', error);
      throw error;
    }
  }

  async findNearby(latitude: number, longitude: number, radius: number) {
    try {
      const { data, error } = await this.supabase
        .rpc('find_nearby_repair_shops', {
          lat: latitude,
          lng: longitude,
          radius_km: radius
        });

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error finding nearby repair shops:', error);
      throw new InternalServerErrorException('Failed to find nearby repair shops');
    }
  }
} 