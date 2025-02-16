import { PeaqPay, PEAQ_NETWORKS } from '../index';
import nock from 'nock';
import { WebhookEvent } from '../types';

describe('PeaqPay', () => {
  let peaqPay: PeaqPay;

  beforeEach(async () => {
    peaqPay = new PeaqPay(PEAQ_NETWORKS.AGUNG);
    await peaqPay.connect();

    // Register a default webhook for notifications
    peaqPay.registerWebhook('default', {
      url: 'https://test.com/webhook',
      secret: 'test-secret',
      events: ['payment.created' as WebhookEvent, 'payment.confirmed' as WebhookEvent]
    });

    // Mock webhook endpoint
    nock('https://test.com')
      .post('/webhook')
      .reply(200);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('Payment Request Creation', () => {
    it('should create a valid payment request URL', async () => {
      const request = {
        recipient: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        amount: '1.0',
        label: 'Test Payment',
        message: 'Test transaction',
      };

      const paymentUrl = await peaqPay.createPaymentRequest(request);
      expect(paymentUrl).toContain('peaqpay:');
      expect(paymentUrl).toContain(request.recipient);
      expect(paymentUrl).toContain(request.amount);
    });

    it('should generate a valid QR code', async () => {
      const paymentUrl = 'peaqpay:test';
      const qrCode = await peaqPay.createQRCode(paymentUrl);
      expect(qrCode).toContain('data:image/png;base64,');
    });
  });

  describe('Transaction Processing', () => {
    it('should process a transfer', async () => {
      const result = await peaqPay.transfer(
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        '1.0'
      );

      expect(result).toBeDefined();
      expect(result.signature).toBe('test-hash');
    });

    it('should track transaction status', async () => {
      // First create a transaction
      const result = await peaqPay.transfer(
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        '1.0'
      );

      const status = await peaqPay.getTransactionStatus(result.signature);
      expect(status.confirmed).toBe(true);
      expect(status.blockNumber).toBe(12345);
    });
  });

  describe('Webhook Management', () => {
    it('should register webhooks', () => {
      const webhookConfig = {
        url: 'https://test.com/webhook2',
        secret: 'test-secret',
        events: ['payment.created' as WebhookEvent]
      };

      peaqPay.registerWebhook('test', webhookConfig);
      const webhooks = peaqPay.getRegisteredWebhooks();
      expect(webhooks).toHaveLength(2); // Including the default webhook
      expect(webhooks.find(w => w.url === webhookConfig.url)).toBeDefined();
    });
  });
});
