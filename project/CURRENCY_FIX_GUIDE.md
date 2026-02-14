# 🔧 Currency Fix Guide: £ (GBP) → ₦ (NGN)

**Issue:** Prices showing in Pounds (£) instead of Nigerian Naira (₦)

**Date:** 2026-02-12

**Status:** ✅ Code Fixed | ⏳ Database Migration Pending | ⏳ Deployment Pending

---

## What Was Changed

### 1. Frontend Configuration ✅ DONE
**File:** `src/config/shop.ts`

**Changes:**
```typescript
// Before
currency: '£',
deliveryFee: 5,
location: 'London, UK'

// After
currency: '₦',
deliveryFee: 500,
location: 'Lagos, Nigeria'
```

### 2. Database Migration ✅ CREATED
**File:** `supabase/migrations/20260212_fix_currency_to_naira.sql`

**What it does:**
- Updates all existing businesses from GBP → NGN
- Changes default currency to NGN
- Changes default timezone to Africa/Lagos

---

## 🚀 How to Apply the Fix

### Step 1: Apply Database Migration

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc
   - Click **SQL Editor**

2. **Run the migration:**
   - Copy the contents of `supabase/migrations/20260212_fix_currency_to_naira.sql`
   - Paste into SQL Editor
   - Click **RUN**

3. **Verify success:**
   You should see output like:
   ```
   ========================================
   Currency Migration Complete
   ========================================
   Total businesses: 1
   Businesses with NGN currency: 1
   ========================================
   ```

### Step 2: Deploy to Vercel

```bash
cd project
npm run deploy
```

Or manual deployment:
```bash
cd project
git add .
git commit -m "Fix currency display from GBP to NGN"
git push origin main
```

---

## ✅ Verification Steps

### 1. Check Frontend (After Deployment)

Visit: https://ishas-treat.apinlero.com

**Expected:**
- All prices show **₦** symbol (not £)
- Example: ₦2,500 instead of £25.00

### 2. Check Database

Run in Supabase SQL Editor:
```sql
SELECT id, name, currency, timezone
FROM businesses
WHERE is_active = true;
```

**Expected Result:**
```
currency: NGN
timezone: Africa/Lagos
```

### 3. Check Dashboard

Visit: https://app.apinlero.com

- Inventory prices should show ₦
- Order totals should show ₦
- Analytics should show ₦

---

## 📊 Impact Analysis

### Before Fix:
- ❌ Prices displayed as £25.00 (confusing for Nigerian customers)
- ❌ Delivery fee was £5 (~₦9,000 equivalent - too high)
- ❌ Location showed London, UK

### After Fix:
- ✅ Prices display as ₦2,500 (correct for Nigerian market)
- ✅ Delivery fee is ₦500 (reasonable)
- ✅ Location shows Lagos, Nigeria

---

## 🔍 Related Files Modified

1. **Frontend:**
   - `src/config/shop.ts` - Currency configuration

2. **Database:**
   - `supabase/migrations/20260212_fix_currency_to_naira.sql` - Migration

3. **Schema:**
   - `database-schema-multitenant.sql` - Will be updated for future deployments

---

## 🛡️ Prevention

**To prevent this in the future:**

1. **Multi-tenant currency support** should be added to allow different businesses to use different currencies
2. **Environment-based configuration** - Set currency based on business location
3. **Database-driven settings** - Store currency in business settings, not hardcoded

---

## 💡 Next Steps (Optional Enhancements)

### Short-term:
- ✅ Fix currency symbol (DONE)
- ⏳ Apply database migration
- ⏳ Deploy to production

### Long-term:
- Add multi-currency support
- Allow businesses to set their own currency
- Support currency conversion for international customers
- Add currency formatting based on locale

---

## 🚨 Rollback Plan (If Needed)

If something goes wrong:

```sql
-- Rollback currency to GBP
UPDATE businesses
SET
  currency = 'GBP',
  timezone = 'Europe/London'
WHERE id = 'your-business-id';
```

Then redeploy previous version from git.

---

**Status:** Ready to apply! Run the database migration and deploy.
