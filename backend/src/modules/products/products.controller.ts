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
  Patch,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from '../../dtos/product.dto';
import { PaginationParams } from '../../types/pagination.types';
import { AuthenticatedRequest } from '../../types/request.types';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../guards/auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('seller')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBearerAuth()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search products' })
  async findAll(@Query() pagination: PaginationParams) {
    return this.productsService.search(pagination);
  }

  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.productsService.findNearby(latitude, longitude, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('seller')
  @ApiOperation({ summary: 'Update a product' })
  @ApiBearerAuth()
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @Roles('seller')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth()
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.productsService.remove(req.user.id, id);
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