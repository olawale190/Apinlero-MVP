-- Migration: Enable RLS policies for multi-tenant security
-- Created: 2026-01-27
-- Purpose: Protect data isolation between businesses using Row Level Security
-- Dependency: Must run AFTER 20260127000001_backfill_business_id.sql

-- =====================================================
-- STEP 1: Enable RLS on core tables
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create policies for service_role (WhatsApp bot)
-- =====================================================

-- Service role (bot) needs full access to all data
-- The bot will handle business scoping in application code

DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products"
  ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to customers" ON customers;
CREATE POLICY "Service role full access to customers"
  ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to orders" ON orders;
CREATE POLICY "Service role full access to orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- STEP 3: Create policies for authenticated users (Dashboard)
-- =====================================================

-- Dashboard users can only SELECT data from their own business
-- Business ownership is determined by matching auth.email() with businesses.owner_email

-- Products: Read-only access to own business
DROP POLICY IF EXISTS "Users view own business products" ON products;
CREATE POLICY "Users view own business products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Products: Insert/Update/Delete for own business
DROP POLICY IF EXISTS "Users manage own business products" ON products;
CREATE POLICY "Users manage own business products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Customers: Read-only access to own business
DROP POLICY IF EXISTS "Users view own business customers" ON customers;
CREATE POLICY "Users view own business customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Customers: Insert/Update for own business
DROP POLICY IF EXISTS "Users manage own business customers" ON customers;
CREATE POLICY "Users manage own business customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Orders: Read-only access to own business
DROP POLICY IF EXISTS "Users view own business orders" ON orders;
CREATE POLICY "Users view own business orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Orders: Insert/Update for own business
DROP POLICY IF EXISTS "Users manage own business orders" ON orders;
CREATE POLICY "Users manage own business orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.email()
    )
  );

-- =====================================================
-- STEP 4: Create policies for anon (public) users
-- =====================================================

-- Anonymous users (public API) have NO access to core tables
-- All access must go through authenticated service_role (bot)

-- No policies = no access for anon users

-- =====================================================
-- STEP 5: Verification
-- =====================================================

DO $$
DECLARE
  products_rls BOOLEAN;
  customers_rls BOOLEAN;
  orders_rls BOOLEAN;
BEGIN
  -- Check RLS is enabled
  SELECT relrowsecurity INTO products_rls
  FROM pg_class
  WHERE relname = 'products';

  SELECT relrowsecurity INTO customers_rls
  FROM pg_class
  WHERE relname = 'customers';

  SELECT relrowsecurity INTO orders_rls
  FROM pg_class
  WHERE relname = 'orders';

  IF NOT (products_rls AND customers_rls AND orders_rls) THEN
    RAISE EXCEPTION 'RLS not enabled on all tables';
  END IF;

  RAISE NOTICE 'RLS enabled successfully on products, customers, and orders';
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- Security Model:
--
-- 1. service_role (WhatsApp bot):
--    - Full access to all data
--    - Application code filters by business_id
--    - Used by bot backend only
--
-- 2. authenticated (Dashboard users):
--    - Can only see/modify data from their own business
--    - Business determined by auth.email() = businesses.owner_email
--    - Cannot access other businesses' data
--
-- 3. anon (Public):
--    - NO access to products, customers, or orders
--    - Must authenticate first
--
-- Testing RLS:
-- SELECT * FROM products;  -- As authenticated user, sees only own business
-- SELECT * FROM products;  -- As service_role, sees all businesses
