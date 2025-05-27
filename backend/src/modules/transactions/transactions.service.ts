import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseConfig } from '../../config/supabase.config';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  CreateDisputeDto, 
  ResolveDisputeDto,
  ProcessPaymentDto,
  TransactionStatus 
} from '../../dtos/transaction.dto';
import { ConfigService } from '@nestjs/config';
import { logger } from '../../utils/logger';
import { createClient } from '@supabase/supabase-js';
import { MpesaService } from '../../services/mpesa.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly supabaseConfig: SupabaseConfig,
    private readonly configService: ConfigService,
    private readonly mpesaService: MpesaService
  ) {}

  private get supabase() {
    const url = this.configService.get('supabaseConfig.url');
    const key = this.configService.get('supabaseConfig.serviceRoleKey');

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    return createClient(url, key);
  }

  async createTransaction(buyerId: string, dto: CreateTransactionDto) {
    try {
      // Get product details and seller info
      const { data: product } = await this.supabase
        .from('products')
        .select('seller_id, price')
        .eq('id', dto.productId)
        .single();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Create transaction record
      const { data: transaction, error } = await this.supabase
        .from('transactions')
        .insert({
          buyer_id: buyerId,
          seller_id: product.seller_id,
          product_id: dto.productId,
          amount: product.price,
          shipping_address: dto.shippingAddress,
          notes: dto.notes,
          status: TransactionStatus.PENDING,
        })
        .select()
        .single();

      if (error) throw error;
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  async processPayment(transactionId: string, buyerId: string, dto: ProcessPaymentDto) {
    try {
      // Get transaction details
      const { data: transaction } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('buyer_id', buyerId)
        .single();

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Transaction is not in pending state');
      }

      // Initiate M-Pesa STK Push
      const stkPushResponse = await this.mpesaService.initiateSTKPush({
        phoneNumber: dto.phoneNumber,
        amount: transaction.amount,
        accountReference: transactionId,
        transactionDesc: `Payment for order #${transactionId}`,
      });

      // Update transaction with M-Pesa checkout request ID
      const { data, error } = await this.supabase
        .from('transactions')
        .update({
          status: TransactionStatus.PAYMENT_INITIATED,
          payment_provider: 'mpesa',
          payment_request_id: stkPushResponse.CheckoutRequestID,
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, stkPushResponse };
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async updateTransaction(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    try {
      // Get transaction to check permissions
      const { data: transaction } = await this.supabase
        .from('transactions')
        .select('buyer_id, seller_id, status')
        .eq('id', transactionId)
        .single();

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Verify user is buyer or seller
      if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
        throw new ForbiddenException('Not authorized to update this transaction');
      }

      // Validate status transition
      if (dto.status && !this.isValidStatusTransition(transaction.status, dto.status, userId === transaction.seller_id)) {
        throw new BadRequestException('Invalid status transition');
      }

      const { data, error } = await this.supabase
        .from('transactions')
        .update(dto)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating transaction:', error);
      throw error;
    }
  }

  async createDispute(userId: string, transactionId: string, dto: CreateDisputeDto) {
    try {
      // Check if transaction can be disputed
      const { data: canDispute } = await this.supabase
        .rpc('can_dispute_transaction', { transaction_id: transactionId });

      if (!canDispute) {
        throw new BadRequestException('Transaction cannot be disputed');
      }

      // Create dispute and update transaction status
      const { data: dispute, error: disputeError } = await this.supabase
        .from('disputes')
        .insert({
          transaction_id: transactionId,
          reported_by_id: userId,
          reason: dto.reason,
          description: dto.description,
          evidence_urls: dto.evidenceUrls
        })
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Update transaction status
      await this.supabase
        .from('transactions')
        .update({ status: TransactionStatus.DISPUTED })
        .eq('id', transactionId);

      return dispute;
    } catch (error) {
      logger.error('Error creating dispute:', error);
      throw error;
    }
  }

  async resolveDispute(adminId: string, disputeId: string, dto: ResolveDisputeDto) {
    try {
      // Get dispute and transaction details
      const { data: dispute } = await this.supabase
        .from('disputes')
        .update({
          resolution: dto.resolution,
          resolved_at: new Date().toISOString(),
          resolved_by_id: adminId,
          refund_amount: dto.refundAmount
        })
        .eq('id', disputeId)
        .select('transaction_id, refund_amount')
        .single();

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      // Update transaction status
      await this.supabase
        .from('transactions')
        .update({ status: dto.finalStatus })
        .eq('id', dispute.transaction_id);

      return { message: 'Dispute resolved successfully' };
    } catch (error) {
      logger.error('Error resolving dispute:', error);
      throw error;
    }
  }

  private isValidStatusTransition(
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
    isSeller: boolean
  ): boolean {
    const validTransitions = {
      [TransactionStatus.PENDING]: [TransactionStatus.CANCELLED],
      [TransactionStatus.PAYMENT_INITIATED]: [TransactionStatus.PAYMENT_COMPLETED, TransactionStatus.CANCELLED],
      [TransactionStatus.PAYMENT_COMPLETED]: isSeller ? [TransactionStatus.SHIPPED] : [],
      [TransactionStatus.SHIPPED]: [TransactionStatus.DELIVERED],
      [TransactionStatus.DELIVERED]: [TransactionStatus.COMPLETED, TransactionStatus.DISPUTED],
      [TransactionStatus.DISPUTED]: [TransactionStatus.COMPLETED, TransactionStatus.REFUNDED],
      [TransactionStatus.COMPLETED]: [TransactionStatus.DISPUTED],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.REFUNDED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  async getTransaction(userId: string, transactionId: string) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*),
          disputes(*)
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundException('Transaction not found');

      // Check if user is buyer or seller
      if (data.buyer_id !== userId && data.seller_id !== userId) {
        throw new ForbiddenException('Not authorized to view this transaction');
      }

      return data;
    } catch (error) {
      logger.error('Error getting transaction:', error);
      throw error;
    }
  }

  async getUserTransactions(userId: string, role: 'buyer' | 'seller', status?: TransactionStatus) {
    try {
      let query = this.supabase
        .from('transactions')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*)
        `)
        .eq(role === 'buyer' ? 'buyer_id' : 'seller_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      throw error;
    }
  }

  // Handle M-Pesa callback
  async handleMpesaCallback(callbackData: any) {
    try {
      const result = await this.mpesaService.handleCallback(callbackData);
      
      if (result.success) {
        // Update transaction status
        await this.supabase
          .from('transactions')
          .update({
            status: TransactionStatus.PAYMENT_COMPLETED,
            payment_id: result.transactionId,
            payment_date: result.date,
          })
          .eq('id', result.accountReference);

        return { success: true, message: 'Payment completed successfully' };
      }

      // Payment failed
      await this.supabase
        .from('transactions')
        .update({
          status: TransactionStatus.PAYMENT_FAILED,
          payment_error: result.resultDesc,
        })
        .eq('id', result.accountReference);

      return { success: false, message: result.resultDesc };
    } catch (error) {
      logger.error('Error handling M-Pesa callback:', error);
      throw error;
    }
  }
} 