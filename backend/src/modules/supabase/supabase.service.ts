import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.getOrThrow('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow('SUPABASE_KEY');

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  get getClient(): SupabaseClient {
    return this.client;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt < this.maxRetries &&
        (error.message.includes('connection') || error.code === '40001')
      ) {
        this.logger.warn(`Retrying database operation (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.executeWithRetry(operation, attempt + 1);
      }
      throw error;
    }
  }
} 