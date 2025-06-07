import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsRepository } from '@transactions/transactions.repository';
import { CreateTransactionDto } from '@transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@transactions/dto/update-transaction.dto';
import { OfferDto } from '@transactions/dto/offer.dto';

export interface ITransactionsService {
  createTransaction(dto: CreateTransactionDto): Promise<any>;
  getTransaction(id: string): Promise<any>;
  updateTransaction(id: string, dto: UpdateTransactionDto): Promise<any>;
  deleteTransaction(id: string): Promise<any>;
  createOffer(dto: OfferDto): Promise<any>;
  getOffer(id: string): Promise<any>;
  updateOffer(id: string, status: string): Promise<any>;
  deleteOffer(id: string): Promise<any>;
}

@Injectable()
export class TransactionsService implements ITransactionsService {
  constructor(private readonly transactionsRepository: TransactionsRepository) {}

  async createTransaction(dto: CreateTransactionDto) {
    try {
      return await this.transactionsRepository.createTransaction(dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  async getTransaction(id: string) {
    const transaction = await this.transactionsRepository.findTransactionById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    try {
      return await this.transactionsRepository.updateTransaction(id, dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  async deleteTransaction(id: string) {
    try {
      await this.transactionsRepository.deleteTransaction(id);
      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }

  async createOffer(dto: OfferDto) {
    try {
      return await this.transactionsRepository.createOffer(dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create offer');
    }
  }

  async getOffer(id: string) {
    const offer = await this.transactionsRepository.findOfferById(id);
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async updateOffer(id: string, status: string) {
    try {
      return await this.transactionsRepository.updateOffer(id, status);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update offer');
    }
  }

  async deleteOffer(id: string) {
    try {
      await this.transactionsRepository.deleteOffer(id);
      return { message: 'Offer deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete offer');
    }
  }
} 