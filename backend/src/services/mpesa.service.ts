import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as moment from 'moment';

export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('mpesaConfig.environment') === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const consumerKey = this.configService.get('mpesaConfig.consumerKey');
    const consumerSecret = this.configService.get('mpesaConfig.consumerSecret');

    try {
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      this.accessToken = response.data.access_token;
      // Token expires in 1 hour, we'll cache it for 55 minutes
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Error getting M-Pesa access token:', error);
      throw error;
    }
  }

  private generatePassword(): string {
    const shortcode = this.configService.get('mpesaConfig.shortcode');
    const passkey = this.configService.get('mpesaConfig.passkey');
    const timestamp = moment().format('YYYYMMDDHHmmss');
    
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    return password;
  }

  async initiateSTKPush(data: STKPushRequest) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = moment().format('YYYYMMDDHHmmss');
      const shortcode = this.configService.get('mpesaConfig.shortcode');
      const callbackUrl = this.configService.get('mpesaConfig.callbackUrl');

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: shortcode,
          Password: this.generatePassword(),
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(data.amount),
          PartyA: data.phoneNumber,
          PartyB: shortcode,
          PhoneNumber: data.phoneNumber,
          CallBackURL: callbackUrl,
          AccountReference: data.accountReference,
          TransactionDesc: data.transactionDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error initiating STK push:', error);
      throw error;
    }
  }

  async queryTransactionStatus(checkoutRequestId: string) {
    try {
      const accessToken = await this.getAccessToken();
      const shortcode = this.configService.get('mpesaConfig.shortcode');
      const timestamp = moment().format('YYYYMMDDHHmmss');

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: shortcode,
          Password: this.generatePassword(),
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error querying transaction status:', error);
      throw error;
    }
  }

  // Handle M-Pesa callback
  async handleCallback(callbackData: any) {
    try {
      const { Body } = callbackData;
      if (!Body.stkCallback) {
        throw new Error('Invalid callback data');
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata,
      } = Body.stkCallback;

      // If the transaction was successful
      if (ResultCode === 0) {
        const metadata = this.parseCallbackMetadata(CallbackMetadata);
        return {
          success: true,
          transactionId: metadata.MpesaReceiptNumber,
          amount: metadata.Amount,
          phoneNumber: metadata.PhoneNumber,
          date: metadata.TransactionDate,
          checkoutRequestId: CheckoutRequestID,
          merchantRequestId: MerchantRequestID,
        };
      }

      return {
        success: false,
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      };
    } catch (error) {
      this.logger.error('Error handling M-Pesa callback:', error);
      throw error;
    }
  }

  private parseCallbackMetadata(metadata: any) {
    const result: any = {};
    if (metadata && metadata.Item) {
      metadata.Item.forEach((item: any) => {
        result[item.Name] = item.Value;
      });
    }
    return result;
  }
} 