import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@users/user.entity';
import { Message } from '@messaging/message.entity';
import { IsDate } from 'class-validator';

@Entity('conversations')
export class Conversation extends BaseEntity {
  @ManyToMany(() => User)
  @JoinTable({ name: 'conversation_participants' })
  participants: User[];

  @OneToMany(() => Message, message => message.conversation)
  messages: Message[];

  @IsDate()
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date;
} 