export interface PaymentRequest {
  recipient: string;
  amount: string;
  reference?: string;
  label?: string;
  message?: string;
}

export interface TransactionStatus {
  signature: string;
  confirmed: boolean;
  blockNumber?: number;
  timestamp?: number;
  error?: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
}

export type WebhookEvent = 
  | 'payment.created'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  maxPayments?: number;
}

export interface Subscription {
  id: string;
  planId: string;
  subscriber: string;
  startDate: Date;
  nextPaymentDate: Date;
  status: 'active' | 'cancelled' | 'completed';
  paymentsCompleted: number;
  maxPayments?: number;
}
