import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, SupabaseConfig],
  exports: [ProfilesService],
})
export class ProfilesModule {} 