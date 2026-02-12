# 🚀 STRIPE PAYMENT SETUP - COMPLETE GUIDE

## ✅ Current Status

Your Apinlero platform is **READY** for Stripe payments! Here's what's already configured:

- ✅ Stripe publishable key: `pk_test_51SwKJ...` (configured in .env)
- ✅ Stripe payments: **ENABLED** in environment
- ✅ Supabase connection: Active
- ✅ Security measures: All in place (encryption, RLS, rate limiting)
- ✅ File permissions: Secured (600)

---

## 📋 WHAT YOU NEED

From your Stripe Dashboard at https://dashboard.stripe.com/test/apikeys:

1. **Publishable Key** (already have it ✅): `pk_test_51SwKJPDMxHrApO1G...`
2. **Secret Key** (need this): `sk_test_...` ← Click "Reveal test key" to get this

---

## 🎯 SETUP STEPS - QUICK START

### Step 1: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/test/apikeys
2. Under "Secret key", click **"Reveal test key"**
3. Copy the entire key (starts with `sk_test_`)

### Step 2: Add Secret Key to Database

Go to your Supabase dashboard and run this SQL:

```sql
-- First, find your business ID
SELECT id, name, slug FROM businesses;

-- Then add the Stripe secret key (it will be auto-encrypted!)
-- Replace YOUR_BUSINESS_ID and YOUR_SECRET_KEY
UPDATE businesses
SET
  stripe_secret_key_encrypted = 'sk_test_YOUR_SECRET_KEY_HERE',
  stripe_connected_at = NOW()
WHERE id = 'YOUR_BUSINESS_ID';
```

### Step 3: Test Payment

1. Go to your storefront
2. Add items to cart
3. Checkout and use test card: **4242 4242 4242 4242**
4. Expiry: 12/34, CVC: 123
5. Complete payment ✅

---

## 🧪 STRIPE TEST CARDS

- ✅ **Success**: `4242 4242 4242 4242`
- ❌ **Decline**: `4000 0000 0000 0002`
- 🔐 **3D Secure**: `4000 0025 0000 3155`

Use any future expiry (12/34), any CVC (123), any ZIP (12345)

---

## 🔍 VERIFY YOUR SETUP

### Check Database Config
```sql
SELECT
  name,
  slug,
  CASE
    WHEN stripe_publishable_key IS NOT NULL THEN '✅ OK'
    ELSE '❌ Missing'
  END as pub_key,
  CASE
    WHEN stripe_secret_key_encrypted IS NOT NULL THEN '✅ Encrypted'
    ELSE '❌ Missing'
  END as secret_key,
  stripe_connected_at
FROM businesses;
```

### Run Validation Script
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
npm run validate-stripe
```

---

## 🚀 PRODUCTION CHECKLIST

When ready to accept real payments:

- [ ] Get live keys: `pk_live_*` and `sk_live_*` from Stripe
- [ ] Update business record with live keys
- [ ] Set up webhook: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
- [ ] Test with small real transaction (£0.50)
- [ ] Monitor Stripe Dashboard for issues

---

## 🔧 TROUBLESHOOTING

**"Stripe not configured"**
→ Add secret key to database (see Step 2)

**"Payment intent failed"**
→ Check Supabase Function logs for errors
→ Verify secret key is correct

**"Origin not allowed"**
→ Use `localhost:5173` not `127.0.0.1`

---

## 📞 SUPPORT LINKS

- Stripe Dashboard: https://dashboard.stripe.com/test/payments
- Supabase Dashboard: https://supabase.com/dashboard
- Function Logs: Supabase → Edge Functions → Logs

---

Generated: 2026-02-08
Status: ✅ Ready for payments!
