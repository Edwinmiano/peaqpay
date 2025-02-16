import { SubscriptionManager } from '../services/SubscriptionManager';
import { PeaqPay, PEAQ_NETWORKS } from '../index';

describe('SubscriptionManager', () => {
  let subscriptionManager: SubscriptionManager;
  let peaqPay: PeaqPay;

  beforeEach(async () => {
    peaqPay = new PeaqPay(PEAQ_NETWORKS.AGUNG);
    await peaqPay.connect();
    subscriptionManager = new SubscriptionManager(peaqPay);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Plan Management', () => {
    it('should create a subscription plan', () => {
      const plan = subscriptionManager.createPlan({
        name: 'Test Plan',
        amount: '10.0',
        interval: 'monthly',
      });

      expect(plan.id).toBeDefined();
      expect(plan.name).toBe('Test Plan');
      expect(plan.amount).toBe('10.0');
      expect(plan.interval).toBe('monthly');
    });

    it('should retrieve a created plan', () => {
      const plan = subscriptionManager.createPlan({
        name: 'Test Plan',
        amount: '10.0',
        interval: 'monthly',
      });

      const retrievedPlan = subscriptionManager.getPlan(plan.id);
      expect(retrievedPlan).toEqual(plan);
    });
  });

  describe('Subscription Management', () => {
    it('should create a subscription', async () => {
      const plan = subscriptionManager.createPlan({
        name: 'Test Plan',
        amount: '10.0',
        interval: 'monthly',
      });

      const subscription = await subscriptionManager.createSubscription(
        plan.id,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
      );

      expect(subscription.id).toBeDefined();
      expect(subscription.planId).toBe(plan.id);
      expect(subscription.status).toBe('active');
    });

    it('should cancel a subscription', async () => {
      const plan = subscriptionManager.createPlan({
        name: 'Test Plan',
        amount: '10.0',
        interval: 'monthly',
      });

      const subscription = await subscriptionManager.createSubscription(
        plan.id,
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
      );

      await subscriptionManager.cancelSubscription(subscription.id);
      const updatedSubscription = subscriptionManager.getSubscription(subscription.id);
      expect(updatedSubscription?.status).toBe('cancelled');
    });
  });
});
