-- ==============================================================================
-- UPDATE CATEGORIES TO MATCH PRODUCT CATALOG
-- ==============================================================================
-- This migration updates the categories table to include all categories
-- actually used in the Isha's Treat product catalog
--
-- Date: 2026-01-28
-- Purpose: Fix missing categories that Isha mentioned were not included
-- ==============================================================================

-- First, deactivate old categories that don't match the new schema
UPDATE categories
SET is_active = false
WHERE store_id = 'ishas-treat'
  AND name IN ('Grains', 'Oils', 'Produce', 'Fish', 'Meat', 'Spices', 'Canned', 'Drinks', 'Flour');

-- Insert all the correct categories used in products
-- Using ON CONFLICT to update existing or insert new categories
INSERT INTO categories (name, store_id, display_order, is_active) VALUES
  -- Fresh Products
  ('Fresh Meat & Poultry', 'ishas-treat', 1, true),
  ('Fresh & Frozen Seafood', 'ishas-treat', 2, true),
  ('Fresh Fruits & Vegetables', 'ishas-treat', 3, true),
  ('Dairy & Eggs', 'ishas-treat', 4, true),

  -- Grains & Staples
  ('Grains, Rice & Pasta', 'ishas-treat', 10, true),
  ('African & World Foods', 'ishas-treat', 11, true),
  ('Flours', 'ishas-treat', 12, true),
  ('Beans & Legumes', 'ishas-treat', 13, true),

  -- Dried & Preserved
  ('Dried Fish', 'ishas-treat', 20, true),
  ('Dried Vegetables', 'ishas-treat', 21, true),

  -- Cooking Essentials
  ('Spices, Seasonings & Oils', 'ishas-treat', 30, true),
  ('Canned, Packaged & Dry Foods', 'ishas-treat', 31, true),

  -- Bakery & Snacks
  ('Bakery & Breakfast Items', 'ishas-treat', 40, true),
  ('Snacks & Treats', 'ishas-treat', 41, true),
  ('Snacks & Confectionery', 'ishas-treat', 42, true),

  -- Beverages
  ('Drinks & Beverages', 'ishas-treat', 50, true),

  -- Household
  ('Household & Personal Care', 'ishas-treat', 60, true),
  ('Household & Essentials', 'ishas-treat', 61, true),

  -- Family & Specialty
  ('Baby & Family Essentials', 'ishas-treat', 70, true),
  ('Halal & Specialty Products', 'ishas-treat', 71, true),

  -- Legacy categories (for backward compatibility with existing products)
  ('Oils & Fats', 'ishas-treat', 80, true),
  ('Grains & Rice', 'ishas-treat', 81, true),
  ('Meats', 'ishas-treat', 82, true),
  ('Seeds & Nuts', 'ishas-treat', 83, true),
  ('Seasonings', 'ishas-treat', 84, true),
  ('Spices', 'ishas-treat', 85, true),
  ('Beverages', 'ishas-treat', 86, true),
  ('Canned Goods', 'ishas-treat', 87, true),
  ('Fresh Produce', 'ishas-treat', 88, true),
  ('Snacks', 'ishas-treat', 89, true),
  ('Household', 'ishas-treat', 90, true)
ON CONFLICT (name, store_id) DO UPDATE
  SET is_active = true,
      display_order = EXCLUDED.display_order;

-- Ensure General category exists for uncategorized items
INSERT INTO categories (name, store_id, display_order, is_active) VALUES
  ('General', 'ishas-treat', 100, true)
ON CONFLICT (name, store_id) DO UPDATE
  SET is_active = true;

-- Create a unique index to prevent duplicate category names per store
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_name_per_store
  ON categories(store_id, name)
  WHERE is_active = true;

-- Show the updated categories
SELECT name, display_order, is_active
FROM categories
WHERE store_id = 'ishas-treat'
ORDER BY display_order;
