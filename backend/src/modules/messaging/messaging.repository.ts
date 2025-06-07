import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '@messaging/conversation.entity';
import { Message } from '@messaging/message.entity';
import { ConversationDto } from '@messaging/dto/conversation.dto';
import { CreateMessageDto } from '@messaging/dto/create-message.dto';
import { IMessagingRepository } from '@messaging/interfaces/messaging.interface';

@Injectable()
export class MessagingRepository implements IMessagingRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createConversation(dto: ConversationDto, creatorId: string): Promise<Conversation> {
    const conversation = this.conversationRepo.create();
    // Attach participants (including creator)
    conversation.participants = dto.participantIds.map(id => ({ id } as any));
    conversation.lastMessageAt = new Date();
    return this.conversationRepo.save(conversation);
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({ where: { id }, relations: ['participants', 'messages'] });
  }

  async findUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where('participant.id = :userId', { userId })
      .getMany();
  }

  async createMessage(dto: CreateMessageDto, senderId: string): Promise<Message> {
    const message = this.messageRepo.create({ ...dto, senderId, sentAt: new Date() });
    const saved = await this.messageRepo.save(message);
    // Update lastMessageAt on conversation
    await this.conversationRepo.update(dto.conversationId, { lastMessageAt: new Date() });
    return saved;
  }

  async findMessagesByConversation(conversationId: string): Promise<Message[]> {
    return this.messageRepo.find({ where: { conversationId }, order: { sentAt: 'ASC' }, relations: ['sender'] });
  }
} 