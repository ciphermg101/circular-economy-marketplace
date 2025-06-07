import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from '@products/products.controller';
import { ProductsService } from '@products/products.service';
import { ProductsRepository } from '@products/products.repository';
import { Product } from '@products/product.entity';
import { ProductCategory } from '@products/product-category.entity';
import { SupabaseModule } from '@common/supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    TypeOrmModule.forFeature([Product, ProductCategory]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}