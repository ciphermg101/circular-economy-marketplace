import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  Delete,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  ProcessPaymentDto,
  TransactionStatus,
  MpesaCallbackResult
} from '../../dtos/transaction.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../types/request.types';
import { MonitoringService } from '../../services/monitoring.service';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe())
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateTransactionDto) {
    try {
      const transaction = await this.transactionsService.create(req.user.id, dto);
      
      this.monitoringService.captureEvent('transaction_created', {
        userId: req.user.id,
        transactionId: transaction.id,
        amount: transaction.amount,
      });

      return transaction;
    } catch (error) {
      this.logger.error('Error creating transaction:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'create',
        userId: req.user.id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiQuery({ name: 'role', enum: ['buyer', 'seller'], required: true })
  @ApiQuery({ name: 'status', enum: TransactionStatus, required: false })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('role') role: 'buyer' | 'seller',
    @Query('status') status?: TransactionStatus,
  ) {
    try {
      if (!role || !['buyer', 'seller'].includes(role)) {
        throw new BadRequestException('Invalid role specified');
      }

      const transactions = await this.transactionsService.findAll(req.user.id);
      
      this.monitoringService.captureEvent('transactions_listed', {
        userId: req.user.id,
        role,
        status,
        count: transactions.length,
      });

      return transactions;
    } catch (error) {
      this.logger.error('Error fetching transactions:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'findAll',
        userId: req.user.id,
        role,
        status,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  async findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Transaction ID is required');
      }

      const transaction = await this.transactionsService.findOne(req.user.id, id);
      
      this.monitoringService.captureEvent('transaction_viewed', {
        userId: req.user.id,
        transactionId: id,
      });

      return transaction;
    } catch (error) {
      this.logger.error('Error fetching transaction:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'findOne',
        userId: req.user.id,
        transactionId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch transaction');
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Transaction ID is required');
      }

      const transaction = await this.transactionsService.update(req.user.id, id, dto);
      
      this.monitoringService.captureEvent('transaction_updated', {
        userId: req.user.id,
        transactionId: id,
        updates: Object.keys(dto),
      });

      return transaction;
    } catch (error) {
      this.logger.error('Error updating transaction:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'update',
        userId: req.user.id,
        transactionId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a transaction' })
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    try {
      const result = await this.transactionsService.remove(req.user.id, id);

      this.monitoringService.captureEvent('transaction_removed', {
        userId: req.user.id,
        transactionId: id,
      });

      return result;
    } catch (error) {
      this.logger.error('Error deleting transaction:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'remove',
        userId: req.user.id,
        transactionId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Process payment for a transaction' })
  async processPayment(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Transaction ID is required');
      }

      const result = await this.transactionsService.processPayment(req.user.id, id, dto);
      
      this.monitoringService.captureEvent('payment_processed', {
        userId: req.user.id,
        transactionId: id,
        amount: dto.amount,
      });

      return result;
    } catch (error) {
      this.logger.error('Error processing payment:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'processPayment',
        userId: req.user.id,
        transactionId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process payment');
    }
  }

  @Post(':id/disputes')
  @ApiOperation({ summary: 'Create a dispute for a transaction' })
  async createDispute(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateDisputeDto
  ) {
    try {
      const dispute = await this.transactionsService.createDispute(req.user.id, id, dto);

      this.monitoringService.captureEvent('dispute_created', {
        userId: req.user.id,
        transactionId: id,
        disputeId: dispute.id,
      });

      return dispute;
    } catch (error) {
      this.logger.error('Error creating dispute:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'createDispute',
        userId: req.user.id,
        transactionId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create dispute');
    }
  }

  @Put('disputes/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resolve a dispute (Admin only)' })
  async resolveDispute(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto
  ) {
    try {
      const result = await this.transactionsService.resolveDispute(req.user.id, id, dto);

      this.monitoringService.captureEvent('dispute_resolved', {
        adminId: req.user.id,
        disputeId: id,
        resolution: dto.resolution,
      });

      return result;
    } catch (error) {
      this.logger.error('Error resolving dispute:', error);
      this.monitoringService.captureError(error, {
        module: 'transactions',
        operation: 'resolveDispute',
        adminId: req.user.id,
        disputeId: id,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to resolve dispute');
    }
  }

  @Post('mpesa/callback')
  @ApiOperation({ summary: 'Mpesa payment callback endpoint' })
  async mpesaCallback(@Body() callbackResult: MpesaCallbackResult) {
    try {
      await this.transactionsService.handleMpesaCallback(callbackResult);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing Mpesa callback:', error);
      throw new InternalServerErrorException('Failed to process Mpesa callback');
    }
  }
}
