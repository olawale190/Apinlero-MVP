# 🚀 Deployment Guide - Security Fixes

## Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate. Once logged in, you can proceed.

---

## Step 2: Link Your Project

Navigate to your project directory:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
```

Link to your Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**How to find your project ref:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. The project ref is in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Or find it in Settings → General → Reference ID

---

## Step 3: Deploy Edge Functions

Deploy all 4 edge functions with security fixes:

```bash
# Deploy create-payment-intent (with authorization + CORS fixes)
supabase functions deploy create-payment-intent

# Deploy verify-order-total (NEW - price verification)
supabase functions deploy verify-order-total

# Deploy stripe-webhook (CORS removed for security)
supabase functions deploy stripe-webhook

# Deploy test-stripe-connection (CORS fixed)
supabase functions deploy test-stripe-connection
```

**Or deploy all at once:**

```bash
supabase functions deploy create-payment-intent && \
supabase functions deploy verify-order-total && \
supabase functions deploy stripe-webhook && \
supabase functions deploy test-stripe-connection
```

---

## Step 4: Verify Environment Variables

Check that your `.env` file has all required variables:

```bash
cat .env
```

**Required variables:**

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (from your Stripe Dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Or for live mode:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**⚠️ Important:** The edge functions use Stripe secret keys stored in the database (per-business), so you don't need to set STRIPE_SECRET_KEY as an environment variable.

---

## Step 5: Set Edge Function Secrets (for Webhooks)

The stripe-webhook function needs environment variables:

```bash
# Set Stripe secret key (global fallback, optional)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Set webhook secret (get this from Stripe Dashboard → Webhooks)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get webhook secret:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.processing`
   - `charge.refunded`
5. After creating, click "Reveal" on the webhook secret
6. Copy the `whsec_...` value and use it in the command above

---

## Step 6: Build the Frontend

Install dependencies and build:

```bash
npm install
npm run build
```

---

## Step 7: Test the Deployment

### Test 1: Create Payment Intent (Authorization Check)

```bash
# Get your auth token from browser DevTools:
# Application → Local Storage → supabase.auth.token

curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "amount": 10,
    "orderId": "test-123"
  }'
```

**Expected:** Should create payment intent if you own the business, or return 403 if you don't.

### Test 2: Verify Order Total

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-order-total \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "items": [
      {"product_name": "Test Product", "quantity": 2, "price": 5.00}
    ],
    "deliveryFee": 2.00,
    "clientTotal": 12.00
  }'
```

**Expected:** `{"valid": true, "verifiedTotal": 12.00, ...}`

### Test 3: End-to-End Payment Flow

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the app in browser
3. Add items to cart
4. Go to checkout
5. Fill in details and select "Pay with Card"
6. Click "Continue to Payment"
7. **Verify:** Stripe Elements payment form appears
8. Use test card: `4242 4242 4242 4242`
9. Submit payment
10. **Verify:** Order completes successfully

---

## Step 8: Verify Database

Check that orders have `business_id`:

```sql
-- Run in Supabase SQL Editor
SELECT
  id,
  business_id,
  customer_name,
  total,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** All orders should have `business_id` populated (not NULL).

---

## 🔍 Troubleshooting

### Error: "Origin not allowed"

**Cause:** CORS validation blocking your request
**Fix:** Make sure you're accessing from:
- `https://*.apinlero.com` (production)
- `http://localhost:*` (development)
- Update CORS regex in edge functions if needed

### Error: "Unauthorized - Authentication required"

**Cause:** No auth token sent or user not logged in
**Fix:**
1. Make sure user is logged in
2. Check that `supabase.auth.getSession()` returns a valid token
3. Verify token is being sent in Authorization header

### Error: "Business not found"

**Cause:** Business ID doesn't exist or is incorrect
**Fix:**
1. Check business ID in database
2. Verify business context is loading correctly
3. Check browser console for business context errors

### Error: "Stripe not configured for this business"

**Cause:** Business doesn't have Stripe keys in database
**Fix:**
1. Go to Settings → Integrations in your app
2. Connect Stripe account
3. Verify `stripe_secret_key_encrypted` is saved in businesses table

### Error: "Price mismatch detected"

**Cause:** Client-side total doesn't match server calculation
**Fix:**
1. This is actually working correctly! (preventing price manipulation)
2. Check that product prices haven't changed
3. Clear cart and try again

---

## 📋 Deployment Checklist

Use this checklist to ensure everything is deployed correctly:

- [ ] Logged in to Supabase CLI (`supabase login`)
- [ ] Linked to correct project (`supabase link`)
- [ ] Deployed `create-payment-intent` function
- [ ] Deployed `verify-order-total` function
- [ ] Deployed `stripe-webhook` function
- [ ] Deployed `test-stripe-connection` function
- [ ] Set webhook secret in Supabase secrets
- [ ] Created webhook endpoint in Stripe Dashboard
- [ ] Frontend `.env` has all required variables
- [ ] Ran `npm install` successfully
- [ ] Test payment with card `4242 4242 4242 4242` works
- [ ] Orders in database have `business_id`
- [ ] Stripe Elements form appears (not demo mode)
- [ ] Webhook updates order status after payment

---

## 🎉 Success Indicators

You'll know deployment succeeded when:

1. ✅ Edge functions show in Supabase Dashboard → Edge Functions
2. ✅ Real Stripe payment form appears in checkout
3. ✅ Test payment with `4242 4242 4242 4242` completes
4. ✅ Order status updates to "Confirmed" after payment
5. ✅ All orders have `business_id` in database
6. ✅ Unauthorized users get 403 when trying to create payments for other businesses

---

## 🆘 Need Help?

If you encounter issues:

1. Check function logs:
   ```bash
   supabase functions logs create-payment-intent
   ```

2. Enable debug mode:
   ```bash
   supabase functions deploy create-payment-intent --debug
   ```

3. Test locally:
   ```bash
   supabase functions serve create-payment-intent
   ```

4. Check Supabase Dashboard → Logs for detailed error messages

---

## Next Steps After Deployment

Once deployed and tested, consider:

1. **Enable Live Mode:** Switch from `pk_test_` to `pk_live_` Stripe keys
2. **Monitor Webhooks:** Check Stripe Dashboard for webhook delivery status
3. **Set Up Alerts:** Configure monitoring for failed payments
4. **Address High Priority Issues:** See [SECURITY_FIXES_COMPLETED.md](SECURITY_FIXES_COMPLETED.md) "Next Steps" section
