# Àpínlẹ̀rọ Testing Guide

## 🎯 Quick Start: Testing Stripe Payments

### Step 1: Start Your Servers

Open **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
npm run dev
```

Both should show "running" messages.

---

### Step 2: Navigate to Customer Storefront

**⚠️ IMPORTANT:** Don't test on the landing page or admin dashboard!

Open your browser and go to:
```
http://localhost:5173/store/ishas-treat
```

You should see **Isha's Treat** storefront with products.

---

### Step 3: Add Items to Cart

1. Browse the products
2. Click "Add to Cart" on items you want
3. Click the cart icon in the header

---

### Step 4: Checkout

1. Click "Checkout" or "Proceed to Checkout"
2. Fill in customer details:
   - **Name:** Test Customer
   - **Email:** test@example.com
   - **Phone:** +44 7123 456789
   - **Address:** 123 Test Street, London, UK

3. Select **"Card Payment (Stripe)"**

---

### Step 5: Pay with Test Card

Use these Stripe test card details:

```
Card Number: 4242 4242 4242 4242
Expiry Date: 12/34
CVC: 123
ZIP Code: 12345
```

Click **"Pay Now"** or **"Complete Order"**

---

### Step 6: Verify Payment Success

1. **On Screen:** You should see an order confirmation page
2. **Email:** Check test@example.com for confirmation email (if configured)
3. **Stripe Dashboard:** Go to https://dashboard.stripe.com/test/payments
   - You should see your test payment appear
   - Amount should match your cart total

---

## 📋 Complete Testing Checklist

### ✅ Environment Setup
- [ ] Backend running on `http://localhost:3001`
- [ ] Frontend running on `http://localhost:5173`
- [ ] All environment variables set (run `npm run check-env`)
- [ ] Stripe keys validated (run `npm run validate-stripe`)

### ✅ Customer Storefront Testing
- [ ] Navigate to `http://localhost:5173/store/ishas-treat`
- [ ] Products load correctly
- [ ] Can add items to cart
- [ ] Cart persists on page refresh
- [ ] Can remove items from cart
- [ ] Cart total calculates correctly

### ✅ Checkout Testing
- [ ] Checkout form loads
- [ ] All required fields present (name, email, phone, address)
- [ ] Delivery method selection works (Delivery/Collection)
- [ ] Payment method selection works (Card/Bank Transfer)

### ✅ Stripe Payment Testing
- [ ] Stripe payment form loads
- [ ] Can enter test card: 4242 4242 4242 4242
- [ ] Payment processes successfully
- [ ] Order confirmation page displays
- [ ] Order appears in database
- [ ] Payment appears in Stripe Dashboard

### ✅ Error Handling
- [ ] Invalid card shows error (use 4000 0000 0000 0002)
- [ ] Empty cart prevents checkout
- [ ] Missing required fields show validation errors
- [ ] Failed payment shows appropriate message

---

## 🧪 Stripe Test Cards

### Successful Payments

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Standard success |
| 4000 0056 0000 0004 | Success (Visa debit) |
| 5555 5555 5555 4444 | Success (Mastercard) |

### Failed Payments (for testing error handling)

| Card Number | Error Type |
|-------------|------------|
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVC |

**All test cards:**
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## 🔍 Testing Different Portals

### Testing Customer Storefront
**URL:** `http://localhost:5173/store/ishas-treat`
**Purpose:** Test shopping and payment flow
**Features to Test:**
- Product browsing
- Search and filters
- Cart functionality
- Checkout process
- Payment processing
- Order confirmation

### Testing Admin Dashboard
**URL:** `http://localhost:5173/app`
**Purpose:** Test business owner features
**Features to Test:**
- Product management (add/edit/delete)
- Order management (view, update status)
- Analytics dashboard
- Stripe settings configuration
- Customer management

### Testing Landing Page
**URL:** `http://localhost:5173`
**Purpose:** Test marketing and signup
**Features to Test:**
- Landing page loads
- Business signup flow
- Pricing page
- Features page

---

## 🐛 Common Issues & Solutions

### Issue: "supabaseKey is required"
**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`
**Solution:**
1. Get key from Supabase Dashboard → Settings → API
2. Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=your_key`
3. Restart backend server

### Issue: "Stripe key invalid"
**Cause:** Missing or incorrect Stripe keys
**Solution:**
1. Run `npm run validate-stripe` to check
2. Verify keys in `.env` and `backend/.env`
3. Get keys from https://dashboard.stripe.com/apikeys

### Issue: Can't find storefront
**Cause:** Wrong URL
**Solution:**
- Use `http://localhost:5173/store/ishas-treat`
- NOT `http://localhost:5173` (that's the landing page)
- NOT `http://localhost:5173/app` (that's the admin dashboard)

### Issue: Products don't load
**Cause:** No products in database for this business
**Solution:**
1. Login to admin dashboard: `http://localhost:5173/app`
2. Go to Inventory tab
3. Add test products

### Issue: Payment fails with "Business not found"
**Cause:** Business doesn't exist in database
**Solution:**
1. Check database for business with slug "ishas-treat"
2. Or use a different business slug that exists
3. Business must have `is_active = true`

### Issue: Stripe payment form doesn't appear
**Cause:** Stripe publishable key not configured
**Solution:**
1. Check frontend `.env` has `VITE_STRIPE_PUBLISHABLE_KEY`
2. Or business has `stripe_publishable_key` in database
3. Restart frontend server after adding key

---

## 🔄 Testing Workflow

### Daily Development Testing

1. **Start servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   npm run dev
   ```

2. **Verify environment:**
   ```bash
   npm run check-env
   ```

3. **Test customer flow:**
   - Browse storefront
   - Add items to cart
   - Complete checkout
   - Verify payment

4. **Test admin features:**
   - Add/edit products
   - View orders
   - Update order status

### Before Committing Code

- [ ] All tests pass
- [ ] Stripe payment works end-to-end
- [ ] No console errors
- [ ] Admin dashboard loads
- [ ] Storefront loads
- [ ] Environment validation passes

### Before Deploying

- [ ] All environment variables documented
- [ ] Stripe keys configured (production keys for production!)
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Webhook endpoints configured
- [ ] Test payment in production (with test mode first)

---

## 📊 Monitoring & Verification

### After Test Payment

**Check Frontend:**
- Order confirmation page displayed
- Correct order total shown
- Order ID provided

**Check Database:**
```sql
SELECT * FROM orders
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
- `payment_status = 'Paid'`
- `payment_method = 'card'`
- `payment_intent_id = 'pi_...'`

**Check Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/test/payments
2. Find payment with matching amount
3. Verify metadata includes:
   - `businessId`
   - `orderId`
   - `customerName`

**Check Webhook Events:**
1. Go to https://dashboard.stripe.com/test/webhooks
2. Find recent `payment_intent.succeeded` event
3. Verify it was delivered successfully

---

## 🎓 Testing Scenarios

### Happy Path: Successful Card Payment

1. Navigate to storefront
2. Add 3 products to cart (£10, £15, £20 = £45)
3. Proceed to checkout
4. Enter customer details
5. Select "Delivery" (£5 fee → total £50)
6. Choose "Card Payment"
7. Enter test card: 4242 4242 4242 4242
8. Complete payment
9. **Expected:** Success confirmation, payment in Stripe

### Error Path: Declined Card

1. Navigate to storefront
2. Add items to cart
3. Proceed to checkout
4. Enter customer details
5. Choose "Card Payment"
6. Enter declined card: 4000 0000 0000 0002
7. Submit payment
8. **Expected:** Error message, order status = "Pending", no charge

### Alternative Path: Bank Transfer

1. Navigate to storefront
2. Add items to cart
3. Proceed to checkout
4. Enter customer details
5. Choose "Bank Transfer"
6. Submit order
7. **Expected:** Order created with status "Awaiting Payment", no Stripe charge

---

## 📁 Test Data

### Sample Customer Info

```
Name: Test Customer
Email: test@example.com
Phone: +44 7123 456789
Address: 123 Test Street, London, SW1A 1AA, UK
```

### Sample Product Test

Add these products via admin dashboard:

```
Product 1:
  Name: Yam
  Price: £10.00
  Category: Vegetables
  Stock: 50

Product 2:
  Name: Plantain
  Price: £5.00
  Category: Vegetables
  Stock: 100

Product 3:
  Name: Jollof Rice Mix
  Price: £8.50
  Category: Grains & Rice
  Stock: 30
```

---

## 🚀 Next Steps After Testing

Once you've successfully tested payments:

1. **Document any issues** found
2. **Test with different businesses** (if multiple exist)
3. **Test edge cases** (empty cart, zero amount, etc.)
4. **Test on mobile** devices
5. **Prepare for production** deployment:
   - Switch to live Stripe keys
   - Configure production webhook endpoints
   - Test with real card (small amount)
   - Set up monitoring and alerts

---

**Last Updated:** 2026-02-04
**Platform:** Àpínlẹ̀rọ SaaS MVP
**Testing Environment:** Development (localhost)
