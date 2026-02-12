# Security Fixes Applied - February 3, 2026

## Summary

This document outlines the critical security fixes applied to the Apinlero MVP to protect Stripe API keys, prevent injection attacks, and ensure safe multi-tenant operation.

---

## 1. Stripe Secret Key Encryption (CRITICAL)

### Problem
Stripe secret keys (`sk_test_*`, `sk_live_*`) were stored in plaintext in the database.

### Solution
- Created AES-256-GCM encryption module: `supabase/functions/_shared/crypto.ts`
- Keys are now encrypted before storage with format: `enc_v1:<base64-ciphertext>`
- Decryption happens only in Edge Functions (server-side)

### Files Changed
- `supabase/functions/_shared/crypto.ts` (NEW)
- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/save-stripe-config/index.ts` (NEW)

### Required Setup
```bash
# Generate a secure encryption key (32+ characters)
openssl rand -hex 32

# Set the key in Supabase
supabase secrets set ENCRYPTION_KEY=your-64-char-hex-key-here
```

---

## 2. Business ID Isolation (CRITICAL)

### Problem
`StripeSettings.tsx` had a hardcoded `BUSINESS_ID = 'demo-business-id'`, allowing any user to modify any business's Stripe configuration.

### Solution
- Removed hardcoded business ID
- Now uses `useBusinessContext()` to get the current business
- Added authentication check with `useAuth()`
- Server-side validation ensures user owns the business before saving

### Files Changed
- `src/pages/StripeSettings.tsx`
- `supabase/functions/save-stripe-config/index.ts` (NEW)

---

## 3. Secret Key Exposure Removed (HIGH)

### Problem
Stripe secret keys were being sent through the frontend and exposed in browser DevTools.

### Solution
- Frontend now sends keys to Edge Function for server-side encryption
- Created new `save-stripe-config` Edge Function
- Secret keys are encrypted immediately upon receipt
- Frontend never receives decrypted secret keys

### Files Changed
- `src/pages/StripeSettings.tsx`
- `supabase/functions/save-stripe-config/index.ts` (NEW)

---

## 4. Input Sanitization for WhatsApp Bot (HIGH)

### Problem
WhatsApp messages were processed without sanitization, risking injection attacks.

### Solution
- Created comprehensive sanitization module: `whatsapp-bot/src/input-sanitizer.js`
- All user inputs are now sanitized before processing
- Includes: message text, customer names, addresses, postcodes, phone numbers

### Functions Available
```javascript
import {
  sanitizeMessage,     // General message text
  sanitizeName,        // Customer names
  sanitizeAddress,     // Delivery addresses
  sanitizePostcode,    // UK postcodes (validated)
  sanitizePhone,       // Phone numbers
  sanitizeNotes,       // Order notes
  escapeHtml,          // For display contexts
} from './input-sanitizer.js';
```

### Files Changed
- `whatsapp-bot/src/input-sanitizer.js` (NEW)
- `whatsapp-bot/src/message-handler.js`
- `whatsapp-bot/src/message-parser.js`

---

## 5. Row Level Security (RLS) Policies (HIGH)

### Problem
Missing RLS policies could allow users to access other users' data.

### Solution
- Created comprehensive RLS migration
- Protects: `customer_profiles`, `orders`, `businesses`, `products`
- Service role maintains full access for backend operations
- Created `businesses_safe` view that excludes sensitive columns

### Migration File
- `supabase/migrations/20260203_security_rls_policies.sql`

### Apply the Migration
```bash
cd project
supabase db push
```

---

## 6. Rate Limiting (MEDIUM)

### Problem
No rate limiting on Edge Functions could allow DoS attacks.

### Solution
- Created rate limiter module: `supabase/functions/_shared/rate-limiter.ts`
- Applied to all payment-related endpoints
- Configurable limits per endpoint

### Rate Limits Applied
| Endpoint | Limit |
|----------|-------|
| create-payment-intent | 10/minute |
| save-stripe-config | 5/minute |
| test-stripe-connection | 5/minute |
| stripe-webhook | 100/minute |
| verify-order-total | 30/minute |

### Files Changed
- `supabase/functions/_shared/rate-limiter.ts` (NEW)
- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/test-stripe-connection/index.ts`

---

## Deployment Checklist

### Before Production:

1. **Set Encryption Key**
   ```bash
   supabase secrets set ENCRYPTION_KEY=$(openssl rand -hex 32)
   ```

2. **Apply RLS Migration**
   ```bash
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy save-stripe-config
   supabase functions deploy test-stripe-connection
   supabase functions deploy stripe-webhook
   supabase functions deploy verify-order-total
   ```

4. **Re-save Existing Stripe Keys**
   - Existing plaintext keys will still work (backward compatible)
   - Re-save through StripeSettings to encrypt them

5. **Verify Security**
   - Test that users can't access other users' profiles
   - Test that Stripe keys are encrypted in database
   - Test rate limiting (try >10 payment requests in 1 minute)

---

## Environment Variables

### Frontend (.env / Vercel)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Only publishable key!
```

### Supabase Edge Functions (secrets)
```bash
ENCRYPTION_KEY=<64-char-hex>
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Testing the Fixes

### 1. Test Stripe Key Encryption
```sql
-- Check if keys are encrypted (should start with 'enc_v1:')
SELECT id,
  CASE
    WHEN stripe_secret_key_encrypted LIKE 'enc_v1:%' THEN 'ENCRYPTED'
    WHEN stripe_secret_key_encrypted LIKE 'sk_%' THEN 'PLAINTEXT - NEEDS MIGRATION'
    ELSE 'NOT SET'
  END as encryption_status
FROM businesses;
```

### 2. Test RLS Policies
```sql
-- As an authenticated user, this should only return their profile
SELECT * FROM customer_profiles;

-- This should return 0 rows for other users' profiles
SELECT * FROM customer_profiles WHERE user_id != auth.uid();
```

### 3. Test Rate Limiting
```bash
# Make >10 requests quickly - should get 429 after limit
for i in {1..15}; do
  curl -X POST https://xxx.supabase.co/functions/v1/create-payment-intent \
    -H "Content-Type: application/json" \
    -d '{"businessId":"test","amount":10,"orderId":"test-'$i'"}' &
done
```

---

## Security Contacts

If you discover a security vulnerability, please report it to:
- Email: ol.walexy@gmail.com
- Do NOT create public GitHub issues for security vulnerabilities
