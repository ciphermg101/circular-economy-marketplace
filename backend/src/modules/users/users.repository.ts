import { Injectable } from '@nestjs/common';
import { SupabaseService } from '@common/supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@users/user.entity';

@Injectable()
export class UsersRepository {
  private readonly supabaseClient: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabaseClient = this.supabaseService.createCLient();
  }

  async findByUsername(username: string): Promise<{ data: User | null }> {
    return this.supabaseClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
  }

  async createUser(userId: string, dto: any): Promise<{ data: User | null }> {
    return this.supabaseClient
      .from('users')
      .insert({ id: userId, ...dto })
      .select()
      .single();
  }

  async getUser(userId: string): Promise<{ data: User | null }> {
    return this.supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  }

  async updateUser(userId: string, dto: any) {
    return this.supabaseClient
      .from('users')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();
  }

  async verifyUser(userId: string, dto: any): Promise<{ data: User | null }> {
    return this.supabaseClient
      .from('users')
      .update({ isVerified: dto.isVerified })
      .eq('id', userId)
      .select()
      .single();
  }

  async searchUsers(query: string): Promise<{ data: User[] | null }> {
    return this.supabaseClient
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`);
  }

  async getUsersByType(type: string): Promise<{ data: User[] | null }> {
    return this.supabaseClient
      .from('users')
      .select('*')
      .eq('user_type', type);
  }
}
