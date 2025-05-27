import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL')!);
    this.maxRequests = this.configService.get('RATE_LIMIT_MAX', 100);
    this.windowMs = this.configService.get('RATE_LIMIT_TTL', 60000); // 1 minute default
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const key = this.generateKey(req);

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
      }

      if (current > this.maxRequests) {
        logger.warn(`Rate limit exceeded for IP ${req.ip}`);
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - current));

      next();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error('Rate limiter error:', err);
      next(err);
    }
  }

  private generateKey(req: Request): string {
    // Use user ID if authenticated, otherwise use IP
    const identifier = req.user?.id || req.ip;
    return `rate_limit:${identifier}:${Math.floor(Date.now() / this.windowMs)}`;
  }
} 