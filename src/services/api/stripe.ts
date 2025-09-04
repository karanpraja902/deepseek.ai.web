import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface SubscriptionPlan {
  name: string;
  priceId: string;
  price: string;
  interval: 'month' | 'year';
}

// Define subscription plans with their Stripe price IDs
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  'pro-trial': {
    name: 'Pro Trial',
    priceId: 'price_1S1zvlD8AeNIOU0l7lvpErg5', // Replace with actual Stripe price ID
    price: 'Free',
    interval: 'month'
  },
  'pro-plus': {
    name: 'Pro+',
    priceId: 'price_1S1zsWD8AeNIOU0lWFKGuLYw', // Replace with actual Stripe price ID
    price: '$20',
    interval: 'month'
  },
  'ultra': {
    name: 'Ultra',
    priceId: 'price_1S1zxwD8AeNIOU0l76UImZTH', // Replace with actual Stripe price ID
    price: '$40',
    interval: 'month'
  }
};

export class StripeService {
  /**
   * Redirect to Stripe Checkout for subscription
   */
  static async redirectToCheckout(planKey: string, userId: string) {
    try {
      console.log("stripePromise", stripePromise);
      
        console.log('Redirecting to Stripe Checkout for plan:', planKey);
        console.log('User ID:', userId);
      const plan = SUBSCRIPTION_PLANS[planKey];
      console.log('Plan:', plan);
      if (!plan) {
        throw new Error(`Invalid plan: ${planKey}`);
      }
console.log('Plan2:', plan);
      // For Pro Trial, handle differently (might be free or require card setup)
    //   if (planKey === 'pro-trial') {
    //     return this.handleProTrial(userId);
    //   }
console.log('Plan3:', plan);
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create checkout session via server API
      // const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';
      const serverUrl = 'http://localhost:5000';
      // 
      const response = await fetch(`${serverUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: userId,
          planName: plan.name,
          successUrl: `${window.location.origin}/settings?success=true&plan=${planKey}`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        }),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create checkout session: ${error}`);
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw error;
    }
  }

  /**
   * Handle Pro Trial activation
   */
  private static async handleProTrial(userId: string) {
    try {
      // For Pro Trial, you might want to:
      // 1. Just activate the trial without payment
      // 2. Or collect card info for future billing
      console.log('Stripe Service: Activating Pro Trial for user:', userId);
      // const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';
      const serverUrl = 'http://localhost:5000';
      // const response = await fetch(`${serverUrl}/stripe/activate-trial`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     userId: userId,
      //   }),
      // });
      const response = await fetch(`${serverUrl}/api/stripe/activate-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });
      console.log('Response:', response);

      if (!response.ok) {
        throw new Error('Failed to activate Pro Trial');
      }
      console.log('Response2:', response);
      const result = await response.json();
      console.log('Pro Trial activated:', result);
      return result;
    } catch (error) {
      console.error('Pro Trial activation error:', error);
      throw error;
    }
  }

  /**
   * Get current subscription status
   */
  static async getSubscriptionStatus(userId: string) {
    try {
      // const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';
      // const response = await fetch(`${serverUrl}/stripe/subscription-status?userId=${userId}`);
      const serverUrl = 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/stripe/subscription-status?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string) {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';
      const response = await fetch(`${serverUrl}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
}

export default StripeService;
