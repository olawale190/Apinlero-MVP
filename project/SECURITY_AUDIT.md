# 🚨 CRITICAL SECURITY AUDIT: Multi-Tenant Data Isolation Issues

**Date:** 2026-02-04
**Severity:** CRITICAL
**Status:** REQUIRES IMMEDIATE FIX

## Executive Summary

The Apinlero MVP has **CRITICAL multi-tenant security vulnerabilities** where database queries are missing `business_id` filtering. This allows authenticated users to view, modify, and delete data belonging to other businesses.

**Impact:** Cross-tenant data exposure - Business A can see/modify Business B's products, orders, and categories.

## Critical Issues Found

### 1. Dashboard.tsx - Products Loading (CRITICAL)

**File:** `src/pages/Dashboard.tsx:129-134`

```typescript
const loadProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  // ❌ NO business_id filtering!
}
```

**Issue:** Loads ALL products from ALL businesses
**Impact:** Dashboard shows products from all tenants

---

### 2. Dashboard.tsx - Orders Loading (CRITICAL)

**File:** `src/pages/Dashboard.tsx:119-121`

```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });
// ❌ NO business_id filtering!
```

**Issue:** Loads ALL orders from ALL businesses
**Impact:** Can view all customer orders across all businesses

---

### 3. InventoryManager.tsx - Multiple Operations (CRITICAL)

**File:** `src/components/InventoryManager.tsx`

#### a) Update Price (Line 368-370)
```typescript
const { error } = await supabase
  .from('products')
  .update({ price })
  .eq('id', productId);
// ❌ NO business_id validation - can update ANY product!
```

#### b) Save Bulk Pricing (Line 390-392)
```typescript
const { error } = await supabase
  .from('products')
  .update({ bulk_pricing: bulkTiers })
  .eq('id', productId);
// ❌ NO business_id validation!
```

#### c) Update Stock (Line 428-430)
```typescript
const { error } = await supabase
  .from('products')
  .update({ stock_quantity: newQuantity })
  .eq('id', productId);
// ❌ NO business_id validation!
```

#### d) Insert Product (Line 513-515)
```typescript
const { data, error } = await supabase
  .from('products')
  .insert([{
    name: newProductForm.name,
    price: parseFloat(newProductForm.price),
    // ... other fields
    // ❌ NO business_id field!
  }])
```

#### e) Update Product (Line 619-620)
```typescript
const { error } = await supabase
  .from('products')
  .update(updateData)
  .eq('id', productId);
// ❌ NO business_id validation!
```

#### f) Deactivate Product (Line 668-670)
```typescript
const { error } = await supabase
  .from('products')
  .update({ is_active: false })
  .eq('id', productId);
// ❌ NO business_id validation!
```

---

### 4. Shop.tsx - Products Fetching (CRITICAL)

**File:** `src/pages/Shop.tsx:36-38`

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('name');
// ❌ NO business_id filtering - shows ALL products!
```

**Issue:** Customer storefront shows products from ALL businesses
**Impact:** Customers can see/order products from wrong business

---

### 5. Backend API - /api/products (CRITICAL)

**File:** `backend/src/index.js:105-108`

```javascript
app.get('/api/products', rateLimiter(200), async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, category, unit, image_url, stock_quantity, is_active, bulk_pricing')
    .eq('is_active', true)
    .order('name');
  // ❌ NO business_id filtering!
});
```

**Issue:** API returns ALL products from ALL businesses
**Impact:** Public API leaks all product data

---

### 6. Backend API - /api/products/:id (CRITICAL)

**File:** `backend/src/index.js:129-132`

```javascript
app.get('/api/products/:id', rateLimiter(200), async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, category, unit, image_url, stock_quantity, is_active, bulk_pricing')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  // ❌ NO business_id validation - can access ANY product!
});
```

---

### 7. Backend API - Orders Endpoints (CRITICAL)

**File:** `backend/src/index.js`

Multiple endpoints affected:
- Line 155: `POST /api/orders` - No business_id on insert
- Line 214: `GET /api/orders` - No business_id filtering
- Line 255: `PATCH /api/orders/:id` - No business_id validation
- Line 281: `GET /api/orders/:id` - No business_id validation
- Line 311: `POST /api/orders/:id/cancel` - No business_id validation

---

### 8. CategoryManager.tsx (CRITICAL)

**File:** `src/components/CategoryManager.tsx`

Multiple operations without business_id:
- Line 47: Load categories - no filtering
- Line 61: Count products per category - no filtering
- Line 104: Insert category - no business_id
- Line 144: Update category - no validation
- Line 179: Delete category - no validation

---

### 9. NewOrderForm.tsx (CRITICAL)

**File:** `src/components/NewOrderForm.tsx`

- Line 30: Load products - no business_id filtering
- Line 87: Insert order - no business_id field

---

### 10. OrdersTable.tsx (CRITICAL)

**File:** `src/components/OrdersTable.tsx:118`

```typescript
const { error } = await supabase
  .from('orders')
  .update({ status: newStatus })
  .eq('id', orderId);
// ❌ NO business_id validation - can update ANY order!
```

---

## Additional Vulnerable Files

### Frontend (src/)
1. `src/pages/Checkout.tsx` - Lines 169, 254 (orders)
2. `src/pages/OrderTracking.tsx` - Line 51 (orders)
3. `src/pages/DeliveryConfirm.tsx` - Lines 41, 79 (orders)
4. `src/components/SubCategoryManager.tsx` - Lines 54, 153, 190 (products)
5. `src/components/CategoryFilter.tsx` - Line 32 (categories)
6. `src/hooks/useOrders.ts` - Line 35 (orders)
7. `src/hooks/useWishlist.ts` - Line 126 (products)
8. `src/hooks/useRecentlyViewed.ts` - Line 123 (products)

### Backend (backend/src/)
9. `backend/src/index.js` - Lines 419, 434, 460 (orders in various functions)

### Supabase Edge Functions
10. `supabase/functions/stripe-webhook/index.ts` - Lines 94, 105, 179, 213, 231, 240 (orders)
11. `supabase/functions/verify-order-total/index.ts` - Line 107 (products)

---

## Root Cause Analysis

1. **No BusinessContext Usage**: Components don't use or check business context
2. **Missing business_id in Queries**: All SELECT queries missing `.eq('business_id', currentBusinessId)`
3. **Missing business_id in Inserts**: New records don't include business_id field
4. **Missing business_id Validation**: UPDATE/DELETE don't validate ownership
5. **Permissive RLS Policies**: Database policies set to "Anyone can view/update/delete"

---

## Attack Scenarios

### Scenario 1: View Competitor Data
1. Business A user logs in
2. Dashboard loads - sees Business B's products and sales data
3. Can analyze competitor pricing, inventory, orders

### Scenario 2: Modify Competitor Products
1. Business A user opens InventoryManager
2. Sees Business B's products in the list
3. Can change prices, deactivate products, modify stock

### Scenario 3: Access Customer Orders
1. Business A user opens Orders page
2. Sees orders from all businesses
3. Can view customer names, addresses, phone numbers, order details

### Scenario 4: Delete Data
1. Business A user can delete Business B's products/categories
2. Can disrupt competitor operations

---

## Required Fixes

### Priority 1: Frontend Fixes (Dashboard & InventoryManager)

1. **Add BusinessContext to InventoryManager**
```typescript
import { useBusinessContext } from '../contexts/BusinessContext';

export default function InventoryManager() {
  const { business } = useBusinessContext();

  if (!business) {
    return <div>Error: No business context</div>;
  }

  // Use business.id in all queries
}
```

2. **Fix Dashboard.tsx loadProducts()**
```typescript
const loadProducts = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get business_id
  const { data: businessData } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_email', user.email)
    .single();

  // Load products with business_id filter
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessData.id)  // ✅ ADD THIS
    .order('name', { ascending: true });
}
```

3. **Fix All InventoryManager Operations**
- Add `business_id: business.id` to all INSERT operations
- Add `.eq('business_id', business.id)` to all UPDATE/DELETE operations
- Add `.eq('business_id', business.id)` to all SELECT queries

### Priority 2: Backend API Fixes

1. **Add Authentication Middleware**
```javascript
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get business_id
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_email', user.email)
    .single();

  req.user = user;
  req.business_id = business?.id;
  next();
};
```

2. **Update All Endpoints**
```javascript
app.get('/api/products', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', req.business_id)  // ✅ ADD THIS
    .eq('is_active', true);
});
```

### Priority 3: Database RLS Policies

**Create Migration SQL:**
```sql
-- Drop permissive policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Create business-scoped policies
CREATE POLICY "Users can view own business products" ON products
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert own business products" ON products
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can update own business products" ON products
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can delete own business products" ON products
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_email = auth.jwt()->>'email'
    )
  );
```

**Apply to tables:** products, orders, categories, sub_categories, media_files

---

## Testing Plan

### 1. Create Test Businesses
```sql
-- Business A
INSERT INTO businesses (id, name, slug, owner_email)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Business A', 'business-a', 'businessa@example.com');

-- Business B
INSERT INTO businesses (id, name, slug, owner_email)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Business B', 'business-b', 'businessb@example.com');
```

### 2. Add Test Products
```sql
-- Products for Business A
INSERT INTO products (business_id, name, price)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Business A Product', 10.00);

-- Products for Business B
INSERT INTO products (business_id, name, price)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Business B Product', 20.00);
```

### 3. Verification Tests
1. Log in as Business A user
2. Verify Dashboard shows ONLY Business A products
3. Verify cannot see Business B products
4. Try to update Business B product by ID (should fail)
5. Try to delete Business B product by ID (should fail)
6. Repeat for Business B user

---

## Deployment Plan

### Phase 1: Code Fixes (Day 1-2)
- [ ] Fix Dashboard.tsx
- [ ] Fix InventoryManager.tsx
- [ ] Fix Shop.tsx
- [ ] Fix backend API endpoints
- [ ] Fix other frontend components

### Phase 2: Database Migration (Day 3)
- [ ] Create RLS policy migration
- [ ] Test in development
- [ ] Apply to production

### Phase 3: Testing (Day 4)
- [ ] Multi-tenant isolation testing
- [ ] Security audit
- [ ] User acceptance testing

### Phase 4: Deploy (Day 5)
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Notify users of fix

---

## Estimated Impact

- **Files to Modify:** 20+ files
- **Lines of Code:** ~500 lines
- **Time to Fix:** 3-5 days
- **Downtime:** None (can fix without downtime)

---

## Recommendations

1. **IMMEDIATE:** Fix Dashboard and InventoryManager (highest risk)
2. **URGENT:** Fix backend API endpoints
3. **HIGH:** Update RLS policies
4. **MEDIUM:** Fix remaining frontend components
5. **LOW:** Add automated testing for multi-tenancy

---

## Conclusion

This is a **CRITICAL security vulnerability** that must be fixed immediately before any new features (like bulk import) are added. The fix requires:

1. Adding BusinessContext to all components
2. Adding business_id filtering to all database queries
3. Updating RLS policies to enforce tenant isolation
4. Comprehensive testing

**DO NOT** proceed with bulk import feature until these security issues are resolved.

---

**Audited by:** Claude Code (Sonnet 4.5)
**Next Review:** After fixes are deployed
