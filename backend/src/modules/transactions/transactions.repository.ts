import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '@transactions/transaction.entity';
import { Offer } from '@transactions/offer.entity';
import { CreateTransactionDto } from '@transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@transactions/dto/update-transaction.dto';
import { OfferDto } from '@transactions/dto/offer.dto';

export interface ITransactionsRepository {
  createTransaction(dto: CreateTransactionDto): Promise<Transaction>;
  findTransactionById(id: string): Promise<Transaction | null>;
  updateTransaction(id: string, dto: UpdateTransactionDto): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  createOffer(dto: OfferDto): Promise<Offer>;
  findOfferById(id: string): Promise<Offer | null>;
  updateOffer(id: string, status: string): Promise<Offer>;
  deleteOffer(id: string): Promise<void>;
}

@Injectable()
export class TransactionsRepository implements ITransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepo.create(dto);
    return this.transactionRepo.save(transaction);
  }

  async findTransactionById(id: string): Promise<Transaction | null> {
    return this.transactionRepo.findOne({ where: { id }, relations: ['buyer', 'seller', 'product', 'offer'] });
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({ where: { id } });
    if (!transaction) throw new Error('Transaction not found');
    Object.assign(transaction, dto);
    return this.transactionRepo.save(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.transactionRepo.softDelete(id);
  }

  async createOffer(dto: OfferDto): Promise<Offer> {
    const offer = this.offerRepo.create(dto);
    return this.offerRepo.save(offer);
  }

  async findOfferById(id: string): Promise<Offer | null> {
    return this.offerRepo.findOne({ where: { id }, relations: ['buyer', 'seller', 'product', 'transaction'] });
  }

  async updateOffer(id: string, status: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({ where: { id } });
    if (!offer) throw new Error('Offer not found');
    offer.status = status as any;
    return this.offerRepo.save(offer);
  }

  async deleteOffer(id: string): Promise<void> {
    await this.offerRepo.softDelete(id);
  }
} 