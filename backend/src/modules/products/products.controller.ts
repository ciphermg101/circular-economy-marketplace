import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '@products/products.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto } from '@products/dto/product.dto';
import { PaginationParams } from '@products/interface/pagination.types';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response.interceptor';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('products')
@UseInterceptors(TransformResponseInterceptor)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Request() req: any,
    @Body() dto: CreateProductDto
  ) {
    return this.productsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list products' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(
    @Query() searchDto: SearchProductsDto,
    @Query() pagination: PaginationParams
  ) {
    return this.productsService.searchProducts(searchDto, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Update a product' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth()
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.productsService.remove(req.user.id, id);
  }
}