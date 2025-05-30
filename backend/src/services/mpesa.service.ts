import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
import { RedisService } from '../modules/cache/redis.service';
import { MpesaResponse, MpesaCallbackResult } from '../types/common.types';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  environment: string;
  callbackUrl: string;
}

interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}

@Injectable()
export class MpesaService implements OnModuleInit {
  private readonly logger = new Logger(MpesaService.name);
  private config!: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService: MonitoringService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    try {
      this.config = {
        consumerKey: this.configService.getOrThrow<string>('mpesa.consumerKey'),
        consumerSecret: this.configService.getOrThrow<string>('mpesa.consumerSecret'),
        passKey: this.configService.getOrThrow<string>('mpesa.passkey'),
        shortCode: this.configService.getOrThrow<string>('mpesa.shortcode'),
        environment: this.configService.get<string>('mpesa.environment', 'sandbox'),
        callbackUrl: this.configService.getOrThrow<string>('mpesa.callbackUrl'),
      };

      this.baseUrl = this.config.environment === 'production'
        ? 'https://api.safaricom.com'
        : 'https://sandbox.safaricom.co.ke';

      await this.refreshAccessToken();
      this.logger.log('M-Pesa service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize M-Pesa service:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const cachedToken = await this.redisService.get('mpesa:access_token');
      if (cachedToken) {
        this.accessToken = cachedToken;
        return;
      }

      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await fetch(`${this.baseUrl}/oauth/v1/generate`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      if (!this.accessToken) {
        throw new Error('Access token is null after fetch');
      }

      await this.redisService.set('mpesa:access_token', this.accessToken);
      await this.redisService.expire('mpesa:access_token', data.expires_in - 60);

      this.monitoringService.captureEvent('mpesa_token_refreshed', {
        expiresIn: data.expires_in,
      });
    } catch (error) {
      this.logger.error('Error refreshing M-Pesa access token:', error);
      this.monitoringService.captureError(error, {
        module: 'mpesa',
        operation: 'refreshToken',
      });
      throw error;
    }
  }

  private async ensureValidToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.refreshAccessToken();
    }
    return this.accessToken!;
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string
  ): Promise<MpesaResponse> {
    try {
      const token = await this.ensureValidToken();

      if (!phoneNumber.match(/^254[0-9]{9}$/)) {
        throw new BadRequestException('Invalid phone number format');
      }
      if (amount < 1 || amount > 150000) {
        throw new BadRequestException('Amount must be between 1 and 150,000');
      }

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.config.shortCode}${this.config.passKey}${timestamp}`
      ).toString('base64');

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: this.config.shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: `${this.config.callbackUrl}/mpesa/callback`,
          AccountReference: reference,
          TransactionDesc: `Payment for ${reference}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errorMessage || 'Payment initiation failed');
      }

      this.monitoringService.captureEvent('mpesa_payment_initiated', {
        amount,
        reference,
        checkoutRequestId: data.CheckoutRequestID,
      });

      return {
        CheckoutRequestID: data.CheckoutRequestID,
        ResponseCode: data.ResponseCode,
        ResponseDescription: data.ResponseDescription,
        MerchantRequestID: data.MerchantRequestID,
        CustomerMessage: data.CustomerMessage,
      };
    } catch (error) {
      this.logger.error('Error initiating M-Pesa payment:', error);
      this.monitoringService.captureError(error, {
        module: 'mpesa',
        operation: 'initiatePayment',
      });
      throw error;
    }
  }

  async handleCallback(callbackData: any): Promise<MpesaCallbackResult> {
    try {
      const body = callbackData.Body.stkCallback;
      const resultCode = body.ResultCode;
      const resultDesc = body.ResultDesc;
      const merchantRequestID = body.MerchantRequestID;
      const checkoutRequestID = body.CheckoutRequestID;

      const metadata = body.CallbackMetadata?.Item || [];
      const getMetadataValue = (name: string): string | number | null => {
        const item = metadata.find((m: CallbackMetadataItem) => m.Name === name);
        return item ? item.Value : null;
      };

      const result: MpesaCallbackResult = {
        success: resultCode === 0,
        checkoutRequestId: checkoutRequestID,
        resultCode: resultCode.toString(),
        resultDesc,
      };

      if (resultCode === 0) {
        result.transactionId = getMetadataValue('MpesaReceiptNumber')?.toString();
        result.amount = Number(getMetadataValue('Amount'));
        result.phoneNumber = getMetadataValue('PhoneNumber')?.toString();
        result.date = getMetadataValue('TransactionDate')?.toString();
      }

      this.monitoringService.captureEvent('mpesa_callback_processed', {
        success: result.success,
        checkoutRequestId: result.checkoutRequestId,
      });

      return result;
    } catch (error) {
      this.logger.error('Error processing M-Pesa callback:', error);
      this.monitoringService.captureError(error, {
        module: 'mpesa',
        operation: 'handleCallback',
      });
      throw error;
    }
  }
}
