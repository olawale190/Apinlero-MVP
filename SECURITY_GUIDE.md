# Apinlero Security Guide

This document outlines the security model for Apinlero, including RLS policies, environment configuration, and best practices for a multi-tenant SaaS.

---

## Current Security Status

> **WARNING**: RLS is currently DISABLED for testing (as of Jan 23, 2026)
>
> Before going to production, run the SQL in the "Production RLS Policies" section below.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vercel)                       │
│                   Uses: ANON KEY (public)                    │
│         Can: Read public data, write with auth token         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Database)                       │
│              RLS Policies control all access                 │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│              Uses: SERVICE ROLE KEY (secret)                 │
│                  Bypasses RLS completely                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Principle
- **Frontend (Dashboard)**: Uses `anon` key → Subject to RLS policies
- **Backend (WhatsApp Bot)**: Uses `service_role` key → Bypasses RLS (trusted server)

---

## Environment Variables

### Frontend (.env.local / Vercel)
```bash
# PUBLIC - safe to expose in browser
VITE_SUPABASE_URL=https://***REMOVED***.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # anon key - limited by RLS
```

### Backend (Railway)
```bash
# SECRET - never expose to browser
SUPABASE_URL=https://***REMOVED***.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # service role - bypasses RLS
```

### Environment Validation
Add this to app startup to catch misconfigurations early:

```typescript
// Frontend: src/lib/validateEnv.ts
export function validateEnvironment() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // Validate URL format
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url.includes('supabase.co')) {
    console.warn('VITE_SUPABASE_URL may be incorrect:', url);
  }

  // Check we're using the correct project
  const expectedProject = '***REMOVED***';
  if (!url.includes(expectedProject)) {
    console.error(`Wrong Supabase project! Expected ${expectedProject}`);
    throw new Error('Supabase project mismatch');
  }
}
```

```javascript
// Backend: whatsapp-bot/src/validateEnv.js
export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    process.exit(1);
  }

  // Validate service key (should start with eyJ and be longer than anon key)
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey.startsWith('eyJ') || serviceKey.length < 200) {
    console.error('❌ SUPABASE_SERVICE_KEY appears invalid');
    process.exit(1);
  }

  console.log('✅ Environment validated');
}
```

---

## Storage Buckets

| Bucket | Visibility | Purpose | Who Can Access |
|--------|------------|---------|----------------|
| `apinlero-products` | PUBLIC | Product catalog images | Anyone can read, authenticated can write |
| `apinlero-media` | PRIVATE | WhatsApp media (customer images) | Backend only (service key) |
| `apinlero-documents` | PRIVATE | Receipts, invoices | Backend only (service key) |

---

## Production RLS Policies

Run this SQL in Supabase Dashboard → SQL Editor to enable proper security:

```sql
-- ============================================================================
-- APINLERO PRODUCTION RLS POLICIES
-- Run this BEFORE going live with real customers
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Products Table Policies
-- Products are publicly readable, only authenticated users can modify
-- ============================================================================

DROP POLICY IF EXISTS "Products are publicly readable" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

CREATE POLICY "Products are publicly readable"
ON products FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- STEP 3: Orders Table Policies
-- Orders readable by authenticated users, writable by service role
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can read orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;

CREATE POLICY "Authenticated can read orders"
ON orders FOR SELECT
TO authenticated
USING (true);

-- Note: WhatsApp bot uses service_role key which bypasses RLS
-- So no INSERT policy needed for anon

-- ============================================================================
-- STEP 4: Customers Table Policies
-- Customers managed by service role (WhatsApp bot)
-- Dashboard can read for analytics
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can read customers" ON customers;

CREATE POLICY "Authenticated can read customers"
ON customers FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 5: Storage Policies
-- ============================================================================

-- Drop overly permissive test policies
DROP POLICY IF EXISTS "Allow all operations on storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow all bucket access" ON storage.buckets;

-- Products bucket (PUBLIC)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete product images" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'apinlero-products');

CREATE POLICY "Authenticated upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apinlero-products');

CREATE POLICY "Authenticated update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'apinlero-products');

CREATE POLICY "Authenticated delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'apinlero-products');

-- Media and Documents buckets (PRIVATE)
-- No policies needed - service_role key bypasses RLS
-- This means ONLY the backend can access these buckets

-- ============================================================================
-- STEP 6: Revoke excessive grants (if previously granted)
-- ============================================================================

-- Only revoke if you previously ran "GRANT ALL" for testing
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- GRANT SELECT ON products TO anon;  -- Products are public

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check RLS is enabled:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'orders', 'customers', 'conversations', 'messages', 'media_files');

-- Check storage policies:
SELECT policyname, cmd, tablename
FROM pg_policies
WHERE schemaname = 'storage';
```

---

## Multi-Tenant Security (Future)

When supporting multiple businesses, add `business_id` to RLS:

```sql
-- Example: Users can only see their own business's products
CREATE POLICY "Users see own business products"
ON products FOR SELECT
TO authenticated
USING (
  business_id = (
    SELECT business_id FROM user_business_mapping
    WHERE user_id = auth.uid()
  )
);
```

---

## Common Issues & Solutions

### Issue: "Permission denied for table X"
**Cause**: RLS enabled but no policy grants access
**Solution**: Check policies exist for the table and role

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'X';
```

### Issue: "Storage bucket not found"
**Cause**: `listBuckets()` blocked by RLS
**Solution**: Upload directly without checking bucket exists first

### Issue: "Invalid JWT" or "JWT expired"
**Cause**: Using wrong key or expired token
**Solution**: Verify environment variables are correct

### Issue: Uploads work locally but fail in production
**Cause**: Vercel env vars different from local
**Solution**: Always sync both environments:
```bash
# Check Vercel env vars
npx vercel env ls

# Update if needed
npx vercel env rm VITE_SUPABASE_URL production --yes
npx vercel env add VITE_SUPABASE_URL production
```

---

## Security Checklist (Before Production)

- [ ] RLS enabled on all tables
- [ ] Storage policies configured correctly
- [ ] Service role key ONLY on backend (Railway)
- [ ] Anon key used on frontend (Vercel)
- [ ] Environment validation runs on startup
- [ ] No secrets in git repository
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting on WhatsApp webhook
- [ ] Input validation on all user inputs

---

## Sensitive Data Locations

| Data | Location | Protection |
|------|----------|------------|
| Customer phone numbers | `customers` table | RLS + service role only |
| WhatsApp media | `apinlero-media` bucket | Private bucket, signed URLs |
| Order details | `orders` table | RLS, authenticated read |
| API keys | Railway/Vercel env vars | Never in code |

---

## Useful Commands

```bash
# Check which Supabase project you're connected to
echo $VITE_SUPABASE_URL

# Verify Vercel has correct env vars
npx vercel env ls production

# Test storage upload (from browser console)
const { data, error } = await supabase.storage
  .from('apinlero-products')
  .upload('test.txt', 'hello');
console.log(data, error);
```

---

## Contact for Security Issues

If you discover a security vulnerability, please handle it responsibly:
1. Do not publicly disclose until fixed
2. Contact the development team immediately
3. Document the steps to reproduce

---

*Last Updated: January 23, 2026*
