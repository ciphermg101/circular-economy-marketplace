import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as cors from 'cors';
import helmet from 'helmet';
import * as hpp from 'hpp';
import { rateLimit } from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly corsMiddleware: ReturnType<typeof cors>;
  private readonly rateLimiter: ReturnType<typeof rateLimit>;

  constructor(private configService: ConfigService) {
    // Configure CORS
    this.corsMiddleware = cors({
      origin: this.configService.get('corsConfig.origins'),
      methods: this.configService.get('corsConfig.methods'),
      credentials: this.configService.get('corsConfig.credentials'),
      maxAge: 86400, // 24 hours
    });

    // Configure rate limiting
    this.rateLimiter = rateLimit({
      windowMs: (this.configService.get<number>('rateLimitConfig.ttl') ?? 60) * 1000,
      max: this.configService.get<number>('rateLimitConfig.max') ?? 100,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply security headers
    helmet()(req, res, () => {
      // Apply CORS
      this.corsMiddleware(req, res, () => {
        // Prevent HTTP Parameter Pollution
        hpp()(req, res, () => {
          // Apply rate limiting
          this.rateLimiter(req, res, () => {
            // Set secure cookie settings
            res.cookie('sessionId', req.sessionID, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });

            // Add correlation ID for request tracking
            if (!req.headers['x-correlation-id']) {
              req.headers['x-correlation-id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Add security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader(
              'Content-Security-Policy',
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
            );

            // Remove sensitive headers
            res.removeHeader('X-Powered-By');
            res.removeHeader('Server');

            next();
          });
        });
      });
    });
  }
} 