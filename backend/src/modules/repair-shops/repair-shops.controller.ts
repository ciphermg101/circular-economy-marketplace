import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RepairShopsService } from './repair-shops.service';
import { CreateRepairShopDto, UpdateRepairShopDto, SearchRepairShopsDto } from '../../dtos/repair-shop.dto';
import { PaginationParams } from '../../types/common.types';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('repair-shops')
@Controller('repair-shops')
export class RepairShopsController {
  constructor(private readonly repairShopsService: RepairShopsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('repair_shop')
  @ApiOperation({ summary: 'Create a new repair shop' })
  @ApiBearerAuth()
  async createRepairShop(@Request() req, @Body() dto: CreateRepairShopDto) {
    return this.repairShopsService.createRepairShop(req.user.id, dto);
  }

  @Get('my-shop')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('repair_shop')
  @ApiOperation({ summary: 'Get current user repair shop' })
  @ApiBearerAuth()
  async getMyShop(@Request() req) {
    return this.repairShopsService.getMyShop(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repair shop by ID' })
  async getRepairShop(@Param('id') id: string) {
    return this.repairShopsService.getRepairShop(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('repair_shop')
  @ApiOperation({ summary: 'Update a repair shop' })
  @ApiBearerAuth()
  async updateRepairShop(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRepairShopDto,
  ) {
    return this.repairShopsService.updateRepairShop(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('repair_shop')
  @ApiOperation({ summary: 'Delete a repair shop' })
  @ApiBearerAuth()
  async deleteRepairShop(@Request() req, @Param('id') id: string) {
    return this.repairShopsService.deleteRepairShop(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Search repair shops' })
  async searchRepairShops(
    @Query() searchDto: SearchRepairShopsDto,
    @Query() pagination: PaginationParams,
  ) {
    return this.repairShopsService.searchRepairShops(searchDto, pagination);
  }

  @Get('service/:service')
  @ApiOperation({ summary: 'Get repair shops by service' })
  async getShopsByService(
    @Param('service') service: string,
    @Query() pagination: PaginationParams,
  ) {
    return this.repairShopsService.getShopsByService(service, pagination);
  }
} 