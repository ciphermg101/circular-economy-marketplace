import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SupabaseConfig } from '../../config/supabase.config';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, SupabaseConfig],
  exports: [ProductsService],
})
export class ProductsModule {} 