import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from '../../dtos/product.dto';
import { PaginationParams } from '../../types/pagination.types';
import { AuthenticatedRequest } from '../../types/request';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('seller')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBearerAuth()
  async createProduct(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search products' })
  async getAllProducts(@Query() pagination: PaginationParams) {
    return this.productsService.getAllProducts(pagination);
  }

  @Put(':id')
  @Roles('seller')
  @ApiOperation({ summary: 'Update a product' })
  @ApiBearerAuth()
  async updateProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(req.user.id, id, dto);
  }

  @Delete(':id')
  @Roles('seller')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth()
  async deleteProduct(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.productsService.deleteProduct(req.user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Get('seller/:id')
  @ApiOperation({ summary: 'Get products by seller ID' })
  async getSellerProducts(
    @Param('id') sellerId: string,
    @Query() pagination: PaginationParams,
  ) {
    return this.productsService.getSellerProducts(sellerId, pagination);
  }

  @Get('my/products')
  @Roles('seller')
  @ApiOperation({ summary: 'Get current user products' })
  @ApiBearerAuth()
  async getMyProducts(
    @Request() req: AuthenticatedRequest,
    @Query() pagination: PaginationParams,
  ) {
    return this.productsService.getSellerProducts(req.user.id, pagination);
  }
} 