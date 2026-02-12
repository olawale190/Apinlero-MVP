# WhatsApp Payment Confirmation - Deployment Guide

## Overview
This enhancement adds WhatsApp payment confirmations when customers pay online via Stripe. When a payment succeeds, the customer automatically receives a WhatsApp message confirming their payment.

## What Was Changed

### File Modified
- **`project/supabase/functions/stripe-webhook/index.ts`**

### Changes Made

1. **Added WhatsApp notification function** (lines 284-335)
   - `sendWhatsAppPaymentConfirmation()` - Sends confirmation via Meta WhatsApp Cloud API
   - Handles phone number cleaning
   - Formats friendly confirmation message
   - Handles errors gracefully

2. **Enhanced payment_intent.succeeded handler** (lines 85-167)
   - Fetches order details (phone, customer name, total, business_id)
   - Fetches WhatsApp config for the business
   - Sends WhatsApp confirmation after successful payment
   - Non-blocking: won't fail webhook if WhatsApp fails

## Prerequisites

Before deployment, ensure:

1. ✅ **Database has WhatsApp configs**
   - Table `whatsapp_configs` exists
   - Has `phone_number_id` and `access_token` for each business

2. ✅ **Orders table has required fields**
   - `phone_number` (customer's WhatsApp number)
   - `business_id` (for multi-tenant support)
   - `customer_name`, `total`

3. ✅ **Supabase project configured**
   - Edge Functions enabled
   - Service role key set

## Deployment Steps

### Step 1: Deploy the Updated Function

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project

# Deploy the updated stripe-webhook function
supabase functions deploy stripe-webhook
```

Expected output:
```
Deploying function stripe-webhook...
Function stripe-webhook deployed successfully
URL: https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
```

### Step 2: Verify Deployment

```bash
# Check function status
supabase functions list

# View recent logs
supabase functions logs stripe-webhook --limit 20
```

### Step 3: Test with Stripe Test Mode

#### Option A: Use Stripe CLI (Recommended)

```bash
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local function for testing
stripe listen --forward-to https://[your-project-ref].supabase.co/functions/v1/stripe-webhook

# In another terminal, trigger a test payment
stripe trigger payment_intent.succeeded
```

#### Option B: End-to-End Test

1. Place a test order via your WhatsApp bot
2. Choose "Pay Online" when asked for payment method
3. Complete payment on the checkout page using Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. **Expected Result:**
   - ✅ Payment succeeds in Stripe
   - ✅ Order status updated to "Confirmed"
   - ✅ Payment status set to "paid"
   - ✅ **WhatsApp confirmation received within 5 seconds**

### Step 4: Check Logs

```bash
# View function logs
supabase functions logs stripe-webhook --limit 50
```

**Look for:**
- `✅ WhatsApp confirmation sent to [Name] ([phone]): [message_id]`
- OR warnings: `WhatsApp not configured for business [id]`

## Message Format

Customers receive:

```
✅ Payment Confirmed!

Order #: ABC12345
Amount: £16.98 paid by card
Status: Confirmed

We're preparing your order now!

Questions? Just reply to this message.
```

## Troubleshooting

### Issue: "WhatsApp not configured for business [id]"

**Cause:** The `whatsapp_configs` table doesn't have credentials for this business.

**Solution:**
```sql
-- Check if config exists
SELECT * FROM whatsapp_configs WHERE business_id = '[business-id]';

-- Insert config if missing
INSERT INTO whatsapp_configs (
  business_id,
  phone_number_id,
  access_token,
  webhook_verify_token,
  provider,
  is_active
) VALUES (
  '[business-id]',
  '[your-meta-phone-number-id]',
  '[your-meta-access-token]',
  '[your-webhook-verify-token]',
  'meta',
  true
);
```

### Issue: "WhatsApp API error"

**Possible Causes:**
1. Invalid or expired access token
2. Phone number not registered with WhatsApp Business
3. Rate limiting from Meta

**Solution:**
1. Check Meta Business Suite → WhatsApp → API Setup
2. Verify access token is valid and permanent (not temporary)
3. Check Meta API rate limits

### Issue: Webhook returns 500 error

**Cause:** Critical error in webhook processing

**Solution:**
```bash
# Check detailed logs
supabase functions logs stripe-webhook --limit 100

# Look for stack traces and error messages
```

### Issue: Customer doesn't receive WhatsApp

**Debug steps:**

1. **Check order has phone number:**
   ```sql
   SELECT id, phone_number, business_id FROM orders WHERE id = '[order-id]';
   ```

2. **Check WhatsApp config exists:**
   ```sql
   SELECT * FROM whatsapp_configs
   WHERE business_id = (SELECT business_id FROM orders WHERE id = '[order-id]');
   ```

3. **Check function logs:**
   ```bash
   supabase functions logs stripe-webhook --limit 50
   ```

4. **Verify phone number format:**
   - Should be digits only: `2348012345678` (no +, no spaces)
   - Check in database: `SELECT phone_number FROM orders WHERE id = '[order-id]';`

## Monitoring

### Key Metrics to Track

1. **WhatsApp Delivery Rate**
   - Count successful WhatsApp sends vs total payments
   - Target: >95%

2. **Average Delivery Time**
   - Time from payment to WhatsApp received
   - Target: <5 seconds

3. **Error Rate**
   - Webhook processing errors
   - WhatsApp API errors
   - Target: <1%

### Monitoring Queries

```sql
-- Count successful payments today
SELECT COUNT(*)
FROM orders
WHERE payment_status = 'paid'
  AND DATE(created_at) = CURRENT_DATE;

-- Check for orders without WhatsApp configs
SELECT o.id, o.business_id, o.phone_number
FROM orders o
LEFT JOIN whatsapp_configs wc ON wc.business_id = o.business_id
WHERE o.payment_status = 'paid'
  AND wc.id IS NULL
  AND DATE(o.created_at) = CURRENT_DATE;
```

## Rollback Plan

If WhatsApp notifications cause issues:

### Quick Rollback (Comment out WhatsApp code)

```bash
# Edit the function to comment out WhatsApp sending
# In stripe-webhook/index.ts, comment lines 137-167

# Redeploy
supabase functions deploy stripe-webhook
```

### Full Rollback (Restore previous version)

```bash
# If you have the previous version in git
git checkout HEAD~1 -- project/supabase/functions/stripe-webhook/index.ts

# Redeploy
supabase functions deploy stripe-webhook
```

## Testing Checklist

Before marking as complete, verify:

- [ ] Function deploys successfully
- [ ] Stripe webhook receives events (check Stripe dashboard)
- [ ] Order status updates to "Confirmed" on payment
- [ ] Payment record created in database
- [ ] WhatsApp confirmation sent to customer
- [ ] Customer receives message within 5 seconds
- [ ] Message format is correct (order ID, amount, etc.)
- [ ] Error handling works (test with missing WhatsApp config)
- [ ] Logs show successful delivery or helpful errors
- [ ] No webhook retries in Stripe dashboard (means 200 returned)

## Production Deployment

Once testing passes:

1. **Update Stripe webhook URL** (if not already set)
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Set webhook secret**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Monitor first few transactions**
   - Watch logs closely
   - Verify customer feedback
   - Check for any errors

4. **Gather feedback**
   - Ask customers: "Did you receive payment confirmation?"
   - Monitor support tickets for payment-related questions
   - Should see reduction in "did my payment go through?" inquiries

## Success Criteria

✅ **Technical:**
- Webhook returns 200 OK to Stripe
- Order status = "Confirmed"
- Payment record created
- WhatsApp message sent (logged)

✅ **Customer Experience:**
- Confirmation received < 5 seconds after payment
- Message is clear and professional
- No confusion about payment status

✅ **Business Impact:**
- 50% reduction in payment status support tickets
- Improved customer satisfaction
- Complete transaction loop

## Support

If issues persist:
1. Check [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
2. Check [Meta WhatsApp Cloud API docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
3. Review function logs: `supabase functions logs stripe-webhook`
4. Check Stripe webhook dashboard for delivery status

---

**Implementation Date:** 2026-02-03
**Version:** 1.0.0
**Status:** Ready for deployment
