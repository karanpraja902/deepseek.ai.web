# Stripe Payment Integration Setup

This guide will help you set up Stripe payment integration for the subscription plans.

## Prerequisites

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard

## Environment Variables

### Client (.env.local):
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_API_URL=https://deepseek-ai-server.vercel.app
```

### Server (.env):
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
CLIENT_URL=http://localhost:3001
PORT=5000
```

## Stripe Dashboard Setup

1. **Create Products and Prices:**
   - Go to Products in your Stripe Dashboard
   - Create products for each subscription plan:
     - Pro+ ($20/month)
     - Ultra ($40/month)
   - Note down the Price IDs for each plan

2. **Update Price IDs:**
   - Open `src/services/api/stripe.ts`
   - Replace the placeholder price IDs with your actual Stripe Price IDs:
   ```typescript
   export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
     'pro-plus': {
       name: 'Pro+',
       priceId: 'price_1234567890abcdef', // Replace with your actual price ID
       price: '$20',
       interval: 'month'
     },
     'ultra': {
       name: 'Ultra',
       priceId: 'price_0987654321fedcba', // Replace with your actual price ID
       price: '$40',
       interval: 'month'
     }
   };
   ```

## Testing

1. Use Stripe's test mode for development
2. Use test card numbers from [Stripe's documentation](https://stripe.com/docs/testing#cards)
3. Test card: `4242 4242 4242 4242` (Visa)

## Webhooks (Optional but Recommended)

To handle subscription events, set up webhooks:

1. Go to Webhooks in your Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Production Deployment

1. Replace test API keys with live keys
2. Update webhook endpoints to production URLs
3. Test thoroughly in production environment

## Architecture

### Server-Side (Express.js)
- **Routes**: `/api/stripe/*` endpoints
- **Controllers**: Stripe business logic and API calls
- **Security**: Secret key handling on server-side only

### Client-Side (Next.js)
- **Service**: Stripe.js integration for checkout redirect
- **UI**: Settings page with subscription plans
- **Feedback**: Toast notifications and loading states

## Features Implemented

- ✅ Server-side Stripe API integration
- ✅ Stripe Checkout session creation
- ✅ Subscription plan selection
- ✅ Loading states and error handling
- ✅ Success/cancel URL handling
- ✅ Pro Trial activation (no payment required)
- ✅ Toast notifications for user feedback
- ✅ Secure API key handling (server-side only)

## Next Steps

1. Implement webhook handlers for subscription events
2. Add subscription management (cancel, upgrade/downgrade)
3. Integrate with your user database
4. Add email notifications
5. Implement usage-based billing if needed
