import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Product } from '@products/product.entity';
import { ProductCategory } from '@products/product-category.entity';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { SearchProductsDto } from '@products/dto/search-product.dto';
import { PaginationParams } from '@products/interface/pagination.types';

export interface IProductsRepository {
  createProduct(userId: string, dto: CreateProductDto): Promise<Product>;
  findProductById(id: string): Promise<Product | null>;
  updateProduct(userId: string, id: string, dto: UpdateProductDto): Promise<Product>;
  deleteProduct(userId: string, id: string): Promise<void>;
  searchProducts(searchDto: SearchProductsDto, pagination: PaginationParams): Promise<[Product[], number]>;
}

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
  ) {}

  async createProduct(userId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({ ...dto, userId });
    return this.productRepo.save(product);
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { id }, relations: ['category', 'user', 'reviews'] });
  }

  async updateProduct(userId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new Error('Product not found');
    if (product.userId !== userId) throw new Error('Not authorized to update this product');
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async deleteProduct(userId: string, id: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new Error('Product not found');
    if (product.userId !== userId) throw new Error('Not authorized to delete this product');
    await this.productRepo.softDelete(id);
  }

  async searchProducts(searchDto: SearchProductsDto, pagination: PaginationParams = {}): Promise<[Product[], number]> {
    const where: FindOptionsWhere<Product> = {};
    if (searchDto.query) {
      where.title = ILike(`%${searchDto.query}%`);
    }
    if (searchDto.categoryId) {
      where.categoryId = searchDto.categoryId;
    }
    if (searchDto.condition) {
      where.condition = searchDto.condition;
    }
    if (searchDto.minPrice && searchDto.maxPrice) {
      where.price = Between(searchDto.minPrice, searchDto.maxPrice);
    } else if (searchDto.minPrice) {
      where.price = MoreThanOrEqual(searchDto.minPrice);
    } else if (searchDto.maxPrice) {
      where.price = LessThanOrEqual(searchDto.maxPrice);
    }
    // TODO: Add location/radius filtering if needed
    const [products, count] = await this.productRepo.findAndCount({
      where,
      skip: pagination.page && pagination.limit ? (pagination.page - 1) * pagination.limit : 0,
      take: pagination.limit,
      relations: ['category', 'user', 'reviews'],
      order: { createdAt: 'DESC' },
    });
    return [products, count];
  }
}
