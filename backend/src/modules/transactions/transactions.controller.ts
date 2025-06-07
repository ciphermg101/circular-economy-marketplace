import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from '@transactions/transactions.service';
import { CreateTransactionDto } from '@transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '@transactions/dto/update-transaction.dto';
import { OfferDto } from '@transactions/dto/offer.dto';
import { TransformResponseInterceptor } from '@common/interceptors/transform-response.interceptor';

@ApiTags('transactions')
@UseInterceptors(TransformResponseInterceptor)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiBearerAuth()
  async getTransaction(@Param('id') id: string) {
    return this.transactionsService.getTransaction(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto
  ) {
    return this.transactionsService.updateTransaction(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiBearerAuth()
  async deleteTransaction(@Param('id') id: string) {
    return this.transactionsService.deleteTransaction(id);
  }

  // Offers
  @Post('offers')
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createOffer(@Body() dto: OfferDto) {
    return this.transactionsService.createOffer(dto);
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get an offer by ID' })
  @ApiBearerAuth()
  async getOffer(@Param('id') id: string) {
    return this.transactionsService.getOffer(id);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update an offer status' })
  @ApiBearerAuth()
  async updateOffer(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.transactionsService.updateOffer(id, status);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Delete an offer' })
  @ApiBearerAuth()
  async deleteOffer(@Param('id') id: string) {
    return this.transactionsService.deleteOffer(id);
  }
} 