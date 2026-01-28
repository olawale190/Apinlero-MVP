-- ==============================================================================
-- MAP EXISTING PRODUCTS TO NEW CATEGORY STRUCTURE
-- ==============================================================================
-- This migration maps products from legacy categories to the new comprehensive
-- category structure while preserving backward compatibility
--
-- Date: 2026-01-28
-- Purpose: Update product categories to match new structure
-- ==============================================================================

-- Update products to use new primary categories
-- Maps legacy categories to new comprehensive categories

-- Oils & Fats -> Spices, Seasonings & Oils
UPDATE products
SET category = 'Spices, Seasonings & Oils'
WHERE category = 'Oils & Fats'
  AND is_active = true;

-- Grains & Rice -> Grains, Rice & Pasta
UPDATE products
SET category = 'Grains, Rice & Pasta'
WHERE category = 'Grains & Rice'
  AND is_active = true;

-- Meats -> Fresh Meat & Poultry
UPDATE products
SET category = 'Fresh Meat & Poultry'
WHERE category IN ('Meats', 'Meat')
  AND is_active = true;

-- Seeds & Nuts -> Spices, Seasonings & Oils
UPDATE products
SET category = 'Spices, Seasonings & Oils'
WHERE category = 'Seeds & Nuts'
  AND is_active = true;

-- Seasonings -> Spices, Seasonings & Oils
UPDATE products
SET category = 'Spices, Seasonings & Oils'
WHERE category = 'Seasonings'
  AND is_active = true;

-- Spices -> Spices, Seasonings & Oils
UPDATE products
SET category = 'Spices, Seasonings & Oils'
WHERE category = 'Spices'
  AND is_active = true;

-- Beverages -> Drinks & Beverages
UPDATE products
SET category = 'Drinks & Beverages'
WHERE category = 'Beverages'
  AND is_active = true;

-- Canned Goods -> Canned, Packaged & Dry Foods
UPDATE products
SET category = 'Canned, Packaged & Dry Foods'
WHERE category = 'Canned Goods'
  AND is_active = true;

-- Fresh Produce -> Fresh Fruits & Vegetables
UPDATE products
SET category = 'Fresh Fruits & Vegetables'
WHERE category = 'Fresh Produce'
  AND is_active = true;

-- Snacks -> Snacks & Treats
UPDATE products
SET category = 'Snacks & Treats'
WHERE category = 'Snacks'
  AND is_active = true;

-- Household -> Household & Personal Care
UPDATE products
SET category = 'Household & Personal Care'
WHERE category = 'Household'
  AND is_active = true;

-- Flours stays the same (already in new structure)
-- Beans & Legumes stays the same (already in new structure)
-- Dried Fish stays the same (already in new structure)
-- Dried Vegetables stays the same (already in new structure)

-- Show summary of product distribution across categories
SELECT
  category,
  COUNT(*) as product_count,
  ROUND(AVG(price)::numeric, 2) as avg_price
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY
  CASE category
    -- Fresh Products
    WHEN 'Fresh Meat & Poultry' THEN 1
    WHEN 'Fresh & Frozen Seafood' THEN 2
    WHEN 'Fresh Fruits & Vegetables' THEN 3
    WHEN 'Dairy & Eggs' THEN 4
    -- Grains & Staples
    WHEN 'Grains, Rice & Pasta' THEN 10
    WHEN 'African & World Foods' THEN 11
    WHEN 'Flours' THEN 12
    WHEN 'Beans & Legumes' THEN 13
    -- Dried & Preserved
    WHEN 'Dried Fish' THEN 20
    WHEN 'Dried Vegetables' THEN 21
    -- Cooking Essentials
    WHEN 'Spices, Seasonings & Oils' THEN 30
    WHEN 'Canned, Packaged & Dry Foods' THEN 31
    -- Bakery & Snacks
    WHEN 'Bakery & Breakfast Items' THEN 40
    WHEN 'Snacks & Treats' THEN 41
    WHEN 'Snacks & Confectionery' THEN 42
    -- Beverages
    WHEN 'Drinks & Beverages' THEN 50
    -- Household
    WHEN 'Household & Personal Care' THEN 60
    WHEN 'Household & Essentials' THEN 61
    -- Family & Specialty
    WHEN 'Baby & Family Essentials' THEN 70
    WHEN 'Halal & Specialty Products' THEN 71
    -- Default
    ELSE 100
  END;

-- Identify any products that might need manual categorization
SELECT name, category, price
FROM products
WHERE is_active = true
  AND (category IS NULL
       OR category NOT IN (
         SELECT name FROM categories
         WHERE store_id = 'ishas-treat' AND is_active = true
       ))
ORDER BY name;
