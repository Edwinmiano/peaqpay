# PeaqPay SDK

A comprehensive payment protocol built on top of the Peaq Network. PeaqPay enables easy integration of cryptocurrency payments into any application, with support for one-time payments, subscriptions, and advanced features.

## Features

- 🚀 Simple API for creating payment requests
- 📱 QR code generation for payment requests
- 💸 Direct token transfers with transaction tracking
- 🔄 Recurring payments and subscription management
- 🎯 Webhook notifications for payment events
- ⚡ Built on Peaq Network for fast and secure transactions
- 💰 Near-zero transaction fees

## Installation

```bash
npm install peaqpay
# or
yarn add peaqpay
```

## Quick Start

```typescript
import { PeaqPay, PEAQ_NETWORKS } from 'peaqpay';

// Initialize PeaqPay (read-only mode)
const peaqPay = new PeaqPay(PEAQ_NETWORKS.AGUNG);
await peaqPay.connect();

// Create a payment request
const request = {
  recipient: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  amount: '1.0',
  label: 'Coffee Shop',
  message: 'Thanks for your purchase!',
};

// Generate payment URL and QR code
const paymentUrl = await peaqPay.createPaymentRequest(request);
const qrCode = await peaqPay.createQRCode(paymentUrl);

// Don't forget to disconnect when done
await peaqPay.disconnect();
```

## Advanced Features

### 1. Transaction Tracking

Track the status of your transactions:

```typescript
const transaction = await peaqPay.transfer(recipient, amount);
console.log(transaction.signature); // Use this to track the transaction

// Check status later
const status = peaqPay.getTransactionStatus(transaction.signature);
console.log(status.confirmed); // true/false
```

### 2. Webhook Notifications

Get notified about payment events:

```typescript
peaqPay.registerWebhook('my-webhook', {
  url: 'https://my-server.com/webhook',
  secret: 'webhook-secret',
  events: ['payment.created', 'payment.confirmed', 'payment.failed'],
});
```

### 3. Subscription Management

Create and manage recurring payments:

```typescript
// Create a subscription plan
const plan = peaqPay.createSubscriptionPlan({
  name: 'Premium Plan',
  amount: '10.0',
  interval: 'monthly',
  maxPayments: 12, // Optional: limit number of payments
});

// Create a subscription for a user
const subscription = await peaqPay.createSubscription(
  plan.id,
  'subscriber-address'
);

// Cancel subscription if needed
peaqPay.cancelSubscription(subscription.id);
```

### 4. Payment Verification

Verify payments using transaction tracking:

```typescript
const status = peaqPay.getTransactionStatus(signature);
if (status.confirmed) {
  console.log('Payment confirmed in block:', status.blockNumber);
  console.log('Timestamp:', status.timestamp);
}
```

## Networks

PeaqPay supports both mainnet and testnet:

```typescript
PEAQ_NETWORKS.MAINNET // 'wss://wss.peaq.network'
PEAQ_NETWORKS.AGUNG   // 'wss://wss-async.agung.peaq.network'
```

For development and testing, use the Agung testnet.

## Security

When using PeaqPay with a wallet seed:

1. Never hardcode your seed phrase
2. Use environment variables (.env file) to store sensitive data
3. Keep your seed phrase secure and never share it
4. For production, implement proper key management solutions
5. Use webhook signatures to verify webhook authenticity

## Error Handling

PeaqPay provides detailed error information:

```typescript
try {
  await peaqPay.transfer(recipient, amount);
} catch (error) {
  console.error('Transfer failed:', error.message);
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Code structure

peaqpay/
├── src/
│   ├── services/
│   │   ├── TransactionTracker.ts
│   │   ├── WebhookManager.ts
│   │   └── SubscriptionManager.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   └── index.ts
├── examples/
│   ├── simple-payment.ts
│   └── advanced-features.ts
├── package.json
└── README.md

## How PeaqPay Works

PeaqPay is built on top of the Peaq Network, a decentralized network for payment and data storage.

## Basic Payment Flow

Merchant                    PeaqPay SDK                    Customer
┌──────┐                   ┌─────────┐                    ┌────────┐
│      │─── Create ───────>│ Payment │──── QR Code ─────>│        │
│      │    Request        │ Request │     or URL        │        │
│      │                   └─────────┘                    │        │
│      │                        │                         │        │
│      │<─── Webhook ──────────┤<─── Make Payment ───────│        │
│      │  Notification         │     via Peaq Network    │        │
└──────┘                       └─────────────────────────└────────┘


Key Components: 

a. Payment Creation

Merchant creates a payment request with amount and details
SDK generates a payment URL and QR code
Customer can scan QR code or click URL to pay

b. Transaction Processing


// Merchant side
const request = {
  recipient: 'merchant-address',
  amount: '10.0',
  label: 'Coffee Shop',
  message: 'Payment for coffee'
};
const paymentUrl = await peaqPay.createPaymentRequest(request);


c. Payment Verification

SDK automatically tracks transaction status
Confirms when payment is included in a block
Notifies merchant through webhooks


## Subscription System


- Create a subscription plan
- Create a subscription for a user
- Cancel subscription if needed
- Verify payments using transaction tracking

┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
│ Create Plan  │────>│ User Subscribes │────>│ Recurring     │
│ (Merchant)   │     │                 │     │ Payments      │
└──────────────┘     └─────────────────┘     └───────┬───────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ Auto-payment    │
                                            │ via Cron Jobs   │
                                            └─────────────────┘

## Webhook System

PeaqPay SDK                      Merchant Server
┌──────────┐  Payment Event      ┌──────────────┐
│          │──────────────────-->│              │
│          │  (Signed Payload)   │              │
│          │                     │              │
│          │<────────────────────│              │
│          │    (200 OK)         │              │
└──────────┘                     └──────────────┘


## Integration Example:


// 1. Initialize SDK
const peaqPay = new PeaqPay(PEAQ_NETWORKS.AGUNG);
await peaqPay.connect();

// 2. Set up webhook for notifications
peaqPay.registerWebhook('store-webhook', {
  url: 'https://mystore.com/payments/webhook',
  secret: 'webhook-secret',
  events: ['payment.confirmed']
});

// 3. Create subscription plan (for recurring payments)
const plan = peaqPay.createSubscriptionPlan({
  name: 'Monthly Service',
  amount: '50.0',
  interval: 'monthly'
});

// 4. Process one-time payment
const payment = await peaqPay.transfer(
  'customer-address',
  '10.0'
);

// 5. Track payment status
const status = peaqPay.getTransactionStatus(payment.signature);

## License

MIT License
