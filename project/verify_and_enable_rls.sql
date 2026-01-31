-- Verification and Enablement Script for Row Level Security
-- Run this in Supabase SQL Editor to check and enable RLS
-- Created: 2026-01-27

-- =====================================================
-- STEP 1: Check Current RLS Status
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'RLS STATUS CHECK';
  RAISE NOTICE '=================================================';
END $$;

-- Check if RLS is enabled on core tables
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('businesses', 'products', 'customers', 'orders', 'categories')
ORDER BY tablename;

-- =====================================================
-- STEP 2: List All Existing Policies
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'EXISTING RLS POLICIES';
  RAISE NOTICE '=================================================';
END $$;

SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd::text
  END as operation,
  CASE
    WHEN roles::text = '{public}' THEN 'public'
    WHEN roles::text = '{authenticated}' THEN 'authenticated'
    WHEN roles::text = '{service_role}' THEN 'service_role'
    WHEN roles::text = '{anon}' THEN 'anon'
    ELSE roles::text
  END as applies_to
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 3: Check for Missing Policies
-- =====================================================

DO $$
DECLARE
  tables_without_policies TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'TABLES WITHOUT POLICIES (SECURITY RISK!)';
  RAISE NOTICE '=================================================';

  SELECT array_agg(tablename)
  INTO tables_without_policies
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true  -- RLS enabled
    AND tablename NOT IN (
      SELECT DISTINCT tablename
      FROM pg_policies
      WHERE schemaname = 'public'
    );

  IF tables_without_policies IS NOT NULL THEN
    RAISE WARNING 'Tables with RLS enabled but NO policies (blocked for everyone): %', tables_without_policies;
  ELSE
    RAISE NOTICE '✅ All tables with RLS have policies';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Apply/Update RLS Policies (IDEMPOTENT)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'APPLYING RLS POLICIES';
  RAISE NOTICE '=================================================';
END $$;

-- Enable RLS on core tables (safe to run multiple times)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Categories table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS enabled on categories';
  END IF;
END $$;

-- =====================================================
-- BUSINESSES TABLE POLICIES
-- =====================================================

-- Service role: Full access
DROP POLICY IF EXISTS "Service role full access to businesses" ON businesses;
CREATE POLICY "Service role full access to businesses"
  ON businesses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: Users can view and manage their own business
DROP POLICY IF EXISTS "Users view own business" ON businesses;
CREATE POLICY "Users view own business"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (owner_email = auth.email());

DROP POLICY IF EXISTS "Users update own business" ON businesses;
CREATE POLICY "Users update own business"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (owner_email = auth.email())
  WITH CHECK (owner_email = auth.email());

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Service role: Full access
DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products"
  ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: Users manage products for their own business
DROP POLICY IF EXISTS "Users manage own business products" ON products;
CREATE POLICY "Users manage own business products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT slug FROM businesses WHERE owner_email = auth.email()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT slug FROM businesses WHERE owner_email = auth.email()
    )
  );

-- Public: Read-only access to products (for storefront)
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================

-- Service role: Full access (WhatsApp bot needs this)
DROP POLICY IF EXISTS "Service role full access to customers" ON customers;
CREATE POLICY "Service role full access to customers"
  ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: Users view/manage customers from their own business
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

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Service role: Full access (WhatsApp bot creates orders)
DROP POLICY IF EXISTS "Service role full access to orders" ON orders;
CREATE POLICY "Service role full access to orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: Users view/manage orders from their own business
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
-- CATEGORIES TABLE POLICIES (if exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN

    -- Service role: Full access
    DROP POLICY IF EXISTS "Service role full access to categories" ON categories;
    CREATE POLICY "Service role full access to categories"
      ON categories
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    -- Authenticated: Users manage categories for their own business
    DROP POLICY IF EXISTS "Users manage own business categories" ON categories;
    CREATE POLICY "Users manage own business categories"
      ON categories
      FOR ALL
      TO authenticated
      USING (
        store_id IN (
          SELECT slug FROM businesses WHERE owner_email = auth.email()
        )
      )
      WITH CHECK (
        store_id IN (
          SELECT slug FROM businesses WHERE owner_email = auth.email()
        )
      );

    -- Public: Read-only access
    DROP POLICY IF EXISTS "Public can view categories" ON categories;
    CREATE POLICY "Public can view categories"
      ON categories
      FOR SELECT
      TO anon
      USING (true);

    RAISE NOTICE '✅ Policies created for categories table';
  END IF;
END $$;

-- =====================================================
-- STEP 5: Verify Policies Are Active
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  tables_with_rls INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '=================================================';

  -- Count policies
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '✅ Total active policies: %', policy_count;

  -- Check all core tables have RLS
  SELECT COUNT(*)
  INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('businesses', 'products', 'customers', 'orders')
    AND rowsecurity = true;

  IF tables_with_rls = 4 THEN
    RAISE NOTICE '✅ RLS enabled on all 4 core tables';
  ELSE
    RAISE WARNING '⚠️  RLS not enabled on all core tables (% of 4)', tables_with_rls;
  END IF;

  -- Check for dangerous policies (anon with write access)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND roles = '{anon}'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', '*')
      AND tablename IN ('businesses', 'customers', 'orders')
  ) THEN
    RAISE WARNING '⚠️  SECURITY RISK: Anonymous users have write access to sensitive tables!';
  ELSE
    RAISE NOTICE '✅ No dangerous anonymous write policies detected';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'RLS SETUP COMPLETE';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Core tables: RLS enabled';
  RAISE NOTICE '- Policies: % active policies', policy_count;
  RAISE NOTICE '- service_role: Full access (backend)';
  RAISE NOTICE '- authenticated: Own business only';
  RAISE NOTICE '- anon: Read-only products (storefront)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Important:';
  RAISE NOTICE '- Backend must use SUPABASE_SERVICE_ROLE_KEY';
  RAISE NOTICE '- Frontend must use SUPABASE_ANON_KEY';
  RAISE NOTICE '- Test with different user accounts';
END $$;

-- =====================================================
-- STEP 6: Test RLS (Optional - Comment out in production)
-- =====================================================

-- Uncomment to test RLS as different roles:

/*
-- Test 1: Set role to anon (public users)
SET ROLE anon;
SELECT COUNT(*) as products_visible_to_anon FROM products;
-- Should see all products

SELECT COUNT(*) as orders_visible_to_anon FROM orders;
-- Should see 0 orders (blocked)

RESET ROLE;

-- Test 2: Set role to authenticated (logged in users)
-- Note: This test won't work properly because we can't set auth.email()
-- In production, test by logging in with different user accounts

SET ROLE authenticated;
SELECT COUNT(*) as products_visible_to_auth FROM products;
-- Should only see products from user's business

RESET ROLE;
*/

-- =====================================================
-- SUB_CATEGORIES TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sub_categories') THEN
    ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to sub_categories" ON sub_categories;
    CREATE POLICY "Service role full access to sub_categories"
      ON sub_categories FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business sub_categories" ON sub_categories;
    CREATE POLICY "Users manage own business sub_categories"
      ON sub_categories FOR ALL TO authenticated
      USING (store_id IN (SELECT slug FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (store_id IN (SELECT slug FROM businesses WHERE owner_email = auth.email()));

    DROP POLICY IF EXISTS "Public can view sub_categories" ON sub_categories;
    CREATE POLICY "Public can view sub_categories"
      ON sub_categories FOR SELECT TO anon USING (true);

    RAISE NOTICE '✅ Policies created for sub_categories table';
  END IF;
END $$;

-- =====================================================
-- MEDIA_FILES TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_files') THEN
    ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to media_files" ON media_files;
    CREATE POLICY "Service role full access to media_files"
      ON media_files FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business media_files" ON media_files;
    CREATE POLICY "Users manage own business media_files"
      ON media_files FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    DROP POLICY IF EXISTS "Public can view public media_files" ON media_files;
    CREATE POLICY "Public can view public media_files"
      ON media_files FOR SELECT TO anon USING (is_public = true);

    RAISE NOTICE '✅ Policies created for media_files table';
  END IF;
END $$;

-- =====================================================
-- WHATSAPP_CONFIGS TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_configs') THEN
    ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_configs" ON whatsapp_configs;
    CREATE POLICY "Service role full access to whatsapp_configs"
      ON whatsapp_configs FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business whatsapp_configs" ON whatsapp_configs;
    CREATE POLICY "Users manage own business whatsapp_configs"
      ON whatsapp_configs FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for whatsapp_configs table';
  END IF;
END $$;

-- =====================================================
-- WHATSAPP_MESSAGE_LOGS TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_message_logs') THEN
    ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_message_logs" ON whatsapp_message_logs;
    CREATE POLICY "Service role full access to whatsapp_message_logs"
      ON whatsapp_message_logs FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users view own business whatsapp_message_logs" ON whatsapp_message_logs;
    CREATE POLICY "Users view own business whatsapp_message_logs"
      ON whatsapp_message_logs FOR SELECT TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for whatsapp_message_logs table';
  END IF;
END $$;

-- =====================================================
-- WHATSAPP_ANALYTICS_DAILY TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_analytics_daily') THEN
    ALTER TABLE whatsapp_analytics_daily ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_analytics_daily" ON whatsapp_analytics_daily;
    CREATE POLICY "Service role full access to whatsapp_analytics_daily"
      ON whatsapp_analytics_daily FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users view own business whatsapp_analytics_daily" ON whatsapp_analytics_daily;
    CREATE POLICY "Users view own business whatsapp_analytics_daily"
      ON whatsapp_analytics_daily FOR SELECT TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for whatsapp_analytics_daily table';
  END IF;
END $$;

-- =====================================================
-- CALENDAR_EVENTS TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to calendar_events" ON calendar_events;
    CREATE POLICY "Service role full access to calendar_events"
      ON calendar_events FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business calendar_events" ON calendar_events;
    CREATE POLICY "Users manage own business calendar_events"
      ON calendar_events FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for calendar_events table';
  END IF;
END $$;

-- =====================================================
-- DELIVERY_SLOT_TEMPLATES TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_slot_templates') THEN
    ALTER TABLE delivery_slot_templates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to delivery_slot_templates" ON delivery_slot_templates;
    CREATE POLICY "Service role full access to delivery_slot_templates"
      ON delivery_slot_templates FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business delivery_slot_templates" ON delivery_slot_templates;
    CREATE POLICY "Users manage own business delivery_slot_templates"
      ON delivery_slot_templates FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for delivery_slot_templates table';
  END IF;
END $$;

-- =====================================================
-- EVENT_BOOKINGS TABLE POLICIES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_bookings') THEN
    ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to event_bookings" ON event_bookings;
    CREATE POLICY "Service role full access to event_bookings"
      ON event_bookings FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users manage own business event_bookings" ON event_bookings;
    CREATE POLICY "Users manage own business event_bookings"
      ON event_bookings FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

    RAISE NOTICE '✅ Policies created for event_bookings table';
  END IF;
END $$;

-- =====================================================
-- RLS SETUP COMPLETE!
-- =====================================================
