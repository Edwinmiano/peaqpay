import axios from 'axios';
import { WebhookConfig, WebhookEvent } from '../types';
import { generateWebhookSignature } from '../utils';

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig>;

  constructor() {
    this.webhooks = new Map();
  }

  registerWebhook(id: string, config: WebhookConfig): void {
    this.webhooks.set(id, config);
  }

  removeWebhook(id: string): void {
    this.webhooks.delete(id);
  }

  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  async notify(id: string, event: WebhookEvent, payload: any): Promise<void> {
    const config = this.webhooks.get(id);
    if (!config) {
      throw new Error(`Webhook ${id} not found`);
    }

    if (!config.events.includes(event)) {
      return; // Webhook not subscribed to this event
    }

    const signature = generateWebhookSignature(payload, config.secret);
    
    try {
      await axios.post(config.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-PeaqPay-Signature': signature,
          'X-PeaqPay-Event': event,
        },
      });
    } catch (error) {
      console.error(`Failed to send webhook ${id}:`, error);
      throw error;
    }
  }
}
