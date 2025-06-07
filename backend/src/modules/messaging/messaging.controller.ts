import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from '@messaging/messaging.service';
import { ConversationDto } from '@messaging/dto/conversation.dto';
import { CreateMessageDto } from '@messaging/dto/create-message.dto';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response.interceptor';

@ApiTags('messaging')
@UseInterceptors(TransformResponseInterceptor)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createConversation(
    @Request() req: any,
    @Body() dto: ConversationDto
  ) {
    return this.messagingService.createConversation(dto, req.user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiBearerAuth()
  async getConversation(@Param('id') id: string) {
    return this.messagingService.getConversation(id);
  }

  @Get('conversations/user/:userId')
  @ApiOperation({ summary: 'Get all conversations for a user' })
  @ApiBearerAuth()
  async getUserConversations(@Param('userId') userId: string) {
    return this.messagingService.getUserConversations(userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async sendMessage(
    @Request() req: any,
    @Body() dto: CreateMessageDto
  ) {
    return this.messagingService.sendMessage(dto, req.user.id);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  @ApiBearerAuth()
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.messagingService.getMessages(conversationId);
  }
} 