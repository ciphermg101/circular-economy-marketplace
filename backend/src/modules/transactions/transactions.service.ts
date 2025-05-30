import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MpesaService } from '../../services/mpesa.service';
import { SupabaseService } from '../supabase/supabase.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { Logger } from '@nestjs/common';
import { 
  CreateTransactionDto, 
  UpdateTransactionDto, 
  CreateDisputeDto, 
  ResolveDisputeDto,
  ProcessPaymentDto
} from '../../dtos/transaction.dto';
import { TransactionStatus, MpesaResponse, MpesaCallbackResult } from '../../types/common.types';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly mpesaService: MpesaService,
    private readonly supabaseService: SupabaseService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    try {
      const { data, error } = await this.supabaseService.getClient
        .from('transactions')
        .insert({
          buyer_id: userId,
          ...dto,
          status: TransactionStatus.PENDING,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating transaction:', error);
        throw new InternalServerErrorException('Failed to create transaction');
      }

      // Notify relevant parties
      await this.websocketGateway.emitTransactionUpdate(data.id, {
        type: 'TRANSACTION_CREATED',
        transaction: data,
      });

      return data;
    } catch (error) {
      this.handleError(error, 'create transaction');
    }
  }

  async findAll(userId: string) {
    try {
      const { data, error } = await this.supabaseService.getClient
        .from('transactions')
        .select('*, products(*), profiles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error finding transactions:', error);
      throw new InternalServerErrorException('Failed to find transactions');
    }
  }

  async findOne(userId: string, id: string) {
    try {
      const { data, error } = await this.supabaseService.getClient
        .from('transactions')
        .select(`
          *,
          product:products(*),
          buyer:profiles!buyer_id(*),
          seller:profiles!seller_id(*),
          disputes(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new InternalServerErrorException('Failed to fetch transaction');
      }

      if (!data) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      if (data.buyer_id !== userId && data.seller_id !== userId) {
        throw new ForbiddenException('You are not authorized to view this transaction');
      }

      return data;
    } catch (error) {
      this.handleError(error, 'fetch transaction');
    }
  }

  private handleError(error: any, operation: string) {
    this.logger.error(`Error during ${operation}:`, error);

    if (error instanceof NotFoundException || 
        error instanceof BadRequestException || 
        error instanceof ForbiddenException || 
        error instanceof InternalServerErrorException) {
      throw error;
    }

    throw new InternalServerErrorException(`An unexpected error occurred while trying to ${operation}`);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    try {
      const transaction = await this.findOne(userId, id);

      if (dto.status && !this.isValidTransition(transaction.status, dto.status)) {
        throw new BadRequestException('Invalid status transition');
      }

      const { data, error } = await this.supabaseService.getClient
        .from('transactions')
        .update({
          ...dto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error('Error updating transaction:', error);
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  async remove(userId: string, id: string) {
    try {
      const transaction = await this.findOne(userId, id);

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Can only delete pending transactions');
      }

      const { error } = await this.supabaseService.getClient
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { message: 'Transaction deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting transaction:', error);
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }

  async processPayment(userId: string, id: string, dto: ProcessPaymentDto): Promise<MpesaResponse> {
    try {
      const transaction = await this.findOne(userId, id);

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Transaction is not in pending state');
      }

      if (transaction.buyer_id !== userId) {
        throw new BadRequestException('Only the buyer can process payment');
      }

      const paymentResponse = await this.mpesaService.initiatePayment(
        dto.phoneNumber,
        transaction.amount,
        transaction.id
      );

      if (!paymentResponse.CheckoutRequestID) {
        throw new InternalServerErrorException('Invalid payment response: missing CheckoutRequestID');
      }

      await this.update(userId, id, {
        status: TransactionStatus.PAYMENT_INITIATED,
        paymentIntentId: paymentResponse.CheckoutRequestID,
      });

      return paymentResponse;
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      throw new InternalServerErrorException('Failed to process payment');
    }
  }

  private isValidTransition(currentStatus: TransactionStatus, newStatus: TransactionStatus): boolean {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.PAYMENT_INITIATED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAYMENT_INITIATED]: [
        TransactionStatus.PAYMENT_COMPLETED,
        TransactionStatus.PAYMENT_FAILED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionStatus.PAYMENT_COMPLETED]: [
        TransactionStatus.SHIPPED,
        TransactionStatus.DISPUTED,
        TransactionStatus.REFUNDED,
      ],
      [TransactionStatus.SHIPPED]: [
        TransactionStatus.DELIVERED,
        TransactionStatus.DISPUTED,
      ],
      [TransactionStatus.DELIVERED]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.DISPUTED,
      ],
      [TransactionStatus.COMPLETED]: [
        TransactionStatus.DISPUTED,
      ],
      [TransactionStatus.DISPUTED]: [
        TransactionStatus.REFUNDED,
        TransactionStatus.COMPLETED,
      ],
      [TransactionStatus.PAYMENT_FAILED]: [
        TransactionStatus.CANCELLED,
        TransactionStatus.PAYMENT_INITIATED,
      ],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  async handleMpesaCallback(result: MpesaCallbackResult) {
    try {
      if (!result.success) {
        const { data: transaction } = await this.supabaseService.getClient
          .from('transactions')
          .select('*')
          .eq('payment_intent_id', result.checkoutRequestId)
          .single();

        if (!transaction) {
          throw new Error('Transaction not found');
        }

        await this.update(transaction.buyer_id, transaction.id, {
          status: TransactionStatus.PAYMENT_FAILED,
          paymentError: result.resultDesc,
        });

        return;
      }

      const { data: transaction } = await this.supabaseService.getClient
        .from('transactions')
        .select('*')
        .eq('payment_intent_id', result.checkoutRequestId)
        .single();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await this.update(transaction.buyer_id, transaction.id, {
        status: TransactionStatus.PAYMENT_COMPLETED,
        paymentId: result.transactionId,
        payment_date: result.date,
      });
    } catch (error) {
      this.logger.error('Error handling M-Pesa callback:', error);
      throw new InternalServerErrorException('Failed to process M-Pesa payment');
    }
  }

  async createDispute(userId: string, transactionId: string, dto: CreateDisputeDto) {
    // Verify transaction exists and user is involved
    const { data: transaction } = await this.supabaseService.getClient
      .from('transactions')
      .select('*, buyer:buyer_id(*), seller:seller_id(*)')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.buyer.id !== userId && transaction.seller.id !== userId) {
      throw new BadRequestException('User not involved in transaction');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Can only dispute completed transactions');
    }

    // Create dispute
    const { data: dispute, error } = await this.supabaseService.getClient
      .from('disputes')
      .insert({
        transaction_id: transactionId,
        initiator_id: userId,
        reason: dto.reason,
        description: dto.description,
        status: 'open',
        evidence_urls: dto.evidenceUrls,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to create dispute');
    }

    // Update transaction status
    await this.supabaseService.getClient
      .from('transactions')
      .update({ status: TransactionStatus.DISPUTED })
      .eq('id', transactionId);

    // Notify via websocket
    await this.websocketGateway.emitTransactionUpdate(transactionId, {
      type: 'DISPUTE_CREATED',
      dispute,
    });

    return dispute;
  }

  async resolveDispute(adminId: string, disputeId: string, dto: ResolveDisputeDto) {
    // Verify admin role here (omitted for brevity)
    // Fetch dispute and transaction
    const { data: dispute } = await this.supabaseService.getClient
      .from('disputes')
      .select('*, transaction(*)')
      .eq('id', disputeId)
      .single();

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'open') {
      throw new BadRequestException('Dispute already resolved');
    }

    // Update dispute status and resolution
    const { data: updatedDispute, error } = await this.supabaseService.getClient
      .from('disputes')
      .update({
        status: 'resolved',
        resolution: dto.resolution,
        resolved_by: adminId,
        resolution_comment: dto.resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to resolve dispute');
    }

    // Update transaction status based on resolution
    let newStatus = TransactionStatus.COMPLETED;
    if (dto.resolution === 'refunded') {
      newStatus = TransactionStatus.REFUNDED;
    }

    await this.supabaseService.getClient
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', dispute.transaction.id);

    // Process refund if refundAmount is defined and > 0
    if (dto.refundAmount !== undefined && dto.refundAmount > 0) {
      await this.processRefund(dispute.transaction.id, dto.refundAmount);
    }

    // Notify parties via websocket
    await this.websocketGateway.emitTransactionUpdate(dispute.transaction.id, {
      type: 'DISPUTE_RESOLVED',
      dispute: updatedDispute,
    });

    return updatedDispute;
  }

  async processRefund(transactionId: string, amount: number) {
    // Refund logic here
    // e.g., call payment provider's refund API, update DB, notify user

    this.logger.log(`Processing refund of amount ${amount} for transaction ${transactionId}`);
    // Example dummy implementation:
    await this.supabaseService.getClient
      .from('transactions')
      .update({ refund_amount: amount, refund_processed: true })
      .eq('id', transactionId);
  }
}
