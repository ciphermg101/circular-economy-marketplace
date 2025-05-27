import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get('redisConfig.url')!);

    // Handle Redis errors
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Successfully connected to Redis');
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      logger.info('Redis cache service initialized');
    } catch (error) {
      logger.error('Failed to initialize Redis cache service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
    logger.info('Redis connection closed');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.redis.set(key, serializedValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async acquireLock(lockKey: string, ttl: number): Promise<boolean> {
    const locked = await this.redis.set(lockKey, '1', 'EX', ttl, 'NX');
    return locked === 'OK';
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.redis.del(lockKey);
  }

  async clearCache(): Promise<void> {
    await this.redis.flushdb();
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Error clearing cache pattern ${pattern}:`, error);
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, value);
    } catch (error) {
      logger.error(`Error incrementing cache key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, value);
    } catch (error) {
      logger.error(`Error decrementing cache key ${key}:`, error);
      return 0;
    }
  }

  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const freshValue = await callback();
      await this.set(key, freshValue, ttl);
      return freshValue;
    } catch (error) {
      logger.error(`Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }
} 