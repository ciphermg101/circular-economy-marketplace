import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateTutorialDto, UpdateTutorialDto, SearchTutorialsDto } from '../../dtos/tutorial.dto';
import { PaginationParams } from '../../types/common.types';
import { StorageService } from '../../services/storage.service';
import { CacheService } from '../../services/cache.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TutorialsService {
  private supabase;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'tutorial:';

  constructor(
    private readonly supabaseConfig: SupabaseConfig,
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {
    this.supabase = this.supabaseConfig.getClient();
  }

  async create(userId: string, dto: CreateTutorialDto) {
    try {
      // Handle media upload if present
      let mediaUrl: string | undefined;
      if (dto.media) {
        if (!(dto.media instanceof Object) || !('buffer' in dto.media)) {
          throw new BadRequestException('Invalid file upload. Expected a file object.');
        }
        const uploadResult = await this.storageService.uploadFile(dto.media as Express.Multer.File, 'tutorials');
        mediaUrl = uploadResult.url;
      }

      const { data, error } = await this.supabase
        .from('tutorials')
        .insert({
          user_id: userId,
          title: dto.title,
          content: dto.content,
          category: dto.category,
          difficulty: dto.difficulty,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error creating tutorial:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create tutorial');
    }
  }

  async update(id: string, userId: string, dto: UpdateTutorialDto) {
    try {
      // Handle media upload if present
      let mediaUrl: string | undefined;
      if (dto.media) {
        if (!(dto.media instanceof Object) || !('buffer' in dto.media)) {
          throw new BadRequestException('Invalid file upload. Expected a file object.');
        }
        const uploadResult = await this.storageService.uploadFile(dto.media as Express.Multer.File, 'tutorials');
        mediaUrl = uploadResult.url;
      }

      const { data: existingTutorial } = await this.supabase
        .from('tutorials')
        .select('media_url')
        .eq('id', id)
        .single();

      if (existingTutorial?.media_url && mediaUrl) {
        // Delete old media if new one is uploaded
        await this.storageService.deleteFile('tutorials', existingTutorial.media_url);
      }

      const { data, error } = await this.supabase
        .from('tutorials')
        .update({
          ...(dto.title && { title: dto.title }),
          ...(dto.content && { content: dto.content }),
          ...(dto.category && { category: dto.category }),
          ...(dto.difficulty && { difficulty: dto.difficulty }),
          ...(mediaUrl && { media_url: mediaUrl }),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Tutorial not found');

      // Invalidate cache
      await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);

      return data;
    } catch (error) {
      this.logger.error('Error updating tutorial:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update tutorial');
    }
  }

  async delete(id: string, userId: string) {
    try {
      const { data: tutorial } = await this.supabase
        .from('tutorials')
        .select('media_url')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!tutorial) throw new NotFoundException('Tutorial not found');

      // Delete associated media if exists
      if (tutorial.media_url) {
        await this.storageService.deleteFile('tutorials', tutorial.media_url);
      }

      const { error } = await this.supabase
        .from('tutorials')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Invalidate cache
      await this.cacheService.del(`${this.CACHE_PREFIX}${id}`);
    } catch (error) {
      this.logger.error('Error deleting tutorial:', error);
      throw new InternalServerErrorException('Failed to delete tutorial');
    }
  }

  async findOne(id: string) {
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(`${this.CACHE_PREFIX}${id}`);
      if (cached) return cached;

      const { data, error } = await this.supabase
        .from('tutorials')
        .select('*, profiles(username, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Tutorial not found');

      // Cache the result
      await this.cacheService.set(`${this.CACHE_PREFIX}${id}`, data, this.CACHE_TTL);

      return data;
    } catch (error) {
      this.logger.error('Error finding tutorial:', error);
      throw new InternalServerErrorException('Failed to find tutorial');
    }
  }

  async search(query: SearchTutorialsDto, pagination: PaginationParams) {
    try {
      let supabaseQuery = this.supabase
        .from('tutorials')
        .select('*, profiles(username, avatar_url)', { count: 'exact' });

      if (query.category) {
        supabaseQuery = supabaseQuery.eq('category', query.category);
      }

      if (query.difficulty) {
        supabaseQuery = supabaseQuery.eq('difficulty', query.difficulty);
      }

      if (query.searchTerm) {
        supabaseQuery = supabaseQuery.textSearch('title', query.searchTerm);
      }

      const { from, to } = this.getPaginationRange(pagination);
      const { data, error, count } = await supabaseQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data,
        total: count || 0,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      this.logger.error('Error searching tutorials:', error);
      throw new InternalServerErrorException('Failed to search tutorials');
    }
  }

  async getUserTutorials(userId: string, pagination: PaginationParams) {
    try {
      const { from, to } = this.getPaginationRange(pagination);
      const { data, error, count } = await this.supabase
        .from('tutorials')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data,
        total: count || 0,
        page: pagination.page,
        limit: pagination.limit,
      };
    } catch (error) {
      this.logger.error('Error getting user tutorials:', error);
      throw new InternalServerErrorException('Failed to get user tutorials');
    }
  }

  async like(userId: string, tutorialId: string) {
    try {
      // Check if user has already liked the tutorial
      const { data: existingLike } = await this.supabase
        .from('tutorial_likes')
        .select()
        .eq('user_id', userId)
        .eq('tutorial_id', tutorialId)
        .single();

      if (existingLike) {
        // Unlike if already liked
        const { error } = await this.supabase
          .from('tutorial_likes')
          .delete()
          .eq('user_id', userId)
          .eq('tutorial_id', tutorialId);

        if (error) throw error;
        return { liked: false };
      } else {
        // Like if not already liked
        const { error } = await this.supabase
          .from('tutorial_likes')
          .insert({ user_id: userId, tutorial_id: tutorialId });

        if (error) throw error;
        return { liked: true };
      }
    } catch (error) {
      this.logger.error('Error liking/unliking tutorial:', error);
      throw new InternalServerErrorException('Failed to like/unlike tutorial');
    }
  }

  async getPopular(limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('tutorials')
        .select('*, profiles(username, avatar_url), tutorial_likes(count)')
        .order('likes_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error getting popular tutorials:', error);
      throw new InternalServerErrorException('Failed to get popular tutorials');
    }
  }

  private getPaginationRange(pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
  }
} 