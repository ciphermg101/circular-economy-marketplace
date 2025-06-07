import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairShopsController } from '@repair-shops/repair-shops.controller';
import { RepairShopsService } from '@repair-shops/repair-shops.service';
import { RepairShopsRepository } from '@repair-shops/repair-shops.repository';
import { RepairShop } from '@repair-shops/repair-shop.entity';
import { Service } from '@repair-shops/service.entity';
import { Booking } from '@repair-shops/booking.entity';
import { Review } from '@repair-shops/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepairShop, Service, Booking, Review])],
  controllers: [RepairShopsController],
  providers: [RepairShopsService, RepairShopsRepository],
  exports: [RepairShopsService, RepairShopsRepository],
})
export class RepairShopsModule {} 