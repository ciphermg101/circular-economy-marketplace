import { Module } from '@nestjs/common';
import { RepairShopsController } from './repair-shops.controller';
import { RepairShopsService } from './repair-shops.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Module({
  controllers: [RepairShopsController],
  providers: [RepairShopsService, SupabaseConfig],
  exports: [RepairShopsService],
})
export class RepairShopsModule {} 