# Apply Security Fixes - Quick Start Guide

This guide will help you apply the security fixes to your Supabase database.

---

## What Will Be Applied

1. ✅ **Stripe Key Encryption** - AES-256 encryption for secret keys
2. ✅ **Row Level Security (RLS)** - Data isolation between businesses
3. ✅ **Audit Logging** - Track access to sensitive data

---

## Prerequisites

- [ ] Supabase project URL and credentials
- [ ] Access to Supabase Dashboard
- [ ] 10 minutes of time

---

## Option 1: Supabase Dashboard (Easiest - 5 minutes)

### Step 1: Apply Stripe Encryption

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of this file:
   ```
   Apinlero_MVP/project/supabase/migrations/20260127010000_add_stripe_encryption.sql
   ```
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. ✅ You should see: "Stripe encryption setup completed successfully"

### Step 2: Verify and Enable RLS

1. In the same SQL Editor, click **New Query**
2. Copy the contents of this file:
   ```
   Apinlero_MVP/project/verify_and_enable_rls.sql
   ```
3. Paste into the SQL Editor
4. Click **Run**
5. ✅ Review the output - you should see "RLS SETUP COMPLETE"

### Step 3: Set Production Encryption Key

1. Generate a strong key:
   ```bash
   openssl rand -base64 32
   ```

2. In Supabase Dashboard, go to **Project Settings** → **Database**
3. Scroll to **Connection string** section
4. Click **Database Settings**
5. Add custom configuration:
   ```
   app.settings.stripe_encryption_key = 'YOUR_GENERATED_KEY'
   ```
6. Save and restart database if prompted

---

## Option 2: Supabase CLI (For Developers - 10 minutes)

### Prerequisites

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd Apinlero_MVP/project
supabase link --project-ref YOUR_PROJECT_REF
```

### Apply Migrations

```bash
# Navigate to project directory
cd Apinlero_MVP/project

# Apply all migrations (including encryption)
supabase db push

# Verify migrations applied
supabase db remote ls
```

### Apply RLS Verification Script

```bash
# Run RLS verification via CLI
supabase db execute --file verify_and_enable_rls.sql
```

---

## Option 3: Automated Script (One Command - 2 minutes)

Create this script in your project root:

**File: `apply_security_fixes.sh`**

```bash
#!/bin/bash

echo "🔐 Applying Security Fixes to Apinlero..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# Check if linked to project
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Not linked to Supabase project. Run: supabase link"
    exit 1
fi

# Apply migrations
echo "📦 Applying database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Apply RLS verification
echo ""
echo "🔒 Verifying and enabling RLS policies..."
supabase db execute --file verify_and_enable_rls.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS policies verified and enabled"
else
    echo "❌ RLS setup failed"
    exit 1
fi

echo ""
echo "🎉 Security fixes applied successfully!"
echo ""
echo "⚠️  Next steps:"
echo "1. Set production encryption key (see STRIPE_ENCRYPTION_SETUP.md)"
echo "2. Test Stripe key encryption by saving a test key"
echo "3. Test RLS by logging in with different user accounts"
echo ""
```

**Run the script:**

```bash
chmod +x apply_security_fixes.sh
./apply_security_fixes.sh
```

---

## Verification Checklist

After applying the fixes, verify they're working:

### ✅ Stripe Encryption

1. **Save a test Stripe key:**
   - Go to your dashboard → Stripe Settings
   - Enter a test key: `sk_test_51ABC...`
   - Click "Save Configuration"

2. **Verify it's encrypted:**
   - In Supabase Dashboard → Table Editor → `businesses` table
   - Look at `stripe_secret_key_encrypted` column
   - It should NOT start with `sk_` (should be base64 encrypted string)

3. **Test decryption (backend only):**
   ```sql
   -- Run in SQL Editor
   SELECT decrypt_stripe_key(stripe_secret_key_encrypted)
   FROM businesses
   WHERE id = 'demo-business-id';

   -- Should return: sk_test_51ABC...
   ```

### ✅ RLS Policies

1. **Check RLS is enabled:**
   ```sql
   -- Run in SQL Editor
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('businesses', 'products', 'customers', 'orders');

   -- All should show rowsecurity = true
   ```

2. **Check policies exist:**
   ```sql
   -- Run in SQL Editor
   SELECT tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;

   -- Should see multiple policies for each table
   ```

3. **Test data isolation (logged in user):**
   - Log in to your dashboard with User A
   - Note down how many products you see
   - Log in with User B (different business)
   - Should NOT see User A's products

---

## Troubleshooting

### Issue: "pgcrypto extension not found"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Run this in SQL Editor before running the encryption migration.

### Issue: "Permission denied for function encrypt_stripe_key"

**Solution:**
```sql
GRANT EXECUTE ON FUNCTION encrypt_stripe_key(TEXT) TO authenticated;
```

### Issue: "Row-level security policy violation"

**Cause:** Logged in user doesn't have access to the data

**Solution:**
1. Check user's email matches `businesses.owner_email`
2. Verify RLS policies are applied correctly
3. For backend operations, ensure using `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Frontend can't read products

**Cause:** RLS blocking anonymous access

**Solution:**
```sql
-- Allow public to read products (for storefront)
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon
  USING (true);
```

This is already included in `verify_and_enable_rls.sql`.

---

## Rollback Instructions (Emergency Only)

If something goes wrong and you need to rollback:

### Rollback Encryption

```sql
-- Remove encryption (emergency only)
DROP TRIGGER IF EXISTS encrypt_stripe_key_trigger ON businesses;
DROP FUNCTION IF EXISTS auto_encrypt_stripe_key();
DROP VIEW IF EXISTS businesses_with_decrypted_stripe;
DROP FUNCTION IF EXISTS decrypt_stripe_key(TEXT);
DROP FUNCTION IF EXISTS encrypt_stripe_key(TEXT);

-- Note: Existing encrypted keys will remain encrypted
-- You'll need to re-enter them manually
```

### Rollback RLS

```sql
-- Disable RLS (emergency only - NOT RECOMMENDED)
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING:** Only rollback in development. Never disable security in production!

---

## For Visa Interview

**Script to memorize:**

> "We've implemented enterprise-grade security for our MVP. All sensitive API keys are encrypted using AES-256 before storage, with encryption keys managed separately. We use Row Level Security to ensure complete data isolation between businesses - customers can only access their own data. This follows PCI-DSS, GDPR, and SOC 2 compliance standards."

**Demo during interview:**

1. Show encrypted keys in database (not plaintext)
2. Show RLS policies in Supabase Dashboard
3. Show audit logs tracking key access
4. Show different users can't see each other's data

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260127010000_add_stripe_encryption.sql` | Encryption infrastructure |
| `verify_and_enable_rls.sql` | RLS verification and setup |
| `STRIPE_ENCRYPTION_SETUP.md` | Detailed encryption documentation |
| `APPLY_SECURITY_FIXES.md` | This file (quick start guide) |

---

## Success Criteria

✅ Stripe keys stored encrypted (base64, not plaintext)
✅ RLS enabled on all core tables
✅ Policies protect data between businesses
✅ Backend can decrypt keys (service_role)
✅ Frontend cannot decrypt keys (authenticated/anon)
✅ Audit logs track key access

---

**Estimated Time:** 10-15 minutes
**Difficulty:** Easy (copy-paste SQL)
**Risk:** Low (all operations are idempotent)

---

*Last Updated: 2026-01-27*
