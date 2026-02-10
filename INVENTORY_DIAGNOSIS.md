# Inventory Issue Diagnosis

## Problem
No products showing in the inventory on `app.apinlero.com/dashboard`

## Root Cause
The dashboard at `app.apinlero.com` cannot load products because:

1. **BusinessContext skips loading on app.apinlero.com** (line 72-78 in BusinessContext.tsx)
   - The context is designed for client storefronts (e.g., `ishas-treat.apinlero.com`)
   - It explicitly returns early for the `app` subdomain

2. **Dashboard requires business.id to load products** (line 156-160 in Dashboard.tsx)
   ```typescript
   const loadProducts = async () => {
     if (!business?.id) {
       console.warn('⚠️ No business_id available, skipping products load');
       return; // ← Returns without loading!
     }
   ```

3. **Result**: `business` is `null` → products never load → empty inventory

## Solution
The dashboard needs to get the business from the **authenticated user**, not from the subdomain.

### Architecture
The system has a `user_businesses` table that links users to their businesses:
- `user_id` → `business_id` + `role` (owner/admin/staff)
- See migration: `002_add_jwt_business_claims.sql`

### Fix Required
Update the Dashboard to:
1. Get the current authenticated user
2. Query `user_businesses` table to find their business(es)
3. Load products using that business_id

## SQL to Check Database

Run these queries in Supabase SQL Editor to diagnose:

```sql
-- 1. Check if business exists
SELECT id, slug, name, owner_email, is_active
FROM businesses
WHERE slug = 'ishas-treat';

-- 2. Check if user exists
SELECT id, email
FROM auth.users
LIMIT 5;

-- 3. Check user-business linkage
SELECT
  ub.user_id,
  ub.business_id,
  ub.role,
  u.email as user_email,
  b.name as business_name,
  b.slug as business_slug
FROM user_businesses ub
INNER JOIN auth.users u ON ub.user_id = u.id
INNER JOIN businesses b ON ub.business_id = b.id;

-- 4. Check products count
SELECT
  b.name as business_name,
  b.slug,
  COUNT(p.id) as product_count
FROM businesses b
LEFT JOIN products p ON p.business_id = b.id AND p.is_active = true
GROUP BY b.id, b.name, b.slug;

-- 5. Check if products exist but with wrong business_id
SELECT business_id, COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY business_id;
```

## Next Steps

1. **Run diagnostics** - Execute SQL queries above to identify the issue
2. **Implement fix** - Update Dashboard to load business from authenticated user
3. **Test** - Verify products load correctly in dashboard

## Expected Behavior After Fix

When logged in at `app.apinlero.com`:
- Dashboard gets current user's email
- Looks up user's business via `user_businesses` table
- Loads products for that business
- Displays full inventory
