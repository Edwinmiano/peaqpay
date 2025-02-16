import { PeaqPay, PEAQ_NETWORKS } from '../src';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize PeaqPay with Agung testnet
  const peaqPay = new PeaqPay(
    PEAQ_NETWORKS.AGUNG,
    process.env.WALLET_SEED
  );

  try {
    // Connect to the network
    await peaqPay.connect();

    // 1. Register a webhook for payment notifications
    peaqPay.registerWebhook('default', {
      url: 'https://your-server.com/webhook',
      secret: 'your-webhook-secret',
      events: ['payment.created', 'payment.confirmed', 'payment.failed'],
    });

    // 2. Create a subscription plan
    const plan = peaqPay.createSubscriptionPlan({
      name: 'Premium Plan',
      amount: '10.0',
      interval: 'monthly',
      maxPayments: 12, // 1 year subscription
    });
    console.log('Created subscription plan:', plan);

    // 3. Create a subscription for a user
    const subscription = await peaqPay.createSubscription(
      plan.id,
      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' // Example address
    );
    console.log('Created subscription:', subscription);

    // 4. Create a one-time payment request
    const request = {
      recipient: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      amount: '1.0',
      label: 'Coffee Shop',
      message: 'Thanks for your purchase!',
      reference: 'order-123',
    };

    // Generate payment URL and QR code
    const paymentUrl = await peaqPay.createPaymentRequest(request);
    console.log('Payment URL:', paymentUrl);

    const qrCode = await peaqPay.createQRCode(paymentUrl);
    console.log('QR Code (data URL):', qrCode);

    // 5. Make a payment and track its status
    const transaction = await peaqPay.transfer(request.recipient, request.amount);
    console.log('Transaction status:', transaction);

    // Check transaction status after a few seconds
    setTimeout(async () => {
      const status = peaqPay.getTransactionStatus(transaction.signature);
      console.log('Updated transaction status:', status);

      // Cancel the subscription (if needed)
      peaqPay.cancelSubscription(subscription.id);
      console.log('Subscription cancelled');

      // Cleanup
      await peaqPay.disconnect();
    }, 5000);

  } catch (error) {
    console.error('Error:', error);
    await peaqPay.disconnect();
  }
}

main();
