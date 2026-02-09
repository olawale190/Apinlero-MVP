# Apply Performance Fix for Storefront Loading

## Problem
The storefront at `ishas-treat.apinlero.com` was taking 5 seconds to load due to slow Supabase queries.

## Solution
We've implemented a 3-layer fix:

1. **Database Index** - Add optimized index for slug lookups
2. **Fallback Strategy** - Use hardcoded data if Supabase is slow
3. **Reduced Timeouts** - Fail fast (2s) instead of waiting 10s

## Step 1: Apply Database Migration

Go to your Supabase dashboard:
1. Navigate to https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add performance index for business slug lookups
-- This dramatically speeds up the getBusinessBySlug() query

-- Add index on slug column for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug_active
ON businesses(slug)
WHERE is_active = true;

-- Also ensure slug is unique (should already be, but enforce it)
ALTER TABLE businesses
ADD CONSTRAINT businesses_slug_unique
UNIQUE (slug);

-- Add comment for documentation
COMMENT ON INDEX idx_businesses_slug_active IS
'Optimizes business lookup by subdomain slug for multi-tenant routing. Critical for storefront performance.';
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Verify the output shows "Success. No rows returned"

## Step 2: Deploy Code Changes

The code changes have already been committed. Just deploy:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
npx vercel --prod
```

## Step 3: Verify Fix

1. Visit https://ishas-treat.apinlero.com
2. Open browser console (F12 → Console tab)
3. Look for these logs:
   - `[BusinessContext] Initializing...`
   - `[business-resolver] Fetching business for slug: ishas-treat`
   - `[business-resolver] Query completed in XXXms` (should be <500ms now)
   - `[BusinessContext] ✅ Business loaded: Isha's Treat & Groceries`

4. The page should load in **under 1 second** total

## Expected Behavior After Fix

- **Before**: 5-second loading spinner, timeout warnings
- **After**: Instant load (<1s), smooth experience
- **If Supabase is down**: Still loads using fallback data

## Troubleshooting

If still slow after applying migration:

1. **Check Supabase project status**: Make sure it's not paused (free tier issue)
2. **Check RLS policies**: Ensure they're not causing slow queries
3. **Check network latency**: Test from different locations
4. **Enable connection pooling**: In Supabase settings → Database → Connection Pooling

## Files Changed

- `project/src/lib/business-resolver.ts` - Added fallback + reduced timeout
- `project/src/contexts/BusinessContext.tsx` - Reduced timeout 5s → 3s
- `project/supabase/migrations/20260209000000_add_business_slug_index.sql` - Database index
