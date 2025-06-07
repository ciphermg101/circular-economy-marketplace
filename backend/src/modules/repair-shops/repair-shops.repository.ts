import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { RepairShop } from '@repair-shops/repair-shop.entity';
import { Service } from '@repair-shops/service.entity';
import { Booking } from '@repair-shops/booking.entity';
import { Review } from '@repair-shops/review.entity';
import { CreateRepairShopDto } from '@repair-shops/dto/create-shop.dto';
import { UpdateRepairShopDto } from '@repair-shops/dto/update-shop.dto';
import { BookingDto } from '@repair-shops/dto/booking.dto';
import { ReviewDto } from '@repair-shops/dto/review.dto';
import { SearchRepairShopsDto } from '@repair-shops/dto/search-shop.dto';

export interface IRepairShopsRepository {
  createRepairShop(userId: string, dto: CreateRepairShopDto): Promise<RepairShop>;
  findByUserId(userId: string): Promise<RepairShop | null>;
  findOne(id: string): Promise<RepairShop | null>;
  updateRepairShop(userId: string, id: string, dto: UpdateRepairShopDto): Promise<RepairShop>;
  deleteRepairShop(userId: string, id: string): Promise<void>;
  searchRepairShops(searchDto: SearchRepairShopsDto): Promise<RepairShop[]>;
  createBooking(userId: string, dto: BookingDto): Promise<Booking>;
  createReview(userId: string, dto: ReviewDto): Promise<Review>;
}

@Injectable()
export class RepairShopsRepository implements IRepairShopsRepository {
  constructor(
    @InjectRepository(RepairShop)
    private readonly shopRepo: Repository<RepairShop>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async createRepairShop(userId: string, dto: CreateRepairShopDto): Promise<RepairShop> {
    const shop = this.shopRepo.create({ ...dto, userId });
    return this.shopRepo.save(shop);
  }

  async findByUserId(userId: string): Promise<RepairShop | null> {
    return this.shopRepo.findOne({ where: { userId }, relations: ['services', 'bookings', 'reviews'] });
  }

  async findOne(id: string): Promise<RepairShop | null> {
    return this.shopRepo.findOne({ where: { id }, relations: ['services', 'bookings', 'reviews'] });
  }

  async updateRepairShop(userId: string, id: string, dto: UpdateRepairShopDto): Promise<RepairShop> {
    const shop = await this.shopRepo.findOne({ where: { id } });
    if (!shop) throw new Error('Repair shop not found');
    if (shop.userId !== userId) throw new Error('Not authorized to update this shop');
    Object.assign(shop, dto);
    return this.shopRepo.save(shop);
  }

  async deleteRepairShop(userId: string, id: string): Promise<void> {
    const shop = await this.shopRepo.findOne({ where: { id } });
    if (!shop) throw new Error('Repair shop not found');
    if (shop.userId !== userId) throw new Error('Not authorized to delete this shop');
    await this.shopRepo.softDelete(id);
  }

  async searchRepairShops(searchDto: SearchRepairShopsDto): Promise<RepairShop[]> {
    const where: FindOptionsWhere<RepairShop> = {};
    if (searchDto.query) {
      where.name = ILike(`%${searchDto.query}%`);
    }
    // TODO: Add location/radius/service filtering if needed
    return this.shopRepo.find({ where, relations: ['services', 'bookings', 'reviews'] });
  }

  async createBooking(userId: string, dto: BookingDto): Promise<Booking> {
    const booking = this.bookingRepo.create({ ...dto, userId, date: new Date(dto.date) });
    return this.bookingRepo.save(booking);
  }

  async createReview(userId: string, dto: ReviewDto): Promise<Review> {
    const review = this.reviewRepo.create({ ...dto, userId });
    return this.reviewRepo.save(review);
  }
}
