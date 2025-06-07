import { Conversation } from '@messaging/conversation.entity';
import { Message } from '@messaging/message.entity';
import { ConversationDto } from '@messaging/dto/conversation.dto';
import { CreateMessageDto } from '@messaging/dto/create-message.dto';

export interface IMessagingRepository {
  createConversation(dto: ConversationDto, creatorId: string): Promise<Conversation>;
  findConversationById(id: string): Promise<Conversation | null>;
  findUserConversations(userId: string): Promise<Conversation[]>;
  createMessage(dto: CreateMessageDto, senderId: string): Promise<Message>;
  findMessagesByConversation(conversationId: string): Promise<Message[]>;
}

export interface IMessagingService {
  createConversation(dto: ConversationDto, creatorId: string): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | null>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  sendMessage(dto: CreateMessageDto, senderId: string): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
} 