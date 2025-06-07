import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class ConversationDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  participantIds: string[];
} 