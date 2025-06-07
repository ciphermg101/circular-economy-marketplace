import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '@messaging/conversation.entity';
import { Message } from '@messaging/message.entity';
import { MessagingRepository } from '@messaging/messaging.repository';
import { MessagingService } from '@messaging/messaging.service';
import { MessagingController } from '@messaging/messaging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message])],
  controllers: [MessagingController],
  providers: [MessagingRepository, MessagingService],
  exports: [MessagingService, MessagingRepository],
})
export class MessagingModule {} 