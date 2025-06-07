import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { RepairShopsRepository } from '@repair-shops/repair-shops.repository';
import { CreateRepairShopDto } from '@repair-shops/dto/create-shop.dto';
import { UpdateRepairShopDto } from '@repair-shops/dto/update-shop.dto';
import { BookingDto } from '@repair-shops/dto/booking.dto';
import { ReviewDto } from '@repair-shops/dto/review.dto';
import { SearchRepairShopsDto } from '@repair-shops/dto/search-shop.dto';

@Injectable()
export class RepairShopsService {
  constructor(private readonly repairShopsRepository: RepairShopsRepository) {}

  async create(userId: string, dto: CreateRepairShopDto) {
    try {
      return await this.repairShopsRepository.createRepairShop(userId, dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create repair shop');
    }
  }

  async findOne(id: string) {
    try {
      const shop = await this.repairShopsRepository.findOne(id);
      if (!shop) throw new NotFoundException('Repair shop not found');
      return shop;
    } catch (error) {
      throw error instanceof NotFoundException ? error : new InternalServerErrorException('Failed to find repair shop');
    }
  }

  async findByUserId(userId: string) {
    try {
      const shop = await this.repairShopsRepository.findByUserId(userId);
      if (!shop) throw new NotFoundException('Repair shop not found');
      return shop;
    } catch (error) {
      throw error instanceof NotFoundException ? error : new InternalServerErrorException('Failed to find repair shop');
    }
  }

  async update(userId: string, id: string, dto: UpdateRepairShopDto) {
    try {
      return await this.repairShopsRepository.updateRepairShop(userId, id, dto);
    } catch (error) {
      if (error.message === 'Not authorized to update this shop') throw new ForbiddenException(error.message);
      throw new InternalServerErrorException('Failed to update repair shop');
    }
  }

  async remove(userId: string, id: string) {
    try {
      await this.repairShopsRepository.deleteRepairShop(userId, id);
      return { message: 'Repair shop deleted successfully' };
    } catch (error) {
      if (error.message === 'Not authorized to delete this shop') throw new ForbiddenException(error.message);
      throw new InternalServerErrorException('Failed to delete repair shop');
    }
  }

  async searchRepairShops(searchDto: SearchRepairShopsDto) {
    try {
      return await this.repairShopsRepository.searchRepairShops(searchDto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to search repair shops');
    }
  }

  async createBooking(userId: string, dto: BookingDto) {
    try {
      return await this.repairShopsRepository.createBooking(userId, dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create booking');
    }
  }

  async createReview(userId: string, dto: ReviewDto) {
    try {
      return await this.repairShopsRepository.createReview(userId, dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create review');
    }
  }
}