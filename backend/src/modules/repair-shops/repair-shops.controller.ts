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
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RepairShopsService } from '@repair-shops/repair-shops.service';
import { CreateRepairShopDto } from '@repair-shops/dto/create-shop.dto';
import { UpdateRepairShopDto } from '@repair-shops/dto/update-shop.dto';
import { BookingDto } from '@repair-shops/dto/booking.dto';
import { ReviewDto } from '@repair-shops/dto/review.dto';
import { SearchRepairShopsDto } from '@repair-shops/dto/search-shop.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response.interceptor';
// import { AuthGuard } from '../../guards/auth.guard';
// import { RolesGuard } from '../../guards/roles.guard';
// import { Roles } from '../../decorators/roles.decorator';
// import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('repair-shops')
@UseInterceptors(TransformResponseInterceptor)
@Controller('repair-shops')
export class RepairShopsController {
  constructor(private readonly repairShopsService: RepairShopsService) {}

  @Post()
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('repair_shop')
  @ApiOperation({ summary: 'Create a new repair shop' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createRepairShop(
    @Request() req: any, // Replace with AuthenticatedRequest when available
    @Body() dto: CreateRepairShopDto
  ) {
    return this.repairShopsService.create(req.user.id, dto);
  }

  @Get('my-shop')
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('repair_shop')
  @ApiOperation({ summary: 'Get current user repair shop' })
  @ApiBearerAuth()
  async getMyShop(@Request() req: any) {
    return this.repairShopsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repair shop by ID' })
  async findOne(@Param('id') id: string) {
    return this.repairShopsService.findOne(id);
  }

  @Put(':id')
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('repair_shop')
  @ApiOperation({ summary: 'Update a repair shop' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateRepairShop(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRepairShopDto,
  ) {
    return this.repairShopsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('repair_shop')
  @ApiOperation({ summary: 'Delete a repair shop' })
  @ApiBearerAuth()
  async deleteRepairShop(@Request() req: any, @Param('id') id: string) {
    return this.repairShopsService.remove(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Search repair shops' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchRepairShops(
    @Query() searchDto: SearchRepairShopsDto
  ) {
    return this.repairShopsService.searchRepairShops(searchDto);
  }

  @Post(':id/bookings')
  @ApiOperation({ summary: 'Create a booking for a repair shop' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createBooking(
    @Request() req: any,
    @Param('id') repairShopId: string,
    @Body() dto: BookingDto
  ) {
    return this.repairShopsService.createBooking(req.user.id, { ...dto, repairShopId });
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for a repair shop' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createReview(
    @Request() req: any,
    @Param('id') repairShopId: string,
    @Body() dto: ReviewDto
  ) {
    return this.repairShopsService.createReview(req.user.id, { ...dto, repairShopId });
  }
} 