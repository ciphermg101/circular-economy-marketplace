import { Injectable } from '@nestjs/common';
import { MessagingRepository } from '@messaging/messaging.repository';
import { ConversationDto } from '@messaging/dto/conversation.dto';
import { CreateMessageDto } from '@messaging/dto/create-message.dto';
import { IMessagingService } from '@messaging/interfaces/messaging.interface';

@Injectable()
export class MessagingService implements IMessagingService {
  constructor(private readonly messagingRepository: MessagingRepository) {}

  async createConversation(dto: ConversationDto, creatorId: string) {
    return this.messagingRepository.createConversation(dto, creatorId);
  }

  async getConversation(id: string) {
    return this.messagingRepository.findConversationById(id);
  }

  async getUserConversations(userId: string) {
    return this.messagingRepository.findUserConversations(userId);
  }

  async sendMessage(dto: CreateMessageDto, senderId: string) {
    return this.messagingRepository.createMessage(dto, senderId);
  }

  async getMessages(conversationId: string) {
    return this.messagingRepository.findMessagesByConversation(conversationId);
  }
} 