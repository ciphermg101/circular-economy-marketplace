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
import { MpesaService, STKPushRequest } from '../../services/mpesa.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('mpesa')
@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate STK push payment' })
  async initiateSTKPush(@Body() data: STKPushRequest) {
    if (!data.phoneNumber.startsWith('254')) {
      throw new BadRequestException('Phone number must start with 254');
    }
    return this.mpesaService.initiateSTKPush(data);
  }

  @Get('status/:checkoutRequestId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query transaction status' })
  async queryTransactionStatus(@Param('checkoutRequestId') checkoutRequestId: string) {
    return this.mpesaService.queryTransactionStatus(checkoutRequestId);
  }

  @Post('callback')
  @ApiOperation({ summary: 'M-Pesa callback endpoint' })
  async handleCallback(@Body() callbackData: any) {
    return this.mpesaService.handleCallback(callbackData);
  }
} 