import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

interface Transaction {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
}

interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}

interface MpesaConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  passKey: string;
  shortCode: string;
  callbackUrl: string;
}

@Injectable()
export class MpesaService implements OnModuleInit {
  private config!: MpesaConfig;
  private readonly logger = new Logger(MpesaService.name);

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

  onModuleInit() {
    this.config = {
      baseUrl: this.configService.getOrThrow('MPESA_API_URL'),
      consumerKey: this.configService.getOrThrow('MPESA_CONSUMER_KEY'),
      consumerSecret: this.configService.getOrThrow('MPESA_CONSUMER_SECRET'),
      passKey: this.configService.getOrThrow('MPESA_PASSKEY'),
      shortCode: this.configService.getOrThrow('MPESA_SHORTCODE'),
      callbackUrl: this.configService.getOrThrow('MPESA_CALLBACK_URL')
    };
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
    const response = await axios.get(`${this.config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  }

  async initiatePayment(phoneNumber: string, amount: number, accountReference: string) {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.config.shortCode}${this.config.passKey}${timestamp}`).toString('base64');
    const accessToken = await this.getAccessToken();

    const response = await axios.post(
      `${this.config.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.config.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.config.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: 'Payment for order',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  }

  async queryTransactionStatus(checkoutRequestId: string) {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${this.config.shortCode}${this.config.passKey}${timestamp}`).toString('base64');

    const response = await axios.post(
      `${this.config.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: this.config.shortCode,
        Password: password,
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
  }

  async handleCallback(payload: any) {
    try {
      const { Body } = payload;
      if (!Body?.stkCallback) {
        throw new Error('Invalid callback data structure');
      }

      const { ResultCode, ResultDesc, CallbackMetadata, AccountReference } = Body.stkCallback;

      if (ResultCode === 0) {
        const { transactionId, amount, phoneNumber, transactionDate } = this.parseCallbackMetadata(CallbackMetadata.Item);

        const { data: transaction, error: transactionError } = await this.supabaseService.getClient
          .from('transactions')
          .select('*')
          .eq('id', AccountReference)
          .single();

        if (transactionError || !transaction) {
          throw new Error(`Failed to fetch transaction: ${transactionError?.message}`);
        }

        await this.supabaseService.getClient
          .from('transactions')
          .update({
            status: 'completed',
            payment_id: transactionId,
            payment_date: new Date(transactionDate).toISOString(),
            payment_details: {
              provider: 'mpesa',
              receipt_number: transactionId,
              phone_number: phoneNumber,
              amount: amount,
            },
          })
          .eq('id', AccountReference);

        await this.supabaseService.getClient
          .from('products')
          .update({
            status: 'sold',
          })
          .eq('id', transaction.product_id);

        await this.supabaseService.getClient
          .from('notifications')
          .insert([
            {
              user_id: transaction.seller_id,
              type: 'payment',
              title: 'Payment Received',
              message: `Payment of KES ${amount} received for order ${AccountReference}`,
              data: {
                transaction_id: AccountReference,
                amount: amount,
                receipt_number: transactionId,
              },
            },
            {
              user_id: transaction.buyer_id,
              type: 'payment',
              title: 'Payment Successful',
              message: `Your payment of KES ${amount} for order ${AccountReference} was successful`,
              data: {
                transaction_id: AccountReference,
                amount: amount,
                receipt_number: transactionId,
              },
            },
          ]);
      } else {
        const { data: transaction } = await this.supabaseService.getClient
          .from('transactions')
          .select('buyer_id')
          .eq('id', AccountReference)
          .single();

        if (transaction) {
          await this.supabaseService.getClient
            .from('notifications')
            .insert({
              user_id: transaction.buyer_id,
              type: 'payment',
              title: 'Payment Failed',
              message: `Payment for order ${AccountReference} failed: ${ResultDesc}`,
              data: {
                transaction_id: AccountReference,
                error: ResultDesc,
              },
            });
        }
      }
    } catch (error) {
      throw new Error(`Failed to process callback: ${error.message}`);
    }
  }

  private parseCallbackMetadata(metadata: CallbackMetadataItem[]): {
    transactionId: string;
    amount: number;
    phoneNumber: string;
    transactionDate: string;
  } {
    const getValue = (name: string) => {
      const item = metadata.find(item => item.Name === name);
      if (!item) {
        throw new Error(`Missing ${name} in callback metadata`);
      }
      return item.Value;
    };

    return {
      transactionId: String(getValue('MpesaReceiptNumber')),
      amount: Number(getValue('Amount')),
      phoneNumber: String(getValue('PhoneNumber')),
      transactionDate: String(getValue('TransactionDate')),
    };
  }
} 