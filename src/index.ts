import { Sdk } from '@peaq-network/sdk';
import QRCode from 'qrcode';
import BigNumber from 'bignumber.js';
import { TransactionTracker } from './services/TransactionTracker';
import { WebhookManager } from './services/WebhookManager';
import { SubscriptionManager } from './services/SubscriptionManager';
import {
  PaymentRequest,
  TransactionStatus,
  WebhookConfig,
  SubscriptionPlan,
  Subscription
} from './types';
import { validateAddress } from './utils';

export class PeaqPay {
  private sdk: any;
  private baseUrl: string;
  private seed?: string;
  private transactionTracker!: TransactionTracker;
  private webhookManager: WebhookManager;
  private subscriptionManager!: SubscriptionManager;

  constructor(baseUrl: string, seed?: string) {
    this.baseUrl = baseUrl;
    this.seed = seed;
    this.webhookManager = new WebhookManager();
  }

  async connect() {
    try {
      this.sdk = await Sdk.createInstance({
        baseUrl: this.baseUrl,
        seed: this.seed,
      });
      await this.sdk.connect();
      
      // Initialize services after SDK connection
      this.transactionTracker = new TransactionTracker(this.sdk);
      this.subscriptionManager = new SubscriptionManager(this);
      
      return this;
    } catch (error) {
      console.error('Failed to connect to Peaq Network:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.sdk) {
      await this.sdk.disconnect();
    }
  }

  async createPaymentRequest(request: PaymentRequest): Promise<string> {
    if (!validateAddress(request.recipient)) {
      throw new Error('Invalid recipient address');
    }

    const url = new URL('peaqpay:');
    url.searchParams.set('recipient', request.recipient);
    url.searchParams.set('amount', request.amount);
    
    if (request.reference) {
      url.searchParams.set('reference', request.reference);
    }
    if (request.label) {
      url.searchParams.set('label', request.label);
    }
    if (request.message) {
      url.searchParams.set('message', request.message);
    }

    // Notify webhooks about payment request creation
    await this.notifyWebhooks('payment.created', {
      recipient: request.recipient,
      amount: request.amount,
      reference: request.reference,
      timestamp: Date.now(),
    });

    return url.toString();
  }

  async createQRCode(paymentRequest: string): Promise<string> {
    try {
      return await QRCode.toDataURL(paymentRequest);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  async transfer(recipient: string, amount: string): Promise<TransactionStatus> {
    if (!this.sdk) {
      throw new Error('SDK not connected. Call connect() first.');
    }

    try {
      // Convert amount to proper format
      const value = new BigNumber(amount);
      
      // Create and send transaction
      const transaction = await this.sdk.token.transfer({
        to: recipient,
        value: value.toString(),
      });

      // Start tracking the transaction
      const status = await this.transactionTracker.track(transaction.hash);

      // Notify webhooks about payment status
      if (status.confirmed) {
        await this.notifyWebhooks('payment.confirmed', {
          signature: status.signature,
          recipient,
          amount,
          blockNumber: status.blockNumber,
          timestamp: status.timestamp,
        });
      } else if (status.error) {
        await this.notifyWebhooks('payment.failed', {
          signature: status.signature,
          recipient,
          amount,
          error: status.error,
          timestamp: Date.now(),
        });
      }

      return status;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  // Transaction Tracking
  getTransactionStatus(signature: string): TransactionStatus {
    return this.transactionTracker.getStatus(signature);
  }

  // Webhook Management
  registerWebhook(id: string, config: WebhookConfig): void {
    this.webhookManager.registerWebhook(id, config);
  }

  getRegisteredWebhooks(): WebhookConfig[] {
    return this.webhookManager.getWebhooks();
  }

  removeWebhook(id: string): void {
    this.webhookManager.removeWebhook(id);
  }

  private async notifyWebhooks(event: any, payload: any): Promise<void> {
    try {
      await this.webhookManager.notify('default', event, payload);
    } catch (error) {
      console.error('Failed to notify webhooks:', error);
    }
  }

  // Subscription Management
  createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    return this.subscriptionManager.createPlan(plan);
  }

  async createSubscription(planId: string, subscriber: string): Promise<Subscription> {
    return this.subscriptionManager.createSubscription(planId, subscriber);
  }

  cancelSubscription(id: string): void {
    this.subscriptionManager.cancelSubscription(id);
  }

  getSubscription(id: string): Subscription | undefined {
    return this.subscriptionManager.getSubscription(id);
  }
}

// Export types and constants
export * from './types';
export const PEAQ_NETWORKS = {
  MAINNET: 'wss://wss.peaq.network',
  AGUNG: 'wss://wss-async.agung.peaq.network',
};
