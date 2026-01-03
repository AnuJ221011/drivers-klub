import axios, { AxiosInstance } from 'axios';
import {
  InitiatePaymentRequest,
  PaymentResponse,
  CreatePayoutRequest,
  PayoutResponse,
  CreateVirtualAccountRequest,
  VirtualAccountResponse,
  PaymentWebhookPayload,
  VirtualAccountWebhookPayload,
} from './easebuzz.types.js';
import {
  generatePaymentHash,
  generatePayoutHash,
  generateVirtualAccountHash,
  verifyPaymentWebhookHash,
  verifyVirtualAccountWebhookHash,
  generateTransactionId,
  formatAmount,
  parseAmount,
} from './easebuzz.utils.js';

export class EasebuzzAdapter {
  private client: AxiosInstance;
  private merchantKey: string;
  private saltKey: string;
  private environment: 'test' | 'production';

  constructor() {
    this.merchantKey = process.env.EASEBUZZ_MERCHANT_KEY || '';
    this.saltKey = process.env.EASEBUZZ_SALT_KEY || '';
    this.environment = (process.env.EASEBUZZ_ENV as 'test' | 'production') || 'test';

    const baseURL =
      this.environment === 'production'
        ? 'https://pay.easebuzz.in'
        : 'https://testpay.easebuzz.in';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (!this.merchantKey || !this.saltKey) {
      throw new Error('Easebuzz credentials not configured. Set EASEBUZZ_MERCHANT_KEY and EASEBUZZ_SALT_KEY');
    }
  }

  // ============================================
  // PAYMENT GATEWAY (Payment In)
  // ============================================

  /**
   * Initiate a payment transaction
   * Used for: Deposits, Rentals, Penalties
   */
  async initiatePayment(params: {
    amount: number;
    productInfo: string;
    firstName: string;
    phone: string;
    email: string;
    successUrl: string;
    failureUrl: string;
    udf1?: string; // driverId
    udf2?: string; // transactionType
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }): Promise<{ paymentUrl: string; txnId: string }> {
    const txnId = generateTransactionId();
    const amountStr = formatAmount(params.amount);

    const hash = generatePaymentHash({
      key: this.merchantKey,
      txnid: txnId,
      amount: amountStr,
      productinfo: params.productInfo,
      firstname: params.firstName,
      email: params.email,
      udf1: params.udf1,
      udf2: params.udf2,
      udf3: params.udf3,
      udf4: params.udf4,
      udf5: params.udf5,
      salt: this.saltKey,
    });

    const requestData: InitiatePaymentRequest = {
      key: this.merchantKey,
      txnid: txnId,
      amount: amountStr,
      productinfo: params.productInfo,
      firstname: params.firstName,
      phone: params.phone,
      email: params.email,
      surl: params.successUrl,
      furl: params.failureUrl,
      hash,
      udf1: params.udf1,
      udf2: params.udf2,
      udf3: params.udf3,
      udf4: params.udf4,
      udf5: params.udf5,
    };

    try {
      const response = await this.client.post<PaymentResponse>(
        '/payment/initiateLink',
        requestData
      );

      if (response.data.status === 1) {
        return {
          paymentUrl: response.data.data,
          txnId,
        };
      } else {
        throw new Error(`Payment initiation failed: ${response.data.data}`);
      }
    } catch (error: any) {
      throw new Error(`Easebuzz payment initiation error: ${error.message}`);
    }
  }

  /**
   * Verify payment webhook
   */
  verifyPaymentWebhook(webhookData: PaymentWebhookPayload): boolean {
    return verifyPaymentWebhookHash(webhookData, this.saltKey);
  }

  // ============================================
  // PAYOUTS (Payment Out)
  // ============================================

  /**
   * Create a payout to driver
   * Used for: Incentives, Revenue Share
   */
  async createPayout(params: {
    amount: number;
    beneficiaryName: string;
    beneficiaryAccount: string;
    beneficiaryIfsc: string;
    purpose: string;
    transferMode?: 'NEFT' | 'RTGS' | 'IMPS';
    email?: string;
    phone?: string;
  }): Promise<{
    txnId: string;
    easebuzzTxnId: string;
    status: string;
    utr?: string;
  }> {
    const merchantTxnId = generateTransactionId();
    const amountStr = formatAmount(params.amount);

    const hash = generatePayoutHash({
      merchant_key: this.merchantKey,
      merchant_txn_id: merchantTxnId,
      amount: amountStr,
      salt: this.saltKey,
    });

    const requestData: CreatePayoutRequest = {
      merchant_key: this.merchantKey,
      merchant_txn_id: merchantTxnId,
      beneficiary_name: params.beneficiaryName,
      beneficiary_account: params.beneficiaryAccount,
      beneficiary_ifsc: params.beneficiaryIfsc,
      amount: amountStr,
      purpose: params.purpose,
      transfer_mode: params.transferMode || 'IMPS',
      hash,
      email: params.email,
      phone: params.phone,
    };

    try {
      const response = await this.client.post<PayoutResponse>(
        '/payout/v1/create',
        requestData,
        {
          baseURL:
            this.environment === 'production'
              ? 'https://api.easebuzz.in'
              : 'https://testapi.easebuzz.in',
        }
      );

      if (response.data.status === 1) {
        return {
          txnId: merchantTxnId,
          easebuzzTxnId: response.data.data.txn_id,
          status: response.data.data.status,
          utr: response.data.data.utr,
        };
      } else {
        throw new Error(`Payout creation failed: ${response.data.msg}`);
      }
    } catch (error: any) {
      throw new Error(`Easebuzz payout error: ${error.message}`);
    }
  }

  /**
   * Check payout status
   */
  async getPayoutStatus(merchantTxnId: string): Promise<{
    status: string;
    utr?: string;
    amount?: number;
  }> {
    const hash = generatePayoutHash({
      merchant_key: this.merchantKey,
      merchant_txn_id: merchantTxnId,
      amount: '0', // Not required for status check
      salt: this.saltKey,
    });

    try {
      const response = await this.client.post(
        '/payout/v1/status',
        {
          merchant_key: this.merchantKey,
          merchant_txn_id: merchantTxnId,
          hash,
        },
        {
          baseURL:
            this.environment === 'production'
              ? 'https://api.easebuzz.in'
              : 'https://testapi.easebuzz.in',
        }
      );

      if (response.data.status === 1) {
        return {
          status: response.data.data.status,
          utr: response.data.data.utr,
          amount: response.data.data.amount
            ? parseAmount(response.data.data.amount)
            : undefined,
        };
      } else {
        throw new Error(`Payout status check failed: ${response.data.msg}`);
      }
    } catch (error: any) {
      throw new Error(`Easebuzz payout status error: ${error.message}`);
    }
  }

  // ============================================
  // VIRTUAL ACCOUNTS (InstaCollect)
  // ============================================

  /**
   * Create a virtual account for vehicle QR code
   */
  async createVirtualAccount(params: {
    vehicleNumber: string;
    vehicleId: string;
    fleetName: string;
    customerMobile: string;
    customerEmail: string;
  }): Promise<{
    virtualAccountId: string;
    virtualAccountNumber: string;
    ifscCode: string;
    qrCodeBase64: string;
    upiId: string;
  }> {
    const hash = generateVirtualAccountHash({
      merchant_key: this.merchantKey,
      virtual_account_name: params.vehicleNumber,
      customer_name: params.fleetName,
      customer_mobile: params.customerMobile,
      customer_email: params.customerEmail,
      udf1: params.vehicleId,
      salt: this.saltKey,
    });

    const requestData: CreateVirtualAccountRequest = {
      merchant_key: this.merchantKey,
      virtual_account_name: params.vehicleNumber,
      customer_name: params.fleetName,
      customer_mobile: params.customerMobile,
      customer_email: params.customerEmail,
      udf1: params.vehicleId,
      hash,
    };

    try {
      const response = await this.client.post<VirtualAccountResponse>(
        '/instacollect/v1/create',
        requestData,
        {
          baseURL:
            this.environment === 'production'
              ? 'https://api.easebuzz.in'
              : 'https://testapi.easebuzz.in',
        }
      );

      if (response.data.status === 1) {
        return {
          virtualAccountId: response.data.data.virtual_account_id,
          virtualAccountNumber: response.data.data.virtual_account_number,
          ifscCode: response.data.data.ifsc_code,
          qrCodeBase64: response.data.data.qr_code,
          upiId: response.data.data.upi_id,
        };
      } else {
        throw new Error(`Virtual account creation failed: ${response.data.msg}`);
      }
    } catch (error: any) {
      throw new Error(`Easebuzz virtual account error: ${error.message}`);
    }
  }

  /**
   * Verify virtual account webhook
   */
  verifyVirtualAccountWebhook(webhookData: VirtualAccountWebhookPayload): boolean {
    return verifyVirtualAccountWebhookHash(webhookData, this.saltKey);
  }

  /**
   * Get virtual account transactions
   */
  async getVirtualAccountTransactions(
    virtualAccountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    const hash = generateVirtualAccountHash({
      merchant_key: this.merchantKey,
      virtual_account_name: virtualAccountId,
      customer_name: '',
      customer_mobile: '',
      customer_email: '',
      salt: this.saltKey,
    });

    try {
      const response = await this.client.post(
        '/instacollect/v1/transactions',
        {
          merchant_key: this.merchantKey,
          virtual_account_id: virtualAccountId,
          start_date: startDate,
          end_date: endDate,
          hash,
        },
        {
          baseURL:
            this.environment === 'production'
              ? 'https://api.easebuzz.in'
              : 'https://testapi.easebuzz.in',
        }
      );

      if (response.data.status === 1) {
        return response.data.data.transactions || [];
      } else {
        throw new Error(`Failed to fetch transactions: ${response.data.msg}`);
      }
    } catch (error: any) {
      throw new Error(`Easebuzz transaction fetch error: ${error.message}`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get merchant key (for frontend integration)
   */
  getMerchantKey(): string {
    return this.merchantKey;
  }

  /**
   * Get environment
   */
  getEnvironment(): 'test' | 'production' {
    return this.environment;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simple health check - try to get merchant details
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const easebuzzAdapter = new EasebuzzAdapter();
