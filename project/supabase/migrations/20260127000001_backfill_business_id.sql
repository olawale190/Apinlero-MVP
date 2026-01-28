-- Migration: Backfill business_id for existing data
-- Created: 2026-01-27
-- Purpose: Associate all existing products, customers, and orders with Isha's Treat business
-- Dependency: Must run AFTER 20260127000000_add_business_id_to_core_tables.sql

-- =====================================================
-- STEP 1: Create or get Isha's Treat business record
-- =====================================================

-- Insert Isha's Treat business if it doesn't exist
INSERT INTO businesses (
  id,
  name,
  slug,
  owner_email,
  phone,
  address,
  city,
  country,
  currency,
  timezone,
  plan,
  monthly_message_limit,
  is_active,
  created_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,  -- Fixed UUID for Isha's Treat
  'Isha''s Treat & Groceries',
  'ishas-treat',
  'isha@ishas-treat.com',
  '+447448682282',
  'South London',
  'London',
  'United Kingdom',
  'GBP',
  'Europe/London',
  'pilot',
  10000,  -- Higher limit for pilot customer
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  updated_at = NOW();

-- =====================================================
-- STEP 2: Backfill products table
-- =====================================================

DO $$
DECLARE
  ishas_business_id UUID;
  products_updated INTEGER;
BEGIN
  -- Get Isha's business_id
  SELECT id INTO ishas_business_id
  FROM businesses
  WHERE slug = 'ishas-treat'
  LIMIT 1;

  IF ishas_business_id IS NULL THEN
    RAISE EXCEPTION 'Isha''s Treat business not found';
  END IF;

  -- Update all products without business_id
  UPDATE products
  SET business_id = ishas_business_id,
      updated_at = NOW()
  WHERE business_id IS NULL;

  GET DIAGNOSTICS products_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % products with business_id', products_updated;
END $$;

-- =====================================================
-- STEP 3: Backfill customers table
-- =====================================================

DO $$
DECLARE
  ishas_business_id UUID;
  customers_updated INTEGER;
BEGIN
  -- Get Isha's business_id
  SELECT id INTO ishas_business_id
  FROM businesses
  WHERE slug = 'ishas-treat'
  LIMIT 1;

  -- Update all customers without business_id
  UPDATE customers
  SET business_id = ishas_business_id,
      updated_at = NOW()
  WHERE business_id IS NULL;

  GET DIAGNOSTICS customers_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % customers with business_id', customers_updated;
END $$;

-- =====================================================
-- STEP 4: Backfill orders table
-- =====================================================

DO $$
DECLARE
  ishas_business_id UUID;
  orders_updated INTEGER;
BEGIN
  -- Get Isha's business_id
  SELECT id INTO ishas_business_id
  FROM businesses
  WHERE slug = 'ishas-treat'
  LIMIT 1;

  -- Update all orders without business_id
  UPDATE orders
  SET business_id = ishas_business_id,
      updated_at = NOW()
  WHERE business_id IS NULL;

  GET DIAGNOSTICS orders_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % orders with business_id', orders_updated;
END $$;

-- =====================================================
-- STEP 5: Make business_id NOT NULL
-- =====================================================

-- After backfill, enforce NOT NULL constraint
ALTER TABLE products ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN business_id SET NOT NULL;

-- =====================================================
-- STEP 6: Verification
-- =====================================================

-- Verify no orphaned records remain
DO $$
DECLARE
  orphan_products INTEGER;
  orphan_customers INTEGER;
  orphan_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_products FROM products WHERE business_id IS NULL;
  SELECT COUNT(*) INTO orphan_customers FROM customers WHERE business_id IS NULL;
  SELECT COUNT(*) INTO orphan_orders FROM orders WHERE business_id IS NULL;

  IF orphan_products > 0 OR orphan_customers > 0 OR orphan_orders > 0 THEN
    RAISE EXCEPTION 'Orphaned records found: products=%, customers=%, orders=%',
      orphan_products, orphan_customers, orphan_orders;
  END IF;

  RAISE NOTICE 'Backfill verification passed - no orphaned records';
END $$;
