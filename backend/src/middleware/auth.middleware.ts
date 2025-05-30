import { Injectable, NestMiddleware, UnauthorizedException, LoggerService, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseConfig } from '../config/supabase.config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly supabaseConfig: SupabaseConfig,
    @Inject('LoggerService') private readonly logger: LoggerService, // Inject the logger
  ) {}

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
        this.logger.error('Authentication error', error?.stack, 'AuthMiddleware');
        throw new UnauthorizedException('Invalid token');
      }

      req['user'] = user;
      next();
    } catch (error) {
      this.logger.error(
        'Authentication middleware error',
        error instanceof Error ? error.stack : undefined,
        'AuthMiddleware',
      );
      next(error);
    }
  }
}
