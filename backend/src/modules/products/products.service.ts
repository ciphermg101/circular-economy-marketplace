import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProductsRepository } from '@products/products.repository';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { SearchProductsDto } from '@products/dto/search-product.dto';
import { PaginationParams } from '@products/interface/pagination.types';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(userId: string, dto: CreateProductDto) {
    try {
      return await this.productsRepository.createProduct(userId, dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productsRepository.findProductById(id);
      if (!product) throw new NotFoundException('Product not found');
      return product;
    } catch (error) {
      throw error instanceof NotFoundException ? error : new InternalServerErrorException('Failed to find product');
    }
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    try {
      return await this.productsRepository.updateProduct(userId, id, dto);
    } catch (error) {
      if (error.message === 'Not authorized to update this product') throw new ForbiddenException(error.message);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(userId: string, id: string) {
    try {
      await this.productsRepository.deleteProduct(userId, id);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (error.message === 'Not authorized to delete this product') throw new ForbiddenException(error.message);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  async searchProducts(searchDto: SearchProductsDto, pagination: PaginationParams = {}) {
    try {
      const [products, count] = await this.productsRepository.searchProducts(searchDto, pagination);
      return { products, count };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search products');
    }
  }
}