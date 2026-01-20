# Àpínlẹ̀rọ Test Payment

## Purpose
Test Stripe payment integration including payment intents, checkout flows, and webhook handling.

## Usage
```
/test-payment
```

## Prerequisites
- Stripe account with test mode enabled
- Stripe API keys configured
- Payment webhook endpoint set up

## Commands

| Command | Description |
|---------|-------------|
| `/test-payment` | Run all payment tests |
| `/test-payment intent` | Create test payment intent |
| `/test-payment checkout` | Test checkout flow |
| `/test-payment webhook` | Test payment webhook |
| `/test-payment refund` | Test refund flow |

## Configuration

### Required Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Card Numbers
| Card | Number | Use Case |
|------|--------|----------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Requires Auth | 4000 0025 0000 3155 | 3D Secure required |
| Insufficient | 4000 0000 0000 9995 | Insufficient funds |

**For all test cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

## Test Scenarios

### 1. Create Payment Intent
```javascript
// Using Stripe API
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: 2500, // £25.00 in pence
  currency: 'gbp',
  metadata: {
    order_id: 'test_order_123',
    customer_phone: '447123456789'
  }
});

console.log('Payment Intent:', paymentIntent.client_secret);
```

### 2. Test via API Endpoint
```bash
curl -X POST https://your-backend/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "orderId": "test_order_123",
    "customerEmail": "test@example.com"
  }'
```

### 3. Test Webhook Locally
Use Stripe CLI to forward webhooks:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

### 4. Verify Webhook Signature
```javascript
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/api/stripe-webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        // Update order status
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Payment Flow Test

### Complete Order Payment Flow
1. Create order in Supabase
2. Create payment intent
3. Customer completes payment
4. Webhook receives confirmation
5. Order status updates to "paid"

```sql
-- Check payment status in database
SELECT
  o.id,
  o.customer_name,
  o.total,
  o.payment_status,
  p.stripe_payment_id,
  p.status as stripe_status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE o.id = 'test_order_123';
```

## Test Checklist

| Test | Expected | Status |
|------|----------|--------|
| Create payment intent | Returns client_secret | |
| Card payment succeeds | payment_intent.succeeded event | |
| Card declined | payment_intent.payment_failed event | |
| Webhook signature valid | Event processed | |
| Order status updates | payment_status = 'paid' | |
| Refund processes | Refund created | |

## Troubleshooting

### Payment intent fails
**Cause:** Invalid API key or amount format
**Solution:**
1. Verify using test API key (sk_test_...)
2. Amount must be in smallest currency unit (pence for GBP)
3. Currency must be lowercase ('gbp' not 'GBP')

### Webhook not received
**Cause:** Webhook URL not configured or signature mismatch
**Solution:**
1. Check Stripe Dashboard → Developers → Webhooks
2. Verify endpoint URL is correct and accessible
3. Check STRIPE_WEBHOOK_SECRET matches

### 3D Secure not completing
**Cause:** Test environment requires specific handling
**Solution:**
1. Use test card 4000 0025 0000 3155
2. In test mode, authentication auto-completes
3. Check return_url is set correctly

## Stripe Dashboard Links
- [Test Payments](https://dashboard.stripe.com/test/payments)
- [Webhooks](https://dashboard.stripe.com/test/webhooks)
- [API Keys](https://dashboard.stripe.com/test/apikeys)

## Related Skills
- `/test-webhook` - Test general webhooks
- `/test-bot` - Test bot payment prompts

---
*Apinlero Test Payment Skill v1.0*
