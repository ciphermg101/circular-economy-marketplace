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
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  ProcessPaymentDto,
  TransactionStatus
} from '../../dtos/transaction.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  async createTransaction(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(req.user.id, dto);
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Process payment for a transaction' })
  async processPayment(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.transactionsService.processPayment(id, req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  async updateTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(req.user.id, id, dto);
  }

  @Post(':id/disputes')
  @ApiOperation({ summary: 'Create a dispute for a transaction' })
  async createDispute(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateDisputeDto
  ) {
    return this.transactionsService.createDispute(req.user.id, id, dto);
  }

  @Put('disputes/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resolve a dispute (Admin only)' })
  async resolveDispute(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto
  ) {
    return this.transactionsService.resolveDispute(req.user.id, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  async getTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.transactionsService.getTransaction(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiQuery({ name: 'role', enum: ['buyer', 'seller'], required: true })
  @ApiQuery({ name: 'status', enum: TransactionStatus, required: false })
  async getUserTransactions(
    @Request() req,
    @Query('role') role: 'buyer' | 'seller',
    @Query('status') status?: TransactionStatus
  ) {
    return this.transactionsService.getUserTransactions(req.user.id, role, status);
  }
} 