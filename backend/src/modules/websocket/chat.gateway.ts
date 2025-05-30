import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../guards/ws-jwt.guard';
import { WsAuthUser } from '../../decorators/ws-auth-user.decorator';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.connectedUsers.delete(userId);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join')
  async handleJoin(client: Socket, @WsAuthUser() user: any) {
    this.connectedUsers.set(user.id, client.id);
    client.join(`user_${user.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { recipientId: string; content: string },
  ) {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

    const message = {
      senderId,
      recipientId: payload.recipientId,
      content: payload.content,
      timestamp: new Date(),
    };

    // Emit to recipient if online
    const recipientSocketId = this.connectedUsers.get(payload.recipientId);
    if (recipientSocketId) {
      this.server.to(`user_${payload.recipientId}`).emit('newMessage', message);
    }

    // Store message in database (implement this)
    // await this.messageService.create(message);
  }

  private getUserIdFromSocket(client: Socket): string | null {
    const user = client.handshake?.auth?.user;
    return user?.id || null;
  }
} 