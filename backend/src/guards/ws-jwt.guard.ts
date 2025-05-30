import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '../types/socket.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractToken(client);

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.user = payload;
      return true;
    } catch {
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: AuthenticatedSocket): string {
    const auth = client.handshake?.auth?.token;
    if (!auth) {
      throw new WsException('Auth token not found');
    }
    return auth;
  }
} 