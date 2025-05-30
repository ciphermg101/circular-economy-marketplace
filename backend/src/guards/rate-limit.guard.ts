import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected async getTracker(req: Record<string, any>): Promise<string> {
    try {
      // First try to get client IP from Cloudflare headers
      const cfConnectingIp = req.headers['cf-connecting-ip'];
      if (cfConnectingIp) {
        return cfConnectingIp;
      }

      // Then try X-Forwarded-For
      if (req.ips && req.ips.length > 0) {
        return req.ips[0];
      }

      // Finally fallback to direct IP
      return req.ip;
    } catch (error) {
      this.logger.error('Error getting IP for rate limiting:', error);
      return req.ip; // Fallback to direct IP
    }
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException();
  }
}