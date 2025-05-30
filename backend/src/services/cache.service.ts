import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import CircuitBreaker from 'opossum';
import { MetricsService } from './metrics.service';

// Runtime enum-like object for ErrorCategory values
const ErrorCategoryEnum = {
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private readonly defaultTTL = 3600; // 1 hour in seconds
  private readonly cacheName = 'redis';
  private readonly lockTTL = 5; // 5 seconds
  private circuitBreaker: CircuitBreaker;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      throw new Error('Redis URL not configured');
    }

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => err.message.includes('READONLY'),
      enableOfflineQueue: false,
    });

    this.circuitBreaker = new CircuitBreaker(
      async (command: () => Promise<any>) => command(),
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );

    this.setupCircuitBreakerEvents();
    this.setupRedisEventHandlers();
  }

  private setupCircuitBreakerEvents(): void {
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker opened');
      this.metricsService.recordError({
        type: ErrorCategoryEnum.CIRCUIT_BREAKER,
        severity: 'high',
        context: 'redis',
        path: 'circuit-breaker-open',
      });
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.log('Circuit breaker half-open');
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker closed');
    });
  }

  private async executeWithCircuitBreaker<T>(command: () => Promise<T>): Promise<T> {
    try {
      const result = await this.circuitBreaker.fire(command);
      return result as T;
    } catch (error) {
      this.logger.error('Circuit breaker rejected command', error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.CIRCUIT_BREAKER,
        severity: 'high',
        context: 'redis',
        path: 'circuit-breaker-command-reject',
      });
      throw error;
    }
  }  

  async onModuleInit(): Promise<void> {
    try {
      await this.executeWithCircuitBreaker(() => this.redis.ping());
      this.logger.log('Redis cache service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis cache service:', error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'critical',
        context: 'cache',
        path: 'onModuleInit',
      });
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'medium',
        context: 'cache',
        path: 'onModuleDestroy',
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = process.hrtime();
    try {
      const value = await this.executeWithCircuitBreaker(() => this.redis.get(key));
      this.logDuration('get', startTime);

      if (value) {
        this.metricsService.recordCacheOperation('hit', this.cacheName);
        return JSON.parse(value) as T;
      }

      this.metricsService.recordCacheOperation('miss', this.cacheName);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'medium',
        context: 'cache',
        path: `get:${key}`,
      });
      return null as T | null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    const startTime = process.hrtime();
    try {
      await this.executeWithCircuitBreaker(() =>
        this.redis.set(key, JSON.stringify(value), 'EX', ttl),
      );
      this.logDuration('set', startTime);
      this.metricsService.recordCacheOperation(
        'set',
        this.cacheName,
        this.getDurationInSeconds(startTime),
      );
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'medium',
        context: 'cache',
        path: `set:${key}`,
      });
    }
  }

  async del(key: string): Promise<number> {
    const startTime = process.hrtime();
    try {
      const result = await this.executeWithCircuitBreaker(() => this.redis.del(key));
      this.logDuration('del', startTime);
      this.metricsService.recordCacheOperation(
        'del',
        this.cacheName,
        this.getDurationInSeconds(startTime),
      );
      return result; // Number of keys removed
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'medium',
        context: 'cache',
        path: `del:${key}`,
      });
      return 0;
    }
  }  

  private logDuration(operation: string, startTime: [number, number]): void {
    const duration = this.getDurationInSeconds(startTime);
    this.logger.debug(`Cache operation ${operation} took ${duration.toFixed(3)} seconds`);
  }

  private getDurationInSeconds(startTime: [number, number]): number {
    const diff = process.hrtime(startTime);
    return diff[0] + diff[1] / 1e9;
  }

  private setupRedisEventHandlers(): void {
    this.redis.on('error', (error) => {
      this.logger.error('Redis error:', error);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'high',
        context: 'redis',
        path: 'redis-error',
      });
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('close', () => {
      this.logger.log('Redis connection closed');
    });

    this.redis.on('reconnecting', (delay: number) => {
      this.logger.warn(`Redis reconnecting in ${delay}ms`);
      this.metricsService.recordError({
        type: ErrorCategoryEnum.DATABASE_ERROR,
        severity: 'medium',
        context: 'redis',
        path: 'redis-reconnecting',
      });
    });
  }
}
