import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { MetricsService } from '../../services/metrics.service';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000, // Send ping every 10 seconds
  pingTimeout: 5000,   // Wait 5 seconds for pong response
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})
@Injectable()
@ApiTags('websocket')
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly redis: Redis;
  private readonly connectedClients = new Map<string, Set<string>>();
  private readonly messageRetentionPeriod: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
    this.messageRetentionPeriod = this.configService.get('websocket.messageRetentionPeriod', 7 * 24 * 60 * 60); // 7 days in seconds
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupHeartbeat();
    this.setupMessageCleanup();
  }

  private setupMessageCleanup() {
    this.cleanupInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const keys = await this.redis.keys('*_updates:*');
        
        for (const key of keys) {
          // Get message timestamps and remove old ones
          const messages = await this.redis.lrange(key, 0, -1);
          const validMessages = messages.filter(msg => {
            const parsed = JSON.parse(msg);
            return (now - new Date(parsed.timestamp).getTime()) / 1000 < this.messageRetentionPeriod;
          });

          if (validMessages.length !== messages.length) {
            await this.redis.del(key);
            if (validMessages.length > 0) {
              await this.redis.rpush(key, ...validMessages);
            }
          }
        }
      } catch (error) {
        this.logger.error('Error cleaning up old messages:', error);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    await this.redis.quit();
  }

  private setupHeartbeat() {
    setInterval(async () => {
      try {
        const clients = await this.getConnectedClients();
        clients.forEach(clientId => {
          const socket = this.server.sockets.sockets.get(clientId) as AuthenticatedSocket;
          if (socket) {
            socket.emit('ping');
          }
        });
      } catch (error) {
        this.logger.error('Error in heartbeat:', error);
      }
    }, 30000);
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new WsException('Unauthorized');
      }

      const user = await this.validateToken(token);
      (client as AuthenticatedSocket).user = user;

      // Initialize set for user if not exists
      if (!this.connectedClients.has(user.id)) {
        this.connectedClients.set(user.id, new Set());
      }

      // Add client to user's set
      this.connectedClients.get(user.id)?.add(client.id);

      // Update metrics
      await this.metricsService.increment('websocket_connections');

      this.logger.log(`Client connected: ${client.id} (User: ${user.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      if (client.user) {
        const userClients = this.connectedClients.get(client.user.id);
        if (userClients) {
          userClients.delete(client.id);
          if (userClients.size === 0) {
            this.connectedClients.delete(client.user.id);
          }
        }

        // Update metrics
        await this.metricsService.decrement('websocket_connections');

        this.logger.log(`Client disconnected: ${client.id} (User: ${client.user.id})`);
      }
    } catch (error) {
      this.logger.error('Disconnect error:', error);
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.split(' ')[1];
  }

  private async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        id: payload.sub,
        role: payload.role,
      };
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }

  async broadcastToUser(userId: string, event: string, data: any) {
    const userClients = this.connectedClients.get(userId);
    if (userClients) {
      for (const clientId of userClients) {
        this.server.to(clientId).emit(event, data);
      }
    }
  }

  async broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  isUserConnected(userId: string): boolean {
    const userClients = this.connectedClients.get(userId);
    return Boolean(userClients?.size);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  getConnectionCount(): number {
    let total = 0;
    for (const clients of this.connectedClients.values()) {
      total += clients.size;
    }
    return total;
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('joinProductRoom')
  async handleJoinProductRoom(
    @MessageBody() productId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await client.join(`product:${productId}`);
      return { event: 'joinProductRoom', data: { success: true } };
    } catch (error) {
      throw new WsException('Could not join product room');
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('leaveProductRoom')
  async handleLeaveProductRoom(
    @MessageBody() productId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await client.leave(`product:${productId}`);
      return { event: 'leaveProductRoom', data: { success: true } };
    } catch (error) {
      throw new WsException('Could not leave product room');
    }
  }

  async emitProductUpdate(productId: string, update: any) {
    try {
      const message = {
        ...update,
        timestamp: new Date().toISOString(),
      };

      // Store message in Redis for offline users
      const key = `product_updates:${productId}`;
      await this.redis.lpush(key, JSON.stringify(message));
      await this.redis.ltrim(key, 0, 99); // Keep last 100 updates

      this.server.to(`product:${productId}`).emit('productUpdate', {
        productId,
        ...message,
      });
    } catch (error) {
      this.logger.error(`Error emitting product update: ${error.message}`);
      // Add to retry queue
      await this.addToRetryQueue('product', productId, update);
    }
  }

  private async addToRetryQueue(type: string, id: string, message: any) {
    const key = `retry_queue:${type}:${id}`;
    await this.redis.lpush(key, JSON.stringify({
      message,
      attempts: 0,
      timestamp: new Date().toISOString(),
    }));
  }

  private async processRetryQueue() {
    try {
      const keys = await this.redis.keys('retry_queue:*');
      for (const key of keys) {
        const results = await this.redis.multi()
          .lrange(key, 0, -1)
          .del(key)
          .exec();

        if (results === null) {
          // transaction aborted, handle error or continue
          this.logger.error(`Transaction aborted for key ${key}`);
          continue;
        }

        // results is an array like: [ [err1, res1], [err2, res2] ]
        const [[errLRange, messages], [errDel, delResult]] = results;

        if (errLRange) {
          this.logger.error(`Error on LRANGE for key ${key}: ${errLRange.message}`);
          continue;
        }

        if (errDel) {
          this.logger.error(`Error on DEL for key ${key}: ${errDel.message}`);
          continue;
        }

        // messages is your array of strings now
        const [_, type, id] = key.split(':');

        for (const messageStr of messages as string[]) {
          const { message, attempts } = JSON.parse(messageStr);
          if (attempts < 3) {
            if (type === 'product') {
              await this.emitProductUpdate(id, message);
            } else if (type === 'transaction') {
              await this.emitTransactionUpdate(id, message);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing retry queue:', error);
    }
  }

  async emitTransactionUpdate(transactionId: string, update: any) {
    try {
      // Store message in Redis for offline users
      const key = `transaction_updates:${transactionId}`;
      await this.redis.lpush(key, JSON.stringify(update));
      await this.redis.ltrim(key, 0, 99); // Keep last 100 updates

      this.server.to(`transaction:${transactionId}`).emit('transactionUpdate', {
        transactionId,
        ...update,
      });
    } catch (error) {
      this.logger.error(`Error emitting transaction update: ${error.message}`);
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('getOfflineUpdates')
  async handleGetOfflineUpdates(
    @MessageBody() data: { type: 'product' | 'transaction'; id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const key = `${data.type}_updates:${data.id}`;
      const updates = await this.redis.lrange(key, 0, -1);
      return {
        event: 'offlineUpdates',
        data: updates.map(update => JSON.parse(update)),
      };
    } catch (error) {
      throw new WsException('Could not fetch offline updates');
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('joinTransactionRoom')
  async handleJoinTransactionRoom(
    @MessageBody() transactionId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await client.join(`transaction:${transactionId}`);
      return { event: 'joinTransactionRoom', data: { success: true } };
    } catch (error) {
      throw new WsException('Could not join transaction room');
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('leaveTransactionRoom')
  async handleLeaveTransactionRoom(
    @MessageBody() transactionId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await client.leave(`transaction:${transactionId}`);
      return { event: 'leaveTransactionRoom', data: { success: true } };
    } catch (error) {
      throw new WsException('Could not leave transaction room');
    }
  }

  private getConnectedClients(): Promise<Set<string>> {
    return new Promise((resolve) => {
      const clients = new Set<string>();
      const sockets = this.server.sockets;
      
      sockets.sockets.forEach((socket) => {
        clients.add(socket.id);
      });

      resolve(clients);
    });
  }
} 