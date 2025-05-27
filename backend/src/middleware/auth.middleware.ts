import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseConfig } from '../config/supabase.config';
import { logger } from '../utils/logger';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly supabaseConfig: SupabaseConfig) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('No authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const supabase = this.supabaseConfig.getClient();

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        logger.error('Authentication error:', { error });
        throw new UnauthorizedException('Invalid token');
      }

      // Attach the user to the request for later use
      req['user'] = user;
      next();
    } catch (error) {
      logger.error('Authentication middleware error:', error);
      next(error);
    }
  }
} 