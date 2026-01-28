-- ==============================================================================
-- ADD SUB-CATEGORIES SUPPORT
-- ==============================================================================
-- This migration adds sub-category functionality to allow hierarchical
-- product organization (e.g., Prawns > Tiger Prawns, King Prawns, etc.)
--
-- Date: 2026-01-28
-- Purpose: Enable sub-category organization for products
-- ==============================================================================

-- Create sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  store_id text DEFAULT 'ishas-treat',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  -- Ensure unique sub-category names within a category
  CONSTRAINT unique_subcategory_per_category UNIQUE (category_id, name)
);

-- Enable Row Level Security
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for sub_categories
CREATE POLICY "Anyone can view sub_categories"
  ON sub_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert sub_categories"
  ON sub_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sub_categories"
  ON sub_categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sub_categories"
  ON sub_categories FOR DELETE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_store_id ON sub_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_display_order ON sub_categories(display_order);

-- Add sub_category column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category text DEFAULT NULL;

-- Create index for sub_category lookups
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);

-- Insert default sub-categories for Prawns
-- First, get the category_id for "Fresh & Frozen Seafood"
DO $$
DECLARE
  seafood_category_id uuid;
BEGIN
  -- Get the category ID for Fresh & Frozen Seafood
  SELECT id INTO seafood_category_id
  FROM categories
  WHERE name = 'Fresh & Frozen Seafood'
    AND store_id = 'ishas-treat'
    AND is_active = true
  LIMIT 1;

  -- Only insert if the category exists
  IF seafood_category_id IS NOT NULL THEN
    INSERT INTO sub_categories (name, category_id, store_id, display_order, is_active) VALUES
      ('Tiger Prawns', seafood_category_id, 'ishas-treat', 1, true),
      ('King Prawns', seafood_category_id, 'ishas-treat', 2, true),
      ('Jumbo Prawns', seafood_category_id, 'ishas-treat', 3, true),
      ('Freshwater Prawns', seafood_category_id, 'ishas-treat', 4, true),
      ('White Prawns', seafood_category_id, 'ishas-treat', 5, true),
      ('Brown Prawns', seafood_category_id, 'ishas-treat', 6, true)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;
END $$;

-- Create a view to easily query products with their full category hierarchy
CREATE OR REPLACE VIEW products_with_categories AS
SELECT
  p.id,
  p.name,
  p.price,
  p.category,
  p.sub_category,
  c.id as category_id,
  c.display_order as category_order,
  sc.id as sub_category_id,
  sc.display_order as sub_category_order,
  p.stock_quantity,
  p.low_stock_threshold,
  p.is_active,
  p.created_at
FROM products p
LEFT JOIN categories c ON c.name = p.category AND c.store_id = 'ishas-treat' AND c.is_active = true
LEFT JOIN sub_categories sc ON sc.name = p.sub_category AND sc.category_id = c.id AND sc.is_active = true
WHERE p.is_active = true;

-- Show the new sub-categories structure
SELECT
  c.name as category,
  sc.name as sub_category,
  sc.display_order,
  sc.is_active
FROM sub_categories sc
JOIN categories c ON c.id = sc.category_id
WHERE sc.store_id = 'ishas-treat'
  AND sc.is_active = true
ORDER BY c.display_order, sc.display_order;

-- Helper function to get all sub-categories for a category
CREATE OR REPLACE FUNCTION get_sub_categories(category_name text, p_store_id text DEFAULT 'ishas-treat')
RETURNS TABLE (
  id uuid,
  name text,
  display_order integer,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name,
    sc.display_order,
    sc.is_active
  FROM sub_categories sc
  JOIN categories c ON c.id = sc.category_id
  WHERE c.name = category_name
    AND c.store_id = p_store_id
    AND c.is_active = true
    AND sc.is_active = true
  ORDER BY sc.display_order;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_sub_categories('Fresh & Frozen Seafood');
