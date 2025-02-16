import { createHmac } from 'crypto';
import { WebhookConfig } from '../types';

export function validateAddress(address: string): boolean {
  // Basic Peaq address validation (this should be enhanced based on Peaq's actual address format)
  return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address);
}

export function calculateNextPaymentDate(
  startDate: Date,
  interval: string,
  paymentsCompleted: number
): Date {
  const date = new Date(startDate);
  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + paymentsCompleted + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (paymentsCompleted + 1) * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + paymentsCompleted + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + paymentsCompleted + 1);
      break;
    default:
      throw new Error(`Invalid interval: ${interval}`);
  }
  return date;
}

export function generateWebhookSignature(payload: any, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

export function verifyWebhookSignature(
  payload: any,
  signature: string,
  config: WebhookConfig
): boolean {
  const expectedSignature = generateWebhookSignature(payload, config.secret);
  return signature === expectedSignature;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
