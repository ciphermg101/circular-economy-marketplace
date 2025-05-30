import { Module } from '@nestjs/common';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';
import { SupabaseConfig } from '../../config/supabase.config';
import { StorageModule } from '../storage/storage.module';
import { CacheModule } from '../cache/cache.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [StorageModule, CacheModule, LoggerModule],
  controllers: [TutorialsController],
  providers: [TutorialsService, SupabaseConfig],
  exports: [TutorialsService],
})
export class TutorialsModule {} 