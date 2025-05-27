import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { CreateTutorialDto, UpdateTutorialDto, SearchTutorialsDto } from '../../dtos/tutorial.dto';
import { PaginationParams } from '../../types/common.types';
import { logger } from '../../utils/logger';

@Injectable()
export class TutorialsService {
  constructor(private readonly supabaseConfig: SupabaseConfig) {}

  private get supabase() {
    return this.supabaseConfig.getClient();
  }

  async createTutorial(userId: string, dto: CreateTutorialDto) {
    try {
      const { data, error } = await this.supabase
        .from('tutorials')
        .insert({
          author_id: userId,
          ...dto,
          views: 0,
          likes: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating tutorial:', error);
      throw error;
    }
  }

  async getTutorial(tutorialId: string) {
    try {
      // Increment views atomically using a custom function
      await this.supabase.rpc('increment_tutorial_views', { tutorial_id: tutorialId });

      const { data, error } = await this.supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles(id, username, avatar_url)
        `)
        .eq('id', tutorialId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Tutorial not found');

      return data;
    } catch (error) {
      logger.error('Error getting tutorial:', error);
      throw error;
    }
  }

  async updateTutorial(userId: string, tutorialId: string, dto: UpdateTutorialDto) {
    try {
      const { data, error } = await this.supabase
        .from('tutorials')
        .update(dto)
        .eq('id', tutorialId)
        .eq('author_id', userId) // Ensure user owns the tutorial
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Tutorial not found or unauthorized');

      return data;
    } catch (error) {
      logger.error('Error updating tutorial:', error);
      throw error;
    }
  }

  async deleteTutorial(userId: string, tutorialId: string) {
    try {
      const { error } = await this.supabase
        .from('tutorials')
        .delete()
        .eq('id', tutorialId)
        .eq('author_id', userId); // Ensure user owns the tutorial

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting tutorial:', error);
      throw error;
    }
  }

  async searchTutorials(searchDto: SearchTutorialsDto, pagination: PaginationParams = {}) {
    try {
      let query = this.supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles(id, username, avatar_url)
        `);

      // Apply search filters
      if (searchDto.query) {
        query = query.or(`title.ilike.%${searchDto.query}%,content.ilike.%${searchDto.query}%`);
      }

      if (searchDto.category) {
        query = query.eq('category', searchDto.category);
      }

      if (searchDto.difficulty) {
        query = query.eq('difficulty', searchDto.difficulty);
      }

      if (searchDto.tags && searchDto.tags.length > 0) {
        query = query.contains('tags', searchDto.tags);
      }

      if (searchDto.authorId) {
        query = query.eq('author_id', searchDto.authorId);
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
      logger.error('Error searching tutorials:', error);
      throw error;
    }
  }

  async likeTutorial(userId: string, tutorialId: string) {
    try {
      // Check if user has already liked the tutorial
      const { data: existingLike } = await this.supabase
        .from('tutorial_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('tutorial_id', tutorialId)
        .single();

      if (existingLike) {
        // Unlike
        await this.supabase
          .from('tutorial_likes')
          .delete()
          .eq('user_id', userId)
          .eq('tutorial_id', tutorialId);

        await this.supabase.rpc('decrement_tutorial_likes', { tutorial_id: tutorialId });
      } else {
        // Like
        await this.supabase
          .from('tutorial_likes')
          .insert({ user_id: userId, tutorial_id: tutorialId });

        await this.supabase.rpc('increment_tutorial_likes', { tutorial_id: tutorialId });
      }

      const { data, error } = await this.supabase
        .from('tutorials')
        .select('likes')
        .eq('id', tutorialId)
        .single();

      if (error) throw error;
      return { likes: data.likes, liked: !existingLike };
    } catch (error) {
      logger.error('Error toggling tutorial like:', error);
      throw error;
    }
  }

  async getPopularTutorials(limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles(id, username, avatar_url)
        `)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting popular tutorials:', error);
      throw error;
    }
  }

  async getTutorialsByCategory(category: string, pagination: PaginationParams = {}) {
    try {
      const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc' } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error } = await this.supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles(id, username, avatar_url)
        `)
        .eq('category', category)
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting tutorials by category:', error);
      throw error;
    }
  }
} 