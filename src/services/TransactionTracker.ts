import { TransactionStatus } from '../types';
import { sleep } from '../utils';

export class TransactionTracker {
  private transactions: Map<string, TransactionStatus>;
  private sdk: any;

  constructor(sdk: any) {
    this.transactions = new Map();
    this.sdk = sdk;
  }

  async track(signature: string): Promise<TransactionStatus> {
    this.transactions.set(signature, {
      signature,
      confirmed: false,
    });

    try {
      // Poll for transaction confirmation
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts with 2s delay = 1 minute max wait

      while (!confirmed && attempts < maxAttempts) {
        // Check transaction status using Peaq SDK
        const status = await this.sdk.getTransaction(signature);
        
        if (status && status.blockNumber) {
          confirmed = true;
          const txStatus: TransactionStatus = {
            signature,
            confirmed: true,
            blockNumber: status.blockNumber,
            timestamp: Date.now(),
          };
          this.transactions.set(signature, txStatus);
          return txStatus;
        }

        await sleep(2000); // Wait 2 seconds before next attempt
        attempts++;
      }

      if (!confirmed) {
        throw new Error('Transaction confirmation timeout');
      }
    } catch (error) {
      const errorStatus: TransactionStatus = {
        signature,
        confirmed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.transactions.set(signature, errorStatus);
      throw error;
    }

    return this.getStatus(signature);
  }

  getStatus(signature: string): TransactionStatus {
    const status = this.transactions.get(signature);
    if (!status) {
      throw new Error(`Transaction ${signature} not found`);
    }
    return status;
  }
}
