# Stripe Quick Start Guide

## 🎯 What to Ask Isha Treat For

Send them this message:

---

**Hi! We need your Stripe API keys to integrate payments. Please provide:**

1. **Publishable Key** - starts with `pk_test_` or `pk_live_`
2. **Secret Key** - starts with `sk_test_` or `sk_live_`

You can find these at: https://dashboard.stripe.com/apikeys

**Important**:
- Start with TEST keys (`pk_test_*`, `sk_test_*`) first
- We'll switch to LIVE keys after testing

---

## 🔧 Where to Add the Keys

### Publishable Key (pk_test_* or pk_live_*)
**File**: `.env` (in the main project folder)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_HERE
```

### Secret Key (sk_test_* or sk_live_*)
**File**: `backend/.env` (in the backend folder)
```bash
STRIPE_SECRET_KEY=sk_test_PASTE_HERE
```

### Enable Payments
**File**: `.env` (in the main project folder)
```bash
VITE_ENABLE_STRIPE_PAYMENTS=true
```

## ✅ Security Checklist

All these are ALREADY DONE for you:

- ✅ Files secured with proper permissions
- ✅ .env files will NOT be committed to git
- ✅ Secret keys will be encrypted in database
- ✅ Row Level Security enabled
- ✅ Customers can't access other customers' data
- ✅ Frontend can NEVER access secret keys

## 🧪 Test Cards (for Testing Only)

When testing payments, use these Stripe test cards:

| Card Number         | Result   |
|---------------------|----------|
| 4242 4242 4242 4242 | Success  |
| 4000 0000 0000 0002 | Declined |

- Use any future expiry (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)

## 🚀 After Adding Keys

Restart your application:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

That's it! Customers can now make secure payments through Isha Treat's Stripe account.

## 📖 Full Documentation

For complete security details, see: [STRIPE_SECURITY_SETUP.md](../STRIPE_SECURITY_SETUP.md)
