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
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { logger } from '../../utils/logger';
import { createClient } from '@supabase/supabase-js';
import { RefundTransactionDto } from './dto/refund-transaction.dto';

@Injectable()
export class TransactionsService {
  private stripe: Stripe;

  constructor(
    private readonly supabaseConfig: SupabaseConfig,
    private readonly configService: ConfigService
  ) {
    this.stripe = new Stripe(this.configService.get('stripeConfig.secretKey')!, {
      apiVersion: '2023-10-16'
    });
  }

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

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(product.price * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          productId: product.id,
          userId: buyerId,
        },
      });

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
          payment_intent_id: paymentIntent.id,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        transaction,
        clientSecret: paymentIntent.client_secret,
      };
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

      // Create or confirm payment intent
      let paymentIntent;
      if (dto.paymentIntentId) {
        paymentIntent = await this.stripe.paymentIntents.confirm(dto.paymentIntentId);
      } else {
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(transaction.amount * 100), // Convert to cents
          currency: 'usd',
          payment_method: dto.paymentMethodId,
          confirmation_method: 'manual',
          confirm: true
        });
      }

      // Update transaction status based on payment intent status
      const status = paymentIntent.status === 'succeeded' 
        ? TransactionStatus.PAYMENT_COMPLETED 
        : TransactionStatus.PAYMENT_INITIATED;

      const { data, error } = await this.supabase
        .from('transactions')
        .update({
          status,
          payment_intent_id: paymentIntent.id
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return { transaction: data, paymentIntent };
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

      // Get transaction payment intent
      const { data: transaction } = await this.supabase
        .from('transactions')
        .select('payment_intent_id, amount')
        .eq('id', dispute.transaction_id)
        .single();

      // Process refund if needed
      if (dto.refundAmount > 0) {
        // Validate refund amount
        if (dto.refundAmount > transaction.amount) {
          throw new BadRequestException('Refund amount cannot exceed the original transaction amount');
        }

        try {
          const refund = await this.stripe.refunds.create({
            payment_intent: transaction.payment_intent_id,
            amount: Math.round(dto.refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer'
          });

          // Update transaction status and store refund info
          await this.supabase
            .from('transactions')
            .update({ 
              status: dto.finalStatus,
              refund_id: refund.id,
              refunded_amount: dto.refundAmount
            })
            .eq('id', dispute.transaction_id);
        } catch (stripeError) {
          logger.error('Error processing refund:', stripeError);
          throw new BadRequestException('Failed to process refund');
        }
      } else {
        // Just update transaction status if no refund
        await this.supabase
          .from('transactions')
          .update({ status: dto.finalStatus })
          .eq('id', dispute.transaction_id);
      }

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

  async refundTransaction(userId: string, transactionId: string, dto: RefundTransactionDto) {
    const transaction = await this.getTransaction(userId, transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (dto.refundAmount > 0) {
      // Validate refund amount
      if (dto.refundAmount > transaction.amount) {
        throw new Error('Refund amount cannot be greater than transaction amount');
      }

      // Process refund through Stripe
      await this.stripe.refunds.create({
        payment_intent: transaction.payment_intent_id,
        amount: Math.round(dto.refundAmount * 100), // Convert to cents
        reason: dto.reason || 'requested_by_customer',
      });
    }

    // Update transaction status
    const { error } = await this.supabase
      .from('transactions')
      .update({ status: 'refunded' })
      .eq('id', transactionId);

    if (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }

    return this.getTransaction(userId, transactionId);
  }
} 