# Apinlero WhatsApp Bot - Multi-Tenant SaaS Migration

**Status:** 🟡 In Progress (Phase 1 & 2 Complete - 75%)
**Last Updated:** 2026-01-27
**Timeline:** 1.5-2 weeks total

---

## Executive Summary

Transform Apinlero's WhatsApp bot from **single-tenant** (Isha's Treat only) to **fully multi-tenant SaaS platform** with proper data isolation, business scoping, and Row Level Security.

### Current SaaS Readiness: 75% ✅

**What Works:**
- ✅ Multi-tenant database schema (businesses, whatsapp_configs, whatsapp_sessions)
- ✅ n8n webhook routing (phone number → business mapping)
- ✅ Session isolation per business
- ✅ Message logging with business_id
- ✅ **NEW: Database migrations created** (3 migration files)
- ✅ **NEW: Core Supabase queries updated** (products, customers, orders)

**Completed Work:**
- ✅ Phase 1: Database schema migrations created
- ✅ Phase 2 (Partial): Supabase client functions updated with businessId

**Remaining Work:**
- ⏳ Phase 2: Update message-handler.js to pass businessId
- ⏳ Phase 2: Fix/remove Twilio legacy endpoint
- ⏳ Phase 3: Run migrations on database
- ⏳ Phase 3: Test multi-tenant isolation
- ⏳ Phase 4: Deploy to production

---

## Critical Security Issues Found

### 🔴 Data Isolation Vulnerabilities (Pre-Migration)

1. **Global Product Catalog** - All businesses see ALL products
   - Attack: Competitor discovers all pricing/inventory
   - Fixed by: Adding business_id column + filtering queries

2. **Shared Customer Records** - Same phone = same customer globally
   - Attack: Business A reads Business B's customer order history
   - Fixed by: business_id + composite unique key (business_id, phone)

3. **Cross-Tenant Order Access** - No business scoping on orders
   - Attack: Order data leakage across businesses
   - Fixed by: business_id column + query filtering

4. **RLS Policies Disabled** - No Row Level Security protection
   - Risk: Service role key exposure = full database access
   - Fixed by: Migration 20260127000002 enables RLS

---

## Phase 1: Database Migrations ✅ COMPLETED

### Created Migration Files

#### 1. Add business_id Columns
**File:** `project/supabase/migrations/20260127000000_add_business_id_to_core_tables.sql`

```sql
-- Adds business_id UUID column to:
-- - products table
-- - customers table
-- - orders table

-- Updates customers unique constraint:
-- FROM: UNIQUE(phone)
-- TO: UNIQUE(business_id, phone)

-- Creates performance indexes on business_id
```

#### 2. Backfill Isha's Treat Data
**File:** `project/supabase/migrations/20260127000001_backfill_business_id.sql`

```sql
-- Creates Isha's Treat business record (UUID: 550e8400-e29b-41d4-a716-446655440000)
-- Backfills all existing products/customers/orders with Isha's business_id
-- Sets business_id to NOT NULL after backfill
-- Verifies no orphaned records remain
```

**Isha's Treat Business Details:**
- UUID: `550e8400-e29b-41d4-a716-446655440000`
- Slug: `ishas-treat`
- Owner: `isha@ishas-treat.com`
- Plan: `pilot`
- Message Limit: 10,000/month

#### 3. Enable Row Level Security
**File:** `project/supabase/migrations/20260127000002_enable_rls_policies.sql`

```sql
-- Enables RLS on products, customers, orders

-- Service role policies (bot):
-- - Full access to all data (app handles business scoping)

-- Authenticated user policies (dashboard):
-- - Can only SELECT/UPDATE data from their own business
-- - Business determined by: auth.email() = businesses.owner_email

-- Anonymous users: NO ACCESS
```

**Security Model:**
- **Bot (service_role)**: Full access, filters in code
- **Dashboard (authenticated)**: RLS enforced per business
- **Public (anon)**: No access

---

## Phase 2: Code Changes ✅ 75% COMPLETED

### Updated Functions in `whatsapp-bot/src/supabase-client.js`

#### Product Functions ✅
```javascript
// BEFORE: getProducts() - returned ALL products
// AFTER:  getProducts(businessId) - filters by business

export async function getProducts(businessId) {
  if (!businessId) throw new Error('businessId is required');

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)  // ← NEW
    .eq('is_active', true)
    .order('name');

  return data || [];
}

// Also updated:
// - getProductById(id, businessId)
// - getProductByName(name, businessId)
```

#### Customer Functions ✅
```javascript
// BEFORE: getOrCreateCustomer(phone, name, businessId = null)
//         businessId parameter was IGNORED!
// AFTER:  getOrCreateCustomer(phone, name, businessId)
//         businessId is REQUIRED and filters queries

export async function getOrCreateCustomer(phone, name, businessId) {
  if (!businessId) throw new Error('businessId is required');

  const normalizedPhone = phone.replace(/\D/g, '');

  // Find in THIS business only
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)  // ← NEW
    .or(`phone.eq.${phone},phone.eq.${normalizedPhone}...`)
    .maybeSingle();

  if (existing) return existing;

  // Create in THIS business
  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,  // ← NEW
      phone: normalizedPhone,
      name: name || 'WhatsApp Customer',
      channel: 'WhatsApp',
      total_orders: 0,
      total_spent: 0
    })
    .select()
    .single();

  return newCustomer;
}
```

**Key Change:** Same phone number can now exist in multiple businesses with separate customer records!

#### Order Functions ✅
```javascript
// Updated functions:
// - createOrder(orderData, businessId)      ← NEW businessId param
// - getOrderByPhone(phone, businessId)      ← NEW businessId param
// - getLastOrder(phone, businessId)         ← NEW businessId param

export async function createOrder(orderData, businessId) {
  if (!businessId) throw new Error('businessId is required');

  const { data } = await supabase
    .from('orders')
    .insert({
      business_id: businessId,  // ← NEW
      customer_name: orderData.customer_name,
      phone_number: orderData.phone_number,
      items: orderData.items,
      total: orderData.total,
      // ... rest of fields
    })
    .select()
    .single();

  return data;
}

export async function getOrderByPhone(phone, businessId) {
  if (!businessId) throw new Error('businessId is required');

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', businessId)  // ← NEW
    .or(`phone_number.eq.${phone}...`)
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}
```

### ⏳ Remaining Code Updates

#### 1. Update Message Handler
**File:** `whatsapp-bot/src/message-handler.js`

**TODO:** Update all function calls to pass businessId:

```javascript
// Current calls (WILL BREAK after migration):
const products = await getProducts();                    // ❌ Missing businessId
const product = await getProductById(id);                // ❌ Missing businessId
const customer = await getOrCreateCustomer(phone, name); // ❌ Missing businessId
const order = await createOrder(orderData);              // ❌ Missing businessId

// Required changes:
const products = await getProducts(businessId);                      // ✅
const product = await getProductById(id, businessId);                // ✅
const customer = await getOrCreateCustomer(phone, name, businessId); // ✅
const order = await createOrder(orderData, businessId);              // ✅
const orders = await getOrderByPhone(phone, businessId);             // ✅
const lastOrder = await getLastOrder(phone, businessId);             // ✅
```

**How to Find Calls:**
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
grep -n "getProducts()" src/message-handler.js
grep -n "getProductById(" src/message-handler.js
grep -n "getOrCreateCustomer(" src/message-handler.js
grep -n "createOrder(" src/message-handler.js
grep -n "getOrderByPhone(" src/message-handler.js
grep -n "getLastOrder(" src/message-handler.js
```

#### 2. Fix Twilio Legacy Endpoint
**File:** `whatsapp-bot/src/server.js` (lines 73-88)

**Problem:** Twilio endpoint has NO businessId context

**Option 1: Remove it** (Recommended for SaaS)
```javascript
// Delete the entire /webhook/twilio endpoint
// Force all businesses to use Meta Cloud API via n8n routing
```

**Option 2: Add business lookup**
```javascript
app.post('/webhook/twilio', async (req, res) => {
  const incomingMessage = twilioParser(req.body);

  // Look up business by Twilio phone number
  const { data: config } = await supabase
    .from('whatsapp_configs')
    .select('business_id')
    .eq('twilio_phone_number', incomingMessage.to)  // ← NEW
    .eq('is_active', true)
    .single();

  if (!config) {
    return res.status(404).json({
      error: 'Business not found for this phone number'
    });
  }

  const response = await handleIncomingMessage({
    from: incomingMessage.phoneNumber,
    businessId: config.business_id,  // ← NOW HAS BUSINESS CONTEXT
    content: { type: 'text', text: { body: incomingMessage.body } },
    timestamp: new Date().toISOString(),
    provider: 'twilio'
  });

  res.type('text/xml');
  res.send(response);
});
```

---

## Phase 3: Migration Execution ⏳ PENDING

### Pre-Migration Checklist

- [ ] **Backup database** (critical!)
- [ ] **Test migrations locally** using Supabase CLI
- [ ] **Verify businesses table exists** (from supabase_whatsapp_migration_v2.sql)
- [ ] **Code changes complete** (message-handler.js updated)
- [ ] **Twilio endpoint fixed/removed**

### Migration Commands

```bash
# 1. Navigate to project directory
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project

# 2. Run migrations (in order!)
supabase db push

# Or manually via psql:
psql "postgresql://postgres:y2KyN58yVFnDh2wi@db.gafoezdpaotwvpfldyhc.supabase.co:5432/postgres" \
  -f supabase/migrations/20260127000000_add_business_id_to_core_tables.sql

psql "$CONNECTION_STRING" \
  -f supabase/migrations/20260127000001_backfill_business_id.sql

psql "$CONNECTION_STRING" \
  -f supabase/migrations/20260127000002_enable_rls_policies.sql
```

### Post-Migration Verification

```sql
-- Test 1: Verify business_id columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'business_id'
AND table_name IN ('products', 'customers', 'orders');
-- Expected: 3 rows

-- Test 2: Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('products', 'customers', 'orders');
-- Expected: rowsecurity = TRUE for all 3

-- Test 3: Verify unique constraint
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name = 'customers';
-- Expected: customers_business_phone_unique

-- Test 4: Check for orphaned records
SELECT COUNT(*) FROM products WHERE business_id IS NULL;   -- Should be 0
SELECT COUNT(*) FROM customers WHERE business_id IS NULL;  -- Should be 0
SELECT COUNT(*) FROM orders WHERE business_id IS NULL;     -- Should be 0

-- Test 5: Verify Isha's Treat business exists
SELECT id, name, slug, owner_email, plan, monthly_message_limit
FROM businesses
WHERE slug = 'ishas-treat';
-- Expected: 1 row with UUID 550e8400-e29b-41d4-a716-446655440000

-- Test 6: Count records assigned to Isha's Treat
SELECT
  (SELECT COUNT(*) FROM products WHERE business_id = '550e8400-e29b-41d4-a716-446655440000') AS products_count,
  (SELECT COUNT(*) FROM customers WHERE business_id = '550e8400-e29b-41d4-a716-446655440000') AS customers_count,
  (SELECT COUNT(*) FROM orders WHERE business_id = '550e8400-e29b-41d4-a716-446655440000') AS orders_count;
```

---

## Phase 4: Testing ⏳ PENDING

### Manual Testing Plan

#### Setup: Create Test Business
```sql
-- Create second test business
INSERT INTO businesses (
  id,
  name,
  slug,
  owner_email,
  plan,
  monthly_message_limit,
  is_active
) VALUES (
  gen_random_uuid(),
  'Test Business Ltd',
  'test-business',
  'test@example.com',
  'free',
  1000,
  true
);

-- Create WhatsApp config for test business
INSERT INTO whatsapp_configs (
  business_id,
  phone_number_id,
  waba_id,
  access_token,
  webhook_verify_token,
  provider,
  is_active
) VALUES (
  (SELECT id FROM businesses WHERE slug = 'test-business'),
  'test_phone_123456',
  'test_waba_789',
  'test_token_abc',
  'verify_test_xyz',
  'meta',
  true
);
```

#### Test Scenarios

**Scenario 1: Product Isolation**
```bash
# Customer messages Isha's Treat business
# Expected: See only Isha's products

# Customer messages Test Business
# Expected: See only Test Business products (should be empty initially)
```

**Scenario 2: Customer Record Isolation**
```bash
# Same phone number (+447448682282) messages both businesses
# Expected: 2 separate customer records created
# - One in Isha's Treat
# - One in Test Business

# Verify:
SELECT business_id, phone, name FROM customers WHERE phone = '447448682282';
-- Should return 2 rows
```

**Scenario 3: Order Isolation**
```bash
# Customer A (phone: +447111111111) creates order in Isha's Treat
# Customer A (same phone) creates order in Test Business
# Expected: 2 separate orders, each scoped to their business

# Verify:
SELECT business_id, phone_number, total FROM orders WHERE phone_number = '447111111111';
-- Should return 2 rows with different business_ids
```

**Scenario 4: Cross-Tenant Data Leak**
```bash
# Try to query products from Business A using Business B's businessId
const products = await getProducts(businessB_id);
# Expected: Returns only Business B's products (should be empty if none created)
# NOT Business A's products
```

### Automated Testing

**Run Tenant Isolation Validator:**
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
node validators/tenant-isolation.js
```

**Expected Output:**
```
✓ Different businesses have isolated sessions
✓ Same phone across businesses creates separate customer records
✓ Products scoped to business only
✓ Orders scoped to business only
✓ Message logs scoped to business only
```

---

## Phase 5: Deployment ⏳ PENDING

### Deployment Steps

```bash
# 1. Ensure migrations applied successfully (Phase 3 complete)

# 2. Deploy updated bot code to Railway
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
railway up

# 3. Monitor logs for errors
railway logs --tail

# 4. Watch for businessId errors:
# - "businessId is required for getProducts"
# - "businessId is required for createOrder"
# These indicate missing businessId in message-handler.js
```

### Rollback Plan

If critical issues occur:

```sql
-- EMERGENCY: Temporarily disable RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Investigate errors in Railway logs
-- Fix code issues
-- Re-enable RLS when ready:
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

---

## File Reference

### Migration Files (Created ✅)
```
project/supabase/migrations/
├── 20260127000000_add_business_id_to_core_tables.sql  ✅ Created
├── 20260127000001_backfill_business_id.sql            ✅ Created
└── 20260127000002_enable_rls_policies.sql             ✅ Created
```

### Code Files (Modified ✅)
```
whatsapp-bot/src/
├── supabase-client.js     ✅ Updated (getProducts, getOrCreateCustomer, createOrder, etc.)
├── message-handler.js     ⏳ TODO: Update function calls to pass businessId
└── server.js              ⏳ TODO: Fix/remove Twilio endpoint (lines 73-88)
```

### Testing Files
```
whatsapp-bot/
├── validators/tenant-isolation.js           ✅ Exists (run after deployment)
└── tests/multi-tenant-integration.test.js   📝 TODO: Create new test file
```

---

## Architecture Overview

### Multi-Tenant Data Flow

```
WhatsApp Message arrives
    ↓
n8n webhook receiver
    ↓
n8n queries whatsapp_configs:
  WHERE phone_number_id = incoming_phone_id
    ↓
Returns: business_id, access_token, provider
    ↓
n8n calls bot /webhook/meta with businessId in payload
    ↓
Bot server.js receives: { businessId, from, content, ... }
    ↓
handleIncomingMessage(businessId, from, content)
    ↓
All database queries filter by businessId:
  - getProducts(businessId)         ← Filters products
  - getOrCreateCustomer(..., businessId)  ← Creates customer in business
  - createOrder(..., businessId)    ← Creates order in business
    ↓
Response sent back to correct business's WhatsApp number
```

### Database Schema (After Migration)

```
businesses (Multi-tenant root)
├── id UUID (PK)
├── name
├── slug UNIQUE
├── owner_email
├── plan
└── monthly_message_limit

products
├── id UUID (PK)
├── business_id UUID (FK → businesses.id)  ← NEW
├── name
├── price
└── is_active

customers
├── id UUID (PK)
├── business_id UUID (FK → businesses.id)  ← NEW
├── phone
└── name
└── UNIQUE(business_id, phone)  ← CHANGED from UNIQUE(phone)

orders
├── id UUID (PK)
├── business_id UUID (FK → businesses.id)  ← NEW
├── customer_name
├── phone_number
├── items JSONB
└── total
```

---

## Success Criteria

✅ **SaaS-Ready When:**
- [x] Database migrations created
- [x] Supabase client functions accept businessId parameter
- [ ] Message handler passes businessId to all functions
- [ ] Twilio endpoint fixed/removed
- [ ] Migrations executed successfully
- [ ] All products scoped to business_id
- [ ] Customers isolated per business (same phone in multiple businesses)
- [ ] Orders scoped to business_id
- [ ] RLS policies enabled and tested
- [ ] Tenant isolation tests passing
- [ ] 2 test businesses can operate independently
- [ ] No data leakage between businesses

---

## Known Issues & Limitations

### Current Issues
1. **Message handler not updated** - Will throw "businessId is required" errors after migration
2. **Twilio endpoint broken** - No businessId context
3. **No integration tests** - Need to create multi-tenant test suite

### Design Limitations
1. **Single Supabase project** - All tenants share same database (RLS handles separation)
2. **Service role key** - If leaked, attacker can access all business data
3. **Business lookup via email** - Dashboard users matched by auth.email() = businesses.owner_email
4. **No tenant-specific rate limits** - Schema has monthly_message_limit but not enforced in code

---

## Next Session - Quick Start

### Commands to Resume Work

```bash
# Navigate to project
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP

# Open key files
code whatsapp-bot/src/message-handler.js    # Update function calls
code whatsapp-bot/src/server.js             # Fix Twilio endpoint (lines 73-88)

# View migrations
ls -la project/supabase/migrations/20260127*

# Check migration status
psql "postgresql://postgres:y2KyN58yVFnDh2wi@db.gafoezdpaotwvpfldyhc.supabase.co:5432/postgres" \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'business_id';"
# Returns empty: Migrations not run yet
# Returns 1 row: Migrations already applied
```

### Priority Tasks (In Order)

1. **Update message-handler.js** (30-45 min)
   - Search for all getProducts() calls → add businessId
   - Search for all getOrCreateCustomer() calls → add businessId
   - Search for all createOrder() calls → add businessId
   - Search for all getOrderByPhone() calls → add businessId
   - Search for all getLastOrder() calls → add businessId

2. **Fix Twilio endpoint** (15-20 min)
   - Option 1: Delete lines 73-88 in server.js
   - Option 2: Add business lookup by phone number

3. **Run migrations** (10-15 min)
   - Backup database first!
   - Run 3 migration files in order
   - Verify with SQL queries

4. **Test multi-tenant isolation** (30-45 min)
   - Create second test business
   - Send messages to both businesses
   - Verify products/customers/orders are isolated

5. **Deploy to production** (15-20 min)
   - Push code to Railway
   - Monitor logs
   - Test with Isha's Treat production data

**Total Time: 2-3 hours**

---

## Contact & Support

**Database:**
- Supabase Project: `gafoezdpaotwvpfldyhc`
- Connection String: `postgresql://postgres:y2KyN58yVFnDh2wi@db.gafoezdpaotwvpfldyhc.supabase.co:5432/postgres`

**Deployment:**
- WhatsApp Bot: Railway (check Railway dashboard for project link)
- Dashboard: Vercel (app.apinlero.com)

**Isha's Treat Business:**
- UUID: `550e8400-e29b-41d4-a716-446655440000`
- Slug: `ishas-treat`
- Owner: `isha@ishas-treat.com`

---

**Document Version:** 1.0
**Generated:** 2026-01-27
**Session:** reactive-knitting-tiger
