import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedSocket } from '../types/socket.types';

export const WsAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<AuthenticatedSocket>();
    return client.user;
  },
); 