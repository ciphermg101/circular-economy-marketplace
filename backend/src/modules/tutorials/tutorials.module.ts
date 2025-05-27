import { Module } from '@nestjs/common';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Module({
  controllers: [TutorialsController],
  providers: [TutorialsService, SupabaseConfig],
  exports: [TutorialsService],
})
export class TutorialsModule {} 