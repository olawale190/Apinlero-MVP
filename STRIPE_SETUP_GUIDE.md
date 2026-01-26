# Stripe Setup Guide for Apinlero
## Payment Architecture & Implementation

**Last Updated:** January 26, 2026

---

## Table of Contents
1. [Business Model Overview](#business-model-overview)
2. [Who Should Set Up Stripe?](#who-should-set-up-stripe)
3. [Option A: Per-Business Stripe Accounts (Recommended)](#option-a-per-business-stripe-accounts-recommended)
4. [Option B: Stripe Connect (Marketplace Model)](#option-b-stripe-connect-marketplace-model)
5. [Implementation Steps](#implementation-steps)
6. [Testing Guide](#testing-guide)

---

## Business Model Overview

Apinlero has **TWO types of payments**:

### 1. Platform Subscription Payments
- **Who pays:** Businesses (like Isha's Treat)
- **Who receives:** Apinlero
- **Amount:** £150-350/month (SaaS subscription)
- **Purpose:** Access to the Apinlero platform

### 2. Customer Order Payments
- **Who pays:** End customers (Isha's customers)
- **Who receives:** The business (Isha's Treat)
- **Amount:** Variable (product prices)
- **Purpose:** Payment for products/services

**This guide focuses on #2 - Customer Order Payments**

---

## Who Should Set Up Stripe?

### Current Architecture Decision

You need to choose between two models:

| Model | Who Owns Stripe | Best For | Complexity |
|-------|----------------|----------|------------|
| **Option A: Per-Business** | Each business (Isha's Treat) | SaaS platforms where businesses keep 100% of revenue | Simple ⭐ |
| **Option B: Stripe Connect** | Platform (Apinlero) with connected accounts | Marketplaces taking transaction fees | Complex ⭐⭐⭐ |

### Recommendation: **Option A - Per-Business Stripe Accounts**

**Why?**
1. ✅ Apinlero is a **SaaS platform**, not a marketplace
2. ✅ Businesses pay a **subscription fee** (£150-350/month), NOT transaction fees
3. ✅ Each business should **own their payment data** and keep 100% of order revenue
4. ✅ Simpler compliance and legal structure
5. ✅ Businesses can use existing Stripe accounts
6. ✅ Less regulatory burden on Apinlero

**How it works:**
```
Customer → Pays → Business's Stripe Account → Business receives money
                                              ↓
                         Business pays monthly subscription to Apinlero
```

---

## Option A: Per-Business Stripe Accounts (Recommended)

### Architecture

Each business (customer of Apinlero) creates their own Stripe account and provides API keys to Apinlero.

### Setup Process

#### For You (Developer/Apinlero)

**1. Update Database Schema**

Add Stripe credentials to the businesses/users table:

```sql
-- Add Stripe API key columns to store per-business credentials
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account
ON businesses(stripe_account_id);

-- Security: Encrypt sensitive keys using Supabase Vault (recommended)
-- Or use application-level encryption
```

**2. Update Environment Variables**

For your own Apinlero subscription payments (businesses paying you):

```bash
# .env
# Apinlero's Stripe Account (for subscription payments from businesses)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Apinlero Stripe public key
STRIPE_SECRET_KEY=sk_test_...             # Your Apinlero Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...           # Your webhook secret
```

**3. Update Stripe Integration Code**

Modify [src/lib/stripe.ts](project/src/lib/stripe.ts) to support per-business accounts:

```typescript
/**
 * Get Stripe instance for a specific business
 * @param businessId - The business ID to get Stripe keys for
 */
export async function getBusinessStripe(businessId: string): Promise<Stripe | null> {
  try {
    // Fetch business Stripe keys from database
    const { data: business, error } = await supabase
      .from('businesses')
      .select('stripe_publishable_key')
      .eq('id', businessId)
      .single();

    if (error || !business?.stripe_publishable_key) {
      console.error('No Stripe keys found for business:', businessId);
      return null;
    }

    // Load Stripe with business's publishable key
    return await loadStripe(business.stripe_publishable_key);
  } catch (error) {
    console.error('Error loading business Stripe:', error);
    return null;
  }
}

/**
 * Create payment intent using business's Stripe account
 */
export async function createBusinessPaymentIntent(
  businessId: string,
  amount: number,
  orderId: string,
  customerEmail?: string
) {
  // This calls your backend which uses the business's secret key
  const { data, error } = await supabase.functions.invoke(
    'create-payment-intent',
    {
      body: {
        businessId,  // New: specify which business
        amount,
        orderId,
        customerEmail,
      },
    }
  );

  return data;
}
```

**4. Create Business Settings Page**

Add a settings page where businesses can connect their Stripe account:

```typescript
// src/pages/StripeSettings.tsx
export function StripeSettings() {
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    // Validate keys first
    if (!publishableKey.startsWith('pk_')) {
      alert('Invalid publishable key format');
      return;
    }

    // Save to database (encrypt secret key)
    const { error } = await supabase
      .from('businesses')
      .update({
        stripe_publishable_key: publishableKey,
        stripe_secret_key_encrypted: await encryptKey(secretKey),
        stripe_connected_at: new Date().toISOString(),
      })
      .eq('id', currentBusinessId);

    if (!error) {
      setIsConnected(true);
      alert('Stripe connected successfully!');
    }
  };

  return (
    <div className="stripe-settings">
      <h2>Connect Your Stripe Account</h2>

      <div className="instructions">
        <p>To accept online payments, connect your Stripe account:</p>
        <ol>
          <li>Create a Stripe account at <a href="https://stripe.com" target="_blank">stripe.com</a></li>
          <li>Get your API keys from the Stripe Dashboard</li>
          <li>Enter them below</li>
        </ol>
      </div>

      <div className="form">
        <label>
          Publishable Key (pk_...)
          <input
            type="text"
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="pk_test_..."
          />
        </label>

        <label>
          Secret Key (sk_...)
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="sk_test_..."
          />
        </label>

        <button onClick={handleConnect}>Connect Stripe</button>
      </div>

      {isConnected && (
        <div className="success">
          ✅ Stripe connected! You can now accept online payments.
        </div>
      )}
    </div>
  );
}
```

#### For Each Business (Like Isha's Treat)

**Step 1: Create Stripe Account**

1. Go to [stripe.com](https://stripe.com)
2. Click "Sign Up" (or "Start Now")
3. Fill in business details:
   - Business name: "Isha's Treat & Groceries"
   - Business type: Retail / E-commerce
   - Country: United Kingdom
   - Currency: GBP (£)

**Step 2: Complete Stripe Onboarding**

1. Verify email address
2. Add business information:
   - Business address
   - Tax ID / Company number
   - Bank account details (for payouts)
3. Verify identity (upload ID if required)

**Step 3: Get API Keys**

1. Go to Stripe Dashboard
2. Navigate to **Developers → API Keys**
3. Copy:
   - **Publishable key** (starts with `pk_test_...` for testing)
   - **Secret key** (starts with `sk_test_...` for testing)

**Step 4: Connect to Apinlero**

1. Log in to Apinlero dashboard at [app.apinlero.com](https://app.apinlero.com)
2. Go to **Settings → Payments**
3. Click "Connect Stripe Account"
4. Paste your API keys
5. Save

**Step 5: Set Up Webhooks**

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click "Add Endpoint"
3. Endpoint URL: `https://***REMOVED***.supabase.co/functions/v1/stripe-webhook?business_id=YOUR_BUSINESS_ID`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Add it to your Apinlero settings

---

## Option B: Stripe Connect (Marketplace Model)

**⚠️ Use this only if:**
- Apinlero wants to take a percentage of each transaction (marketplace fees)
- You want centralized payment management
- You're willing to handle payment compliance and regulations

### How It Works

```
Customer → Pays → Apinlero's Stripe (Platform)
                       ↓
                  Split payment:
                  - 95% → Business (Isha's Treat) Connected Account
                  - 5% → Apinlero (platform fee)
```

### Implementation

This is significantly more complex and requires:
1. Stripe Connect integration
2. Connected accounts for each business
3. Application fees or transfers
4. Additional compliance requirements

**We recommend starting with Option A and migrating to Connect later if needed.**

---

## Implementation Steps

### Phase 1: Setup (For Isha's Treat - Pilot)

**Week 1: Isha's Treat creates Stripe account**
1. ✅ Sign up at stripe.com
2. ✅ Complete business verification
3. ✅ Get API keys (test mode first)

**Week 2: Developer integrates**
1. ✅ Add Stripe credentials to database
2. ✅ Update payment flow to use Isha's keys
3. ✅ Set up webhooks
4. ✅ Test payments

### Phase 2: Testing

1. Use Stripe test cards (see below)
2. Place test orders
3. Verify payments appear in Isha's Stripe Dashboard
4. Test refunds
5. Test webhook events

### Phase 3: Go Live

1. Switch to **live mode** API keys
2. Update webhook endpoints
3. Test with real £0.30 transaction
4. Monitor for 24 hours
5. Announce to customers

### Phase 4: Scale (For Additional Businesses)

1. Create self-service Stripe connection flow
2. Add Stripe status to dashboard
3. Create documentation for new businesses
4. Build verification system

---

## Testing Guide

### Test Cards (Stripe Test Mode)

| Scenario | Card Number | Expiry | CVC | ZIP |
|----------|-------------|--------|-----|-----|
| ✅ Success | 4242 4242 4242 4242 | 12/34 | 123 | 12345 |
| ❌ Decline | 4000 0000 0000 0002 | 12/34 | 123 | 12345 |
| 🔐 3D Secure | 4000 0025 0000 3155 | 12/34 | 123 | 12345 |
| ❌ Insufficient Funds | 4000 0000 0000 9995 | 12/34 | 123 | 12345 |

### Test Flow

1. **Add products** to cart on [ishas-treat.apinlero.com](https://ishas-treat.apinlero.com)
2. **Go to checkout**
3. **Enter test card** details
4. **Complete payment**
5. **Verify:**
   - Order shows "Paid" in Apinlero dashboard
   - Payment appears in Stripe Dashboard
   - Webhook fired successfully
   - Customer receives confirmation

### Verification Checklist

- [ ] Payment succeeds with test card
- [ ] Order status updates to "paid"
- [ ] Funds appear in Stripe Dashboard
- [ ] Webhook delivers successfully
- [ ] Email confirmation sent
- [ ] Refund works
- [ ] Failed payment handled gracefully

---

## Security Best Practices

### ⚠️ CRITICAL: Never Expose Secret Keys

```bash
# ✅ GOOD: Server-side only
STRIPE_SECRET_KEY=sk_test_...  # Backend/Edge Function only

# ❌ BAD: Never in frontend
VITE_STRIPE_SECRET_KEY=sk_test_...  # NEVER DO THIS!
```

### Encrypt Stored Keys

```typescript
// Use Supabase Vault or application-level encryption
import { createCipher, createDecipher } from 'crypto';

const encryptKey = (key: string): string => {
  // Implement encryption
  // Use environment-specific encryption key
};

const decryptKey = (encrypted: string): string => {
  // Implement decryption
};
```

### Key Storage Rules

1. ✅ **Publishable keys** (pk_...) can be in frontend
2. ❌ **Secret keys** (sk_...) must NEVER be in frontend
3. ✅ **Secret keys** only in backend/Edge Functions
4. ✅ Encrypt secret keys in database
5. ✅ Use environment variables
6. ✅ Rotate keys regularly
7. ✅ Use test keys in development

---

## FAQs

### Q: Who pays Stripe fees?
**A:** The business (Isha's Treat) pays Stripe's standard fees (1.4% + 20p for UK cards) from their revenue.

### Q: Does Apinlero see the payment details?
**A:** No. Payments go directly to the business's Stripe account. Apinlero only receives webhook notifications about payment status (succeeded/failed).

### Q: What if a business doesn't have Stripe?
**A:** They can still accept cash, bank transfer, and phone orders. Online card payments require Stripe connection.

### Q: Can businesses use existing Stripe accounts?
**A:** Yes! If they already have Stripe, they just need to provide their API keys.

### Q: What about refunds?
**A:** Businesses process refunds through their own Stripe Dashboard or via Apinlero dashboard (which calls their Stripe API).

### Q: Test vs Live mode?
**A:** Always start in **test mode** (keys starting with `sk_test_` and `pk_test_`). Switch to **live mode** only after thorough testing.

---

## Next Steps

### For Developer (You)

1. ✅ Read this guide
2. ⬜ Decide: Option A or Option B?
3. ⬜ Implement database schema changes
4. ⬜ Build Stripe connection UI
5. ⬜ Update payment flow code
6. ⬜ Set up webhooks
7. ⬜ Test with test cards
8. ⬜ Document for businesses

### For Isha's Treat

1. ⬜ Create Stripe account
2. ⬜ Complete verification
3. ⬜ Get API keys (test mode)
4. ⬜ Provide keys to developer
5. ⬜ Test payments
6. ⬜ Switch to live mode
7. ⬜ Start accepting orders!

---

## Support Resources

- **Stripe Documentation:** [stripe.com/docs](https://stripe.com/docs)
- **Stripe Dashboard:** [dashboard.stripe.com](https://dashboard.stripe.com)
- **Test Cards:** [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhooks Guide:** [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

## Summary

**Recommended Approach:** Option A - Per-Business Stripe Accounts

**Who sets up:**
- **You (Developer):** Build the integration infrastructure
- **Isha's Treat (Business Partner):** Creates their own Stripe account and provides API keys

**Timeline:**
- Week 1: Isha creates Stripe account
- Week 2: Developer integrates
- Week 3: Testing
- Week 4: Go live

This approach gives businesses full control of their payments while keeping Apinlero's architecture simple and compliant.

---

*Questions? Check the [test-payment.md](project/.claude/skills/test-payment.md) skill for payment testing workflows.*
