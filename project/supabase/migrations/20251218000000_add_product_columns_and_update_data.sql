/*
  # Add Product Columns for Storefront

  1. Changes
    - Add `unit` column to products table (e.g., "Per KG", "Each", "Per tin")
    - Add `image_url` column to products table (product images)
    - Add `is_active` column to products table (for enabling/disabling products)
    - Add `stock_quantity` column for inventory tracking

  2. Update existing products with units and images
*/

-- Add unit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit text DEFAULT 'Each';
  END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text DEFAULT '';
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add stock_quantity column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 100;
  END IF;
END $$;

-- Update existing products with units and placeholder images
UPDATE products SET
  unit = CASE
    WHEN name LIKE '%Oil%' THEN 'Per bottle'
    WHEN name LIKE '%Flour%' THEN 'Per bag'
    WHEN name LIKE '%Plantain%' THEN 'Per bunch'
    WHEN name LIKE '%Seeds%' THEN 'Per pack'
    WHEN name LIKE '%Peppers%' THEN 'Per pack'
    WHEN name LIKE '%Rice%' THEN 'Per pack'
    WHEN name LIKE '%Fish%' THEN 'Per pack'
    WHEN name LIKE '%Crayfish%' THEN 'Per pack'
    WHEN name LIKE '%Eggs%' THEN 'Per pack'
    WHEN name LIKE '%Seasoning%' THEN 'Per pack'
    WHEN name LIKE '%Nutmeg%' THEN 'Per pack'
    ELSE 'Each'
  END,
  image_url = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400',
  is_active = true,
  stock_quantity = floor(random() * 50 + 20)::integer
WHERE is_active IS NULL OR unit IS NULL OR image_url IS NULL OR image_url = '';

-- Create index for active products lookup
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
