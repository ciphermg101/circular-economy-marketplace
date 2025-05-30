import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('redis.url');
    
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.redis.set(key, value);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  async setWithExpiry(key: string, value: string, seconds: number): Promise<void> {
    try {
      await this.redis.setex(key, seconds, value);
    } catch (error) {
      this.logger.error(`Error setting key ${key} with expiry:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error deleting keys matching pattern ${pattern}:`, error);
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.redis.zadd(key, score, member);
    } catch (error) {
      this.logger.error(`Error adding to sorted set ${key}:`, error);
      return 0;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.zrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Error getting range from sorted set ${key}:`, error);
      return [];
    }
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    try {
      return await this.redis.zremrangebyscore(key, min, max);
    } catch (error) {
      this.logger.error(`Error removing range by score from sorted set ${key}:`, error);
      return 0;
    }
  }

  async zcard(key: string): Promise<number> {
    try {
      return await this.redis.zcard(key);
    } catch (error) {
      this.logger.error(`Error getting cardinality of sorted set ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }
} 