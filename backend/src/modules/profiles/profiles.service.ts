import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateProfileDto, UpdateProfileDto, VerifyProfileDto } from '../../dtos/profile.dto';
import { logger } from '../../utils/logger';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabaseConfig: SupabaseConfig) {}

  private get supabase() {
    return this.supabaseConfig.getClient();
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    try {
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('username', dto.username)
        .single();

      if (existingProfile) {
        throw new ConflictException('Username already exists');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          id: userId,
          ...dto,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating profile:', error);
      throw error;
    }
  }

  async getProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Profile not found');

      return data;
    } catch (error) {
      logger.error('Error getting profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      if (dto.username) {
        const { data: existingProfile } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('username', dto.username)
          .neq('id', userId)
          .single();

        if (existingProfile) {
          throw new ConflictException('Username already exists');
        }
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(dto)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Profile not found');

      return data;
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  async verifyProfile(userId: string, dto: VerifyProfileDto) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          verification_status: dto.verificationStatus,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Profile not found');

      return data;
    } catch (error) {
      logger.error('Error verifying profile:', error);
      throw error;
    }
  }

  async searchProfiles(query: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error searching profiles:', error);
      throw error;
    }
  }

  async getProfilesByType(type: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting profiles by type:', error);
      throw error;
    }
  }
} 