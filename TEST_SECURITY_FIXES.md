# Security Fixes Testing Guide

## Quick Verification Tests

### ✅ Test 1: Authorization Check
**What to test:** Users can't create payments for businesses they don't own

**Steps:**
1. Get your auth token: Open DevTools → Application → Local Storage → Look for `supabase.auth.token`
2. Try to create payment for a different business:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "different-business-id",
    "amount": 10,
    "orderId": "test-123"
  }'
```

**Expected:** `403 Forbidden - You do not own this business`

---

### ✅ Test 2: business_id in Orders
**What to test:** All orders are created with business_id

**Steps:**
1. Place a test order through the checkout
2. Check Supabase database → orders table
3. Find your order

**Expected:** Order row has `business_id` column populated (not null)

---

### ✅ Test 3: Price Manipulation Prevention
**What to test:** Can't change prices via DevTools

**Steps:**
1. Add items to cart
2. Go to checkout page
3. Open DevTools → Console
4. Try to manipulate the total:
```javascript
// This won't work because server verifies prices
total = 0.01;
```
5. Complete checkout

**Expected:** Server-side verification catches the mismatch and rejects payment

---

### ✅ Test 4: CORS Protection
**What to test:** API rejects requests from unauthorized domains

**Steps:**
1. Create a test HTML file on your desktop:
```html
<!DOCTYPE html>
<html>
<body>
<script>
fetch('https://your-project.supabase.co/functions/v1/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ businessId: 'test', amount: 100, orderId: '123' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
</script>
</body>
</html>
```
2. Open the file in browser (file:// protocol)

**Expected:** CORS error or 403 Forbidden (request blocked)

---

### ✅ Test 5: Real Stripe Payment (No Demo Mode)
**What to test:** Actual Stripe payment processing works

**Steps:**
1. Add products to cart
2. Go to checkout
3. Fill in all details
4. Select "Pay with Card"
5. Click "Continue to Payment"
6. **Verify:** Stripe payment form appears (not a fake demo)
7. Enter test card: `4242 4242 4242 4242`
8. Enter any future expiry and CVC
9. Submit payment

**Expected:**
- Real Stripe payment form appears
- Payment processes (not instant demo timeout)
- Webhook updates order status in database
- No `setTimeout(1500)` simulation

---

### ✅ Test 6: Maximum Amount Limit
**What to test:** Can't charge more than £10,000

**Steps:**
1. Call edge function directly with large amount:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "your-business-id",
    "amount": 1000000,
    "orderId": "test-999"
  }'
```

**Expected:** `400 Bad Request - Payment exceeds maximum allowed amount of £10,000`

---

## 🧪 Automated Test Script

Create `test-security.sh`:

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

SUPABASE_URL="https://your-project.supabase.co"
AUTH_TOKEN="your-auth-token"
BUSINESS_ID="your-business-id"

echo "🔒 Testing Security Fixes..."
echo ""

# Test 1: Max Amount
echo "Test 1: Maximum amount validation"
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/create-payment-intent" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"businessId\":\"$BUSINESS_ID\",\"amount\":1000000,\"orderId\":\"test-max\"}")

if echo "$RESPONSE" | grep -q "exceeds maximum"; then
  echo -e "${GREEN}✅ PASS: Max amount validation working${NC}"
else
  echo -e "${RED}❌ FAIL: Max amount validation not working${NC}"
fi

# Test 2: Missing Auth
echo "Test 2: Authorization required"
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d "{\"businessId\":\"$BUSINESS_ID\",\"amount\":10,\"orderId\":\"test-auth\"}")

if echo "$RESPONSE" | grep -q "Unauthorized"; then
  echo -e "${GREEN}✅ PASS: Authorization check working${NC}"
else
  echo -e "${RED}❌ FAIL: Authorization check not working${NC}"
fi

echo ""
echo "🎉 Security tests complete!"
```

---

## 🐛 Troubleshooting

### Issue: "Origin not allowed" error
**Cause:** CORS validation blocking your request
**Fix:** Check that you're accessing the site from an apinlero.com subdomain or localhost

### Issue: Orders missing business_id
**Cause:** business context not loading
**Fix:** Ensure BusinessProvider wraps your app and business is loaded before checkout

### Issue: Stripe form not appearing
**Cause:** Missing publishable key or client secret not created
**Fix:**
1. Check `.env` has `VITE_STRIPE_PUBLISHABLE_KEY`
2. Check browser console for errors
3. Verify edge function is deployed

### Issue: Payment intent creation fails
**Cause:** Auth token not being sent
**Fix:** Ensure user is logged in and token is retrieved from session

---

## 📊 Database Verification Queries

Run these in Supabase SQL Editor:

```sql
-- Check all orders have business_id
SELECT
  id,
  business_id,
  customer_name,
  total,
  CASE
    WHEN business_id IS NULL THEN '❌ MISSING'
    ELSE '✅ OK'
  END as status
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Check payment intents are created
SELECT
  o.id as order_id,
  o.total,
  o.payment_status,
  p.payment_intent_id,
  p.status as payment_status
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
WHERE o.payment_method = 'card'
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## ✅ Success Criteria

All tests should pass with these results:

- [ ] Unauthorized users get 403 when creating payments for other businesses
- [ ] All new orders have business_id populated
- [ ] Price verification catches client-side manipulation
- [ ] CORS blocks unauthorized origins
- [ ] Real Stripe payment form appears (no demo mode)
- [ ] Amounts over £10,000 are rejected
- [ ] Webhook updates order status after successful payment
- [ ] Idempotency prevents duplicate payments

**When all checkboxes are ticked: System is secure for production! 🎉**
