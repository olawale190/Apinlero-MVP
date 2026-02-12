# Row Level Security (RLS) Policies

> **Status:** ✅ Active in Production
> **Migration:** `20260203000001_security_rls_policies.sql`

## Overview

Row Level Security ensures data isolation between users and businesses. Each table has specific policies controlling who can read, write, update, and delete records.

## Tables with RLS Enabled

### 1. customer_profiles

Customers can only access their own profile.

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Users can view own profile | `auth.uid() = user_id` |
| UPDATE | Users can update own profile | `auth.uid() = user_id` |
| INSERT | Users can insert own profile | `auth.uid() = user_id` |
| ALL | Service role has full access | `auth.role() = 'service_role'` |

### 2. businesses

Public can view active businesses; owners can manage their own.

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Public can view active businesses | `is_active = true` |
| ALL | Owners can manage own business | `owner_email = auth.jwt()->>'email'` |
| ALL | Service role has full access | `auth.role() = 'service_role'` |

### 3. products

Public can view products; management via service role.

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Public can view products | `true` (all products visible) |
| ALL | Service role has full access | `auth.role() = 'service_role'` |

**Note:** If `business_id` column exists, additional policies restrict management to business owners.

### 4. security_audit_log

Only service role can access audit logs.

| Operation | Policy | Condition |
|-----------|--------|-----------|
| ALL | Service role manages audit log | `auth.role() = 'service_role'` |

## Safe View: businesses_safe

A view that excludes sensitive columns:

```sql
CREATE VIEW businesses_safe AS
SELECT
  id, name, slug, logo_url, owner_email, is_active,
  stripe_publishable_key, stripe_account_id, stripe_connected_at,
  created_at, updated_at
  -- EXCLUDED: stripe_secret_key_encrypted, stripe_webhook_secret
FROM businesses;
```

This view is dynamically generated to handle schema changes.

## Policy Details

### Authentication Contexts

| Context | Description | Use Case |
|---------|-------------|----------|
| `anon` | Anonymous users | Public storefront |
| `authenticated` | Logged-in users | Customer dashboard |
| `service_role` | Backend/Edge Functions | Admin operations |

### Key Functions Used

```sql
-- Get current user's ID
auth.uid()

-- Get current user's JWT claims
auth.jwt()->>'email'

-- Get current role
auth.role()
```

## Conditional Policies

The migration uses dynamic checks for schema compatibility:

```sql
DO $$
BEGIN
  -- Only apply if table exists AND has required columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'business_id')
  THEN
    -- Apply policies
  END IF;
END $$;
```

This ensures the migration works regardless of schema state.

## Verification Queries

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'products', 'customer_profiles');
```

### List all policies:
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Test as specific user:
```sql
-- Set role to test user perspective
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to query
SELECT * FROM customer_profiles;

-- Reset
RESET ROLE;
```

## Troubleshooting

### "permission denied for table X"

**Cause:** User doesn't match any policy conditions.

**Solutions:**
1. Check user is authenticated
2. Verify user's email matches expected owner
3. For backend operations, use service role key

### "new row violates row-level security policy"

**Cause:** INSERT/UPDATE violates WITH CHECK condition.

**Solutions:**
1. Ensure `user_id` matches `auth.uid()` on insert
2. Verify business ownership on business updates

### Frontend can't read data

**Cause:** Anonymous users blocked by RLS.

**Solution:** Add explicit `TO anon` policies for public data:
```sql
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon
  USING (true);
```
