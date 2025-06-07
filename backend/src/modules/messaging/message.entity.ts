import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@users/user.entity';
import { Conversation } from '@messaging/conversation.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamptz' })
  sentAt: Date;
} 