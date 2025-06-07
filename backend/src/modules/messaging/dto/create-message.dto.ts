import { IsUUID, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  content: string;
} 