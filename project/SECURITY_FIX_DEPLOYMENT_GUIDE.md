# 🔒 Multi-Tenant Security Fix - Deployment Guide

## Overview

This guide walks you through deploying the JWT-based business_id claims system for secure multi-tenant isolation in Apinlero.

**Status:** ✅ All code changes complete - Ready for deployment
**Impact:** CRITICAL - Fixes cross-tenant data exposure vulnerabilities
**Estimated Time:** 30-45 minutes

---

## What Was Fixed

### Frontend Security Fixes ✅
- [Dashboard.tsx](src/pages/Dashboard.tsx) - Added business_id filtering to products/orders queries
- [InventoryManager.tsx](src/components/InventoryManager.tsx) - Added business_id validation to all 6 CRUD operations
- [Shop.tsx](src/pages/Shop.tsx) - Added business_id filtering to product listings

### Backend Security Fixes ✅
- [security.js](backend/src/middleware/security.js) - Extract business_id from JWT claims
- [index.js](backend/src/index.js) - Added business_id filtering to all API endpoints:
  - GET/POST `/api/products`
  - GET/PATCH `/api/orders`
  - GET `/api/insights`

### Database Schema ✅
- [Migration 002](migrations/002_add_jwt_business_claims.sql) - User-business associations, RLS policies
- [Edge Function](supabase/functions/add-business-claims/index.ts) - JWT claims customization

---

## Deployment Steps

### Step 1: Database Migration (15 min)

1. **Connect to Supabase**:
   ```bash
   # Open Supabase Dashboard
   open https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
   ```

2. **Run Migration SQL**:
   - Navigate to: SQL Editor → New Query
   - Copy contents of `migrations/002_add_jwt_business_claims.sql`
   - Execute the query
   - ✅ Verify: Run verification queries at end of migration file

3. **Seed user_businesses table** (if you have existing users):
   ```sql
   -- Check current businesses
   SELECT id, name, slug, owner_email FROM businesses;

   -- Check users
   SELECT id, email FROM auth.users;

   -- Manually link users to businesses (if auto-seed didn't work)
   INSERT INTO user_businesses (user_id, business_id, role)
   VALUES (
     'YOUR_USER_ID',  -- From auth.users
     'YOUR_BUSINESS_ID',  -- From businesses
     'owner'
   )
   ON CONFLICT (user_id, business_id) DO NOTHING;
   ```

4. **Test RLS Policies**:
   ```sql
   -- Set session user (simulate logged-in user)
   SELECT set_config('request.jwt.claims', '{"sub":"USER_ID"}', false);

   -- Try to query products (should only return user's businesses)
   SELECT * FROM products WHERE is_active = true;
   ```

---

### Step 2: Deploy Supabase Edge Function (10 min)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Set environment secrets**:
   ```bash
   # Get your service role key from: Dashboard → Settings → API
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

5. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy add-business-claims
   ```

6. **Enable the Database Webhook Hook**:
   - Go to: Dashboard → Database → Hooks
   - Click "Create a new hook"
   - Configuration:
     - **Hook name**: `add-business-claims-hook`
     - **Table**: `auth.users`
     - **Events**: `INSERT`, `UPDATE`
     - **Type**: `HTTP Request`
     - **Method**: `POST`
     - **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/add-business-claims`
     - **Headers**:
       ```json
       {
         "Content-Type": "application/json",
         "Authorization": "Bearer YOUR_ANON_KEY"
       }
       ```

---

### Step 3: Update Frontend Environment Variables (2 min)

**No changes needed** - The frontend already uses `useBusinessContext()` which works with subdomains.

Verify your `.env` file has:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

### Step 4: Deploy Backend API (10 min)

1. **Update Railway/Vercel environment variables**:
   ```env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   STRIPE_SECRET_KEY=your_stripe_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

2. **Deploy backend**:
   ```bash
   cd backend

   # If using Railway
   railway up

   # If using Vercel
   vercel --prod
   ```

3. **Test backend API**:
   ```bash
   # Health check
   curl https://your-backend-api.railway.app/health

   # Test products endpoint (should require business_id)
   curl https://your-backend-api.railway.app/api/products?business_id=YOUR_BUSINESS_ID
   ```

---

### Step 5: Deploy Frontend (5 min)

1. **Build frontend**:
   ```bash
   cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Verify deployment**:
   - Visit: `https://app.apinlero.com` (or your domain)
   - Log in with a test user
   - Check browser console for logs like:
     ```
     ✅ Authenticated user: test@example.com | Business: uuid-here | Role: owner
     ✅ Loaded 10 products from database
     ```

---

## Verification & Testing

### Test 1: JWT Contains business_id

1. Log in to your app
2. Open browser DevTools → Application → Local Storage
3. Find the `supabase.auth.token` entry
4. Copy the `access_token` value
5. Go to [jwt.io](https://jwt.io)
6. Paste the token
7. ✅ Verify the decoded payload contains:
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "business_id": "business-uuid",
     "business_ids": ["business-uuid-1", "business-uuid-2"],
     "business_role": "owner"
   }
   ```

### Test 2: Multi-Tenant Isolation

**Setup:**
1. Create two test businesses in database:
   ```sql
   INSERT INTO businesses (name, slug, owner_email, is_active)
   VALUES
     ('Business A', 'business-a', 'usera@test.com', true),
     ('Business B', 'business-b', 'userb@test.com', true);
   ```

2. Create test users and link them:
   ```sql
   -- After users sign up, link them to businesses
   INSERT INTO user_businesses (user_id, business_id, role)
   VALUES
     ('user-a-id', 'business-a-id', 'owner'),
     ('user-b-id', 'business-b-id', 'owner');
   ```

3. Create test products for each business:
   ```sql
   INSERT INTO products (business_id, name, price, is_active)
   VALUES
     ('business-a-id', 'Product A1', 10.00, true),
     ('business-b-id', 'Product B1', 20.00, true);
   ```

**Test:**
1. Log in as User A
2. Navigate to Dashboard → Inventory
3. ✅ Should ONLY see "Product A1"
4. Log out, log in as User B
5. ✅ Should ONLY see "Product B1"

### Test 3: API Endpoint Security

```bash
# Get User A's access token
USER_A_TOKEN="..."

# Get User B's business_id
BUSINESS_B_ID="..."

# Try to access Business B's products with User A's token
curl -X GET "https://your-api.com/api/products?business_id=${BUSINESS_B_ID}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}"

# ✅ Should return empty array or error (no access)
```

### Test 4: Frontend Business Context

1. Open browser console
2. Run:
   ```javascript
   // Should show current business context
   localStorage.getItem('supabase.auth.token')
   ```
3. ✅ Check for business_id in JWT payload

---

## Rollback Plan

If something goes wrong:

### Quick Rollback (Frontend/Backend)
```bash
# Rollback frontend
vercel rollback

# Rollback backend
railway rollback  # or vercel rollback for backend
```

### Database Rollback
```sql
-- Run rollback commands from migration file
DROP TABLE IF EXISTS user_businesses CASCADE;
DROP FUNCTION IF EXISTS get_user_business_id(uuid);
DROP FUNCTION IF EXISTS get_user_business_ids(uuid);
ALTER TABLE businesses DROP COLUMN IF EXISTS slug;
ALTER TABLE businesses DROP COLUMN IF EXISTS is_active;
ALTER TABLE businesses DROP COLUMN IF EXISTS owner_email;

-- Disable RLS on affected tables
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses DISABLE ROW LEVEL SECURITY;
```

### Edge Function Rollback
```bash
# Delete the Edge Function
supabase functions delete add-business-claims

# Disable the webhook hook in Supabase Dashboard
```

---

## Post-Deployment Monitoring

### Key Metrics to Watch

1. **Error Rates** (should stay low):
   - "No business_id found in JWT claims"
   - "business_id is required"

2. **Query Performance** (should be fast):
   - Products endpoint: < 200ms
   - Orders endpoint: < 300ms

3. **User Behavior**:
   - Users can only see their own business data
   - No cross-tenant data leakage

### Logging

Check logs for these patterns:

**✅ Good:**
```
✅ Authenticated user: user@example.com | Business: uuid | Role: owner
✅ [GET /api/products] Returned 10 products for business: uuid
✅ Loaded 10 products from database
```

**❌ Bad:**
```
⚠️ User user@example.com has no business_id in JWT claims
❌ Error loading products: RLS policy violation
⚠️ No business_id available, skipping products load
```

---

## Troubleshooting

### Issue: JWT doesn't contain business_id

**Symptoms:**
- Console warns: "User has no business_id in JWT claims"
- Products/orders don't load

**Fix:**
1. Check user_businesses table:
   ```sql
   SELECT * FROM user_businesses WHERE user_id = 'YOUR_USER_ID';
   ```
2. If empty, manually insert:
   ```sql
   INSERT INTO user_businesses (user_id, business_id, role)
   VALUES ('USER_ID', 'BUSINESS_ID', 'owner');
   ```
3. Log out and log back in (to get new JWT with claims)

### Issue: RLS policy blocks query

**Symptoms:**
- Error: "new row violates row-level security policy"
- Can't insert/update products

**Fix:**
1. Check RLS policies:
   ```sql
   SELECT schemaname, tablename, policyname FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'products';
   ```
2. Verify user has proper role in user_businesses
3. Temporarily disable RLS for debugging:
   ```sql
   ALTER TABLE products DISABLE ROW LEVEL SECURITY;
   ```

### Issue: Edge Function not triggering

**Symptoms:**
- New users don't get business_id in JWT
- Edge Function logs show no invocations

**Fix:**
1. Check webhook hook is enabled in Dashboard
2. Verify Edge Function is deployed:
   ```bash
   supabase functions list
   ```
3. Test manually:
   ```bash
   curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/add-business-claims" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type":"INSERT","table":"users","record":{"id":"test-id","email":"test@test.com"}}'
   ```

### Issue: Products show for wrong business

**Symptoms:**
- User A sees User B's products
- Cross-tenant data leakage

**Fix:**
1. Check BusinessContext is loading correctly:
   ```javascript
   // In browser console
   console.log(business?.id)  // Should match your business
   ```
2. Verify backend logs show correct business_id:
   ```
   ✅ [GET /api/products] Returned products for business: <correct-uuid>
   ```
3. Check database queries include business_id filter:
   ```sql
   SELECT * FROM products WHERE business_id = 'YOUR_BUSINESS_ID';
   ```

---

## Success Criteria

✅ Deployment is successful when:

1. Users can only see their own business's data
2. JWT tokens contain `business_id` claim
3. API endpoints filter by `business_id`
4. RLS policies enforce tenant isolation
5. No cross-tenant data leakage in tests
6. All frontend pages load without errors
7. Backend logs show business_id in requests

---

## Support & Questions

If you encounter issues:

1. Check logs in:
   - Supabase Dashboard → Logs → Edge Functions
   - Backend deployment logs (Railway/Vercel)
   - Browser console (frontend)

2. Review this guide's Troubleshooting section

3. Test with the verification scripts above

4. Contact: Claude Code (AI Assistant) for further help

---

## Summary of Changes

### Files Created
- `migrations/002_add_jwt_business_claims.sql` - Database schema
- `supabase/functions/add-business-claims/index.ts` - JWT claims Edge Function
- `SECURITY_FIX_DEPLOYMENT_GUIDE.md` - This guide

### Files Modified
- `src/pages/Dashboard.tsx` - Added business_id filtering
- `src/components/InventoryManager.tsx` - Added business_id validation (6 operations)
- `src/pages/Shop.tsx` - Added business_id filtering
- `backend/src/middleware/security.js` - JWT claims extraction + business context
- `backend/src/index.js` - business_id filtering on all endpoints
- `src/contexts/BusinessContext.tsx` - Default business fallback for localhost

### Database Changes
- New table: `user_businesses` (user-to-business associations)
- New columns: `businesses.slug`, `businesses.owner_email`, `businesses.is_active`
- New functions: `get_user_business_id()`, `get_user_business_ids()`
- New RLS policies: Multi-tenant isolation for products, orders, categories

---

**Deployment Status:** 🟡 Ready to Deploy
**Security Impact:** 🔴 Critical - Deploy ASAP
**Estimated Downtime:** 0 minutes (rolling deployment)

Good luck with the deployment! 🚀
