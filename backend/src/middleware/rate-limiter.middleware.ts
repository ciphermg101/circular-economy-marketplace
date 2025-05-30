import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

interface UserInfo {
  id: string;
  role: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  burstLimit?: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly defaultConfig: RateLimitConfig;
  private readonly endpointLimits: Record<string, RateLimitConfig>;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.defaultConfig = {
      windowMs: this.configService.get<number>('rateLimit.windowMs') || 60000,
      maxRequests: this.configService.get<number>('rateLimit.maxRequests') || 100,
      burstLimit: this.configService.get<number>('rateLimit.burstLimit') || 50,
    };

    // Configure endpoint-specific limits
    this.endpointLimits = {
      '/api/auth': {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 30,
        burstLimit: 10,
      },
      '/api/upload': {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 100,
        burstLimit: 20,
      },
      // Add more endpoint-specific limits as needed
    };

    const redisConfig = {
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: this.configService.get<number>('redis.port') || 6379,
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db') || 0,
    };

    this.redis = new Redis(redisConfig);
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  private async decodeToken(token: string): Promise<UserInfo | null> {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return {
        id: decoded.sub,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  private generateRateLimitKey(req: Request, userInfo: UserInfo | null | undefined): string {
    if (userInfo) {
      return `rate_limit:${userInfo.id}:${req.path}`;
    }
    return `rate_limit:${req.ip}:${req.path}`;
  }

  private getLimitConfig(path: string): RateLimitConfig {
    const matchingEndpoint = Object.keys(this.endpointLimits)
      .find(endpoint => path.startsWith(endpoint));
    
    return matchingEndpoint 
      ? this.endpointLimits[matchingEndpoint] 
      : this.defaultConfig;
  }

  private async isWithinLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const multi = this.redis.multi();
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove old requests
    multi.zremrangebyscore(key, '-inf', windowStart);
    
    // Add current request
    multi.zadd(key, now, now.toString());
    
    // Get request count in window
    multi.zcount(key, windowStart, '+inf');
    
    // Get recent requests for burst calculation
    multi.zcount(key, now - 1000, '+inf'); // Last second

    const [, , totalRequests, recentRequests] = await multi.exec() as [any, any, [null | Error, number], [null | Error, number]];

    const total = totalRequests[1];
    const recent = recentRequests[1];

    // Check both total requests and burst limit
    return total <= config.maxRequests && recent <= (config.burstLimit || config.maxRequests);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    const userInfo = token ? await this.decodeToken(token) : null;
    const key = this.generateRateLimitKey(req, userInfo);
    const config = this.getLimitConfig(req.path);

    try {
      const withinLimit = await this.isWithinLimit(key, config);
      
      if (!withinLimit) {
        res.status(429).json({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Please try again later',
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
        return;
      }

      // Set rate limit headers
      const remaining = await this.redis.zcount(key, Date.now() - config.windowMs, '+inf');
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - remaining));
      res.setHeader('X-RateLimit-Reset', Date.now() + config.windowMs);

      next();
    } catch (error) {
      // If Redis fails, allow the request but log the error
      console.error('Rate limiting error:', error);
      next();
    }
  }
}