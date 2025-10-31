# How to Get Actual Stripe Price IDs

This guide will walk you through creating products and getting real Price IDs from your Stripe Dashboard.

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" and create your account
3. Complete the signup process
4. You'll be in **Test Mode** by default (perfect for development)

## Step 2: Access Your Stripe Dashboard

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in the top-right corner)
3. You should see the main dashboard

## Step 3: Create Products and Prices

### For Pro+ Plan ($20/month):

1. **Go to Products**:
   - In the left sidebar, click **"Products"**
   - Click **"+ Add product"**

2. **Create Pro+ Product**:
   - **Name**: `Pro+`
   - **Description**: `3.5x higher limits than Pro for OpenAI, Claude, Gemini and Grok models`
   - **Image**: Upload a logo (optional)

3. **Add Pricing**:
   - **Pricing model**: `Standard pricing`
   - **Price**: `$20.00`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
   - Click **"Save product"**

4. **Copy the Price ID**:
   - After saving, you'll see the product page
   - Look for the **"Pricing"** section
   - You'll see a Price ID like: `price_1ABC123def456GHI789`
   - **Copy this ID** - this is your actual Price ID!

### For Ultra Plan ($40/month):

1. **Create Ultra Product**:
   - Click **"+ Add product"** again
   - **Name**: `Ultra`
   - **Description**: `20x higher limits for OpenAI, Claude, Gemini, Grok models, and early access to advanced features`

2. **Add Pricing**:
   - **Price**: `$40.00`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
   - Click **"Save product"**

3. **Copy the Ultra Price ID**

### For Pro Trial (Optional):

Pro Trial doesn't need a Stripe product since it's free. You can either:
- Leave it as is (handled by your server without Stripe)
- Create a $0.00 product if you want to track trials in Stripe

## Step 4: Get Your API Keys

1. **Go to API Keys**:
   - In the left sidebar, click **"Developers"** → **"API keys"**

2. **Copy Your Keys**:
   - **Publishable key**: Starts with `pk_test_...` (for client-side)
   - **Secret key**: Starts with `sk_test_...` (for server-side)
   - Click **"Reveal"** to see the full secret key

## Step 5: Update Your Code

### Update Price IDs in `stripe.ts`:

```typescript
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  'pro-trial': {
    name: 'Pro Trial',
    priceId: 'price_YOUR_ACTUAL_TRIAL_PRICE_ID', // Or keep as is if free
    price: 'Free',
    interval: 'month'
  },
  'pro-plus': {
    name: 'Pro+',
    priceId: 'price_YOUR_ACTUAL_PROPLUS_PRICE_ID', // Replace with real ID
    price: '$20',
    interval: 'month'
  },
  'ultra': {
    name: 'Ultra',
    priceId: 'price_YOUR_ACTUAL_ULTRA_PRICE_ID', // Replace with real ID
    price: '$40',
    interval: 'month'
  }
};
```

### Add Environment Variables:

**Client (.env.local):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
NEXT_PUBLIC_API_URL=https://deepseek-ai-server.vercel.app
```

**Server (.env):**
```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
CLIENT_URL=http://localhost:3001
PORT=5000
```

## Step 6: Test Your Integration

1. **Restart both servers**:
   ```bash
   # Terminal 1 - Server
   cd deepseek.ai.server
   npm run dev

   # Terminal 2 - Client  
   cd deepseek.ai.client
   npm run dev
   ```

2. **Test the flow**:
   - Go to `http://localhost:3001/settings`
   - Click on **Pro+** or **Ultra** buttons
   - You should be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`

## Example: What Real Price IDs Look Like

```
✅ Correct Format:
- price_1NXWPnLkdIwHu7ixaFttYNFw
- price_1NXWQgLkdIwHu7ixKYNH8CgG
- price_1NXWRHLkdIwHu7ixBVZ8ePQz

❌ Wrong Format:
- sub_1PJZ9mF5dcn2Hjb0aVJqR7T9  (this is subscription ID)
- prod_ABC123                    (this is product ID)
- cus_DEF456                     (this is customer ID)
```

## Troubleshooting

### Common Issues:

1. **"No such price" error**:
   - Double-check you copied the Price ID correctly
   - Make sure you're using the Price ID, not Product ID or Subscription ID

2. **"Invalid API key" error**:
   - Verify your secret key is correct and starts with `sk_test_`
   - Make sure the key is in your server's `.env` file

3. **CORS errors**:
   - Check that `CLIENT_URL` in server matches your client URL
   - Ensure both servers are running

4. **Checkout not loading**:
   - Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in client
   - Check browser console for JavaScript errors

## Next Steps

Once you have real Price IDs:
1. Replace the placeholder IDs in your code
2. Test with Stripe's test card numbers
3. When ready for production, switch to live mode and use live API keys

## Test Card Numbers

For testing payments:
- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`
- **Declined**: `4000 0000 0000 0002`

Use any future expiry date, any 3-digit CVC, and any ZIP code.
