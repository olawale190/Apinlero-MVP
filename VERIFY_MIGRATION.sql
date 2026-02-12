-- ==============================================================================
-- MIGRATION VERIFICATION SCRIPT
-- ==============================================================================
-- Purpose: Verify all tables, columns, indexes, and policies were created
-- Run this in Supabase SQL Editor after running APPLY_ALL_PENDING_MIGRATIONS.sql
-- ==============================================================================

-- 1. Check all tables exist
SELECT
  'Tables Check' as check_type,
  table_name,
  CASE
    WHEN table_name IN (
      'products', 'orders', 'businesses', 'users', 'user_businesses',
      'inventory_items', 'purchase_orders', 'low_stock_alerts',
      'stripe_customers', 'stripe_subscriptions', 'webhook_events'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'products', 'orders', 'businesses', 'users', 'user_businesses',
    'inventory_items', 'purchase_orders', 'low_stock_alerts',
    'stripe_customers', 'stripe_subscriptions', 'webhook_events'
  )
ORDER BY table_name;

-- 2. Check critical columns exist
SELECT
  'Columns Check' as check_type,
  table_name,
  column_name,
  data_type,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'products' AND column_name IN ('id', 'business_id', 'name', 'price', 'stock_quantity', 'low_stock_threshold'))
    OR (table_name = 'orders' AND column_name IN ('id', 'business_id', 'customer_name', 'total', 'status'))
    OR (table_name = 'businesses' AND column_name IN ('id', 'name', 'slug', 'is_active'))
    OR (table_name = 'users' AND column_name IN ('id', 'email', 'full_name'))
    OR (table_name = 'user_businesses' AND column_name IN ('user_id', 'business_id', 'role', 'is_active'))
    OR (table_name = 'inventory_items' AND column_name IN ('id', 'business_id', 'product_id', 'quantity'))
    OR (table_name = 'purchase_orders' AND column_name IN ('id', 'business_id', 'status'))
  )
ORDER BY table_name, column_name;

-- 3. Check indexes exist
SELECT
  'Indexes Check' as check_type,
  schemaname,
  tablename,
  indexname,
  '✓ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_businesses_slug_active',
    'idx_products_business_id',
    'idx_orders_business_id',
    'idx_user_businesses_user_id',
    'idx_user_businesses_business_id',
    'idx_inventory_items_product_id',
    'idx_inventory_items_business_id'
  )
ORDER BY tablename, indexname;

-- 4. Check RLS is enabled
SELECT
  'RLS Check' as check_type,
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 'orders', 'businesses', 'users', 'user_businesses',
    'inventory_items', 'purchase_orders', 'low_stock_alerts'
  )
ORDER BY tablename;

-- 5. Check key policies exist
SELECT
  'Policies Check' as check_type,
  tablename,
  policyname,
  '✓ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'orders', 'businesses', 'users', 'user_businesses')
ORDER BY tablename, policyname;

-- 6. Summary count
SELECT
  'Summary' as check_type,
  'Total Tables' as item,
  COUNT(*)::text as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
UNION ALL
SELECT
  'Summary' as check_type,
  'Total Indexes' as item,
  COUNT(*)::text as count
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Summary' as check_type,
  'Total Policies' as item,
  COUNT(*)::text as count
FROM pg_policies
WHERE schemaname = 'public';
