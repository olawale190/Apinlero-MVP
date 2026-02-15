-- ============================================================
-- Check Price Data - Diagnose £0.00 or blank prices issue
-- Run this in Supabase SQL Editor
-- Date: 2026-02-14
-- ============================================================

-- 1. Check for products with zero or null prices
SELECT
  id,
  name,
  price,
  CASE
    WHEN price IS NULL THEN '❌ NULL'
    WHEN price = 0 THEN '❌ ZERO'
    WHEN price < 0 THEN '❌ NEGATIVE'
    ELSE '✅ OK'
  END as price_status,
  unit,
  stock_quantity,
  business_id,
  created_at
FROM products
WHERE is_active = true
ORDER BY
  CASE
    WHEN price IS NULL THEN 1
    WHEN price = 0 THEN 2
    WHEN price < 0 THEN 3
    ELSE 4
  END,
  created_at DESC
LIMIT 50;

-- 2. Summary statistics
SELECT
  COUNT(*) as total_products,
  COUNT(CASE WHEN price IS NULL THEN 1 END) as null_prices,
  COUNT(CASE WHEN price = 0 THEN 1 END) as zero_prices,
  COUNT(CASE WHEN price < 0 THEN 1 END) as negative_prices,
  COUNT(CASE WHEN price > 0 THEN 1 END) as valid_prices,
  ROUND(AVG(price), 2) as avg_price,
  ROUND(MIN(price), 2) as min_price,
  ROUND(MAX(price), 2) as max_price
FROM products
WHERE is_active = true;

-- 3. Check business ownership
SELECT
  b.id as business_id,
  b.name as business_name,
  b.currency,
  COUNT(p.id) as product_count,
  COUNT(CASE WHEN p.price IS NULL OR p.price = 0 THEN 1 END) as problem_prices
FROM businesses b
LEFT JOIN products p ON p.business_id = b.id AND p.is_active = true
WHERE b.is_active = true
GROUP BY b.id, b.name, b.currency;

-- 4. Check if products table has business_id column
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('id', 'name', 'price', 'business_id', 'is_active')
ORDER BY ordinal_position;
