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

    // Create a payment request
    const request = {
      recipient: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Example address
      amount: '1.0',
      label: 'Coffee Shop',
      message: 'Thanks for your purchase!',
    };

    // Generate payment URL
    const paymentUrl = await peaqPay.createPaymentRequest(request);
    console.log('Payment URL:', paymentUrl);

    // Generate QR code
    const qrCode = await peaqPay.createQRCode(paymentUrl);
    console.log('QR Code (data URL):', qrCode);

    // If we have a wallet seed, we can also make a transfer
    if (process.env.WALLET_SEED) {
      const transaction = await peaqPay.transfer(request.recipient, request.amount);
      console.log('Transaction:', transaction);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await peaqPay.disconnect();
  }
}

main();
