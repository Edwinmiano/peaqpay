import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { Subscription, SubscriptionPlan } from '../types';
import { calculateNextPaymentDate } from '../utils';
import { PeaqPay } from '..';

export class SubscriptionManager {
  private subscriptions: Map<string, Subscription>;
  private plans: Map<string, SubscriptionPlan>;
  private peaqPay: PeaqPay;
  private cronJobs: Map<string, cron.ScheduledTask>;

  constructor(peaqPay: PeaqPay) {
    this.subscriptions = new Map();
    this.plans = new Map();
    this.peaqPay = peaqPay;
    this.cronJobs = new Map();
  }

  createPlan(plan: Omit<SubscriptionPlan, 'id'>): SubscriptionPlan {
    const id = uuidv4();
    const newPlan: SubscriptionPlan = { ...plan, id };
    this.plans.set(id, newPlan);
    return newPlan;
  }

  async createSubscription(
    planId: string,
    subscriber: string
  ): Promise<Subscription> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const startDate = new Date();
    const subscription: Subscription = {
      id: uuidv4(),
      planId,
      subscriber,
      startDate,
      nextPaymentDate: calculateNextPaymentDate(startDate, plan.interval, 0),
      status: 'active',
      paymentsCompleted: 0,
      maxPayments: plan.maxPayments,
    };

    // Schedule the recurring payment
    this.scheduleNextPayment(subscription);

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  private scheduleNextPayment(subscription: Subscription): void {
    // Cancel existing cron job if any
    const existingJob = this.cronJobs.get(subscription.id);
    if (existingJob) {
      existingJob.stop();
    }

    const plan = this.plans.get(subscription.planId);
    if (!plan || subscription.status !== 'active') {
      return;
    }

    // Schedule next payment
    const nextPayment = subscription.nextPaymentDate;
    const cronExpression = `${nextPayment.getMinutes()} ${nextPayment.getHours()} ${nextPayment.getDate()} ${nextPayment.getMonth() + 1} *`;

    const job = cron.schedule(cronExpression, async () => {
      try {
        // Process payment
        await this.peaqPay.transfer(subscription.subscriber, plan.amount);
        
        // Update subscription
        subscription.paymentsCompleted++;
        subscription.nextPaymentDate = calculateNextPaymentDate(
          subscription.startDate,
          plan.interval,
          subscription.paymentsCompleted
        );

        // Check if subscription is completed
        if (subscription.maxPayments && subscription.paymentsCompleted >= subscription.maxPayments) {
          subscription.status = 'completed';
          job.stop();
        } else {
          // Schedule next payment
          this.scheduleNextPayment(subscription);
        }

        this.subscriptions.set(subscription.id, subscription);
      } catch (error) {
        console.error(`Failed to process subscription payment ${subscription.id}:`, error);
      }
    });

    this.cronJobs.set(subscription.id, job);
  }

  cancelSubscription(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error(`Subscription ${id} not found`);
    }

    subscription.status = 'cancelled';
    this.subscriptions.set(id, subscription);

    // Stop the cron job
    const job = this.cronJobs.get(id);
    if (job) {
      job.stop();
      this.cronJobs.delete(id);
    }
  }

  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  getPlan(id: string): SubscriptionPlan | undefined {
    return this.plans.get(id);
  }
}
