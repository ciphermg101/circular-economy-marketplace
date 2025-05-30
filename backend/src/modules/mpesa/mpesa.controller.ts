import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { MpesaService } from './mpesa.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('mpesa')
@Controller('mpesa')
@UseGuards(AuthGuard)
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('initiate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate STK push payment' })
  async initiatePayment(
    @Body() data: {
      phoneNumber: string;
      amount: number;
      accountReference: string;
    }
  ) {
    return this.mpesaService.initiatePayment(
      data.phoneNumber,
      data.amount,
      data.accountReference
    );
  }

  @Get('status/:checkoutRequestId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query transaction status' })
  async queryTransactionStatus(@Param('checkoutRequestId') checkoutRequestId: string) {
    return this.mpesaService.queryTransactionStatus(checkoutRequestId);
  }

  @Post('callback')
  @ApiOperation({ summary: 'M-Pesa callback endpoint' })
  async handleCallback(@Body() data: any) {
    return this.mpesaService.handleCallback(data);
  }
} 