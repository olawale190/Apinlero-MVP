-- ============================================================
-- URGENT FIX: 394 Products Missing Prices
-- Run this in Supabase SQL Editor
-- Date: 2026-02-14
-- Business: Isha's Treat & Groceries (bf642ec5-8990-4581-bc1c-e4171d472007)
-- ============================================================

-- Step 1: First, let's see what products are affected
SELECT
  id,
  name,
  price,
  unit,
  category,
  created_at
FROM products
WHERE (price IS NULL OR price = 0)
  AND is_active = true
ORDER BY name
LIMIT 20;

-- ============================================================
-- OPTION 1: Set default prices based on product category
-- ============================================================
-- This gives reasonable default prices so products show up

UPDATE products
SET price = CASE
  -- Meat & Poultry (premium items)
  WHEN category LIKE '%Meat%' OR category LIKE '%Poultry%' OR category LIKE '%Chicken%' THEN 15.00
  WHEN category LIKE '%Beef%' OR category LIKE '%Lamb%' THEN 18.00

  -- Seafood
  WHEN category LIKE '%Fish%' OR category LIKE '%Seafood%' THEN 12.00

  -- Fresh Produce
  WHEN category LIKE '%Fruit%' OR category LIKE '%Vegetable%' THEN 3.50

  -- Grains & Rice
  WHEN category LIKE '%Rice%' OR category LIKE '%Grain%' THEN 8.00
  WHEN category LIKE '%Flour%' THEN 4.50

  -- Beans & Legumes
  WHEN category LIKE '%Bean%' OR category LIKE '%Legume%' THEN 5.00

  -- Spices & Seasonings
  WHEN category LIKE '%Spice%' OR category LIKE '%Season%' THEN 3.00

  -- Canned & Packaged
  WHEN category LIKE '%Canned%' OR category LIKE '%Packaged%' THEN 2.50

  -- Dairy & Eggs
  WHEN category LIKE '%Dairy%' OR category LIKE '%Egg%' OR category LIKE '%Milk%' THEN 4.00

  -- Snacks
  WHEN category LIKE '%Snack%' OR category LIKE '%Treat%' THEN 2.00

  -- Beverages
  WHEN category LIKE '%Drink%' OR category LIKE '%Beverage%' THEN 3.00

  -- Household items
  WHEN category LIKE '%Household%' OR category LIKE '%Care%' THEN 6.00

  -- Default for uncategorized
  ELSE 5.00
END,
updated_at = NOW()
WHERE (price IS NULL OR price = 0)
  AND is_active = true;

-- ============================================================
-- OPTION 2: Set uniform placeholder price
-- ============================================================
-- Uncomment this if you want all products to have same price
-- Then update individually later

-- UPDATE products
-- SET price = 5.00,
--     updated_at = NOW()
-- WHERE (price IS NULL OR price = 0)
--   AND is_active = true;

-- ============================================================
-- Step 2: Verify the fix
-- ============================================================
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN price > 0 THEN 1 END) as products_with_prices,
  COUNT(CASE WHEN price IS NULL OR price = 0 THEN 1 END) as products_without_prices,
  ROUND(AVG(price), 2) as average_price,
  ROUND(MIN(price), 2) as min_price,
  ROUND(MAX(price), 2) as max_price
FROM products
WHERE is_active = true;

-- ============================================================
-- Step 3: Show sample of fixed products
-- ============================================================
SELECT
  name,
  price,
  unit,
  category,
  '✅ FIXED' as status
FROM products
WHERE is_active = true
  AND price > 0
ORDER BY name
LIMIT 20;

-- ============================================================
-- IMPORTANT: After running this
-- ============================================================
-- 1. All 394 products will have default prices
-- 2. You can edit individual prices in the dashboard
-- 3. Future products: Make sure price field is filled when creating
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PRICE FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All products now have default prices';
  RAISE NOTICE 'Update individual prices as needed in dashboard';
  RAISE NOTICE '========================================';
END $$;
