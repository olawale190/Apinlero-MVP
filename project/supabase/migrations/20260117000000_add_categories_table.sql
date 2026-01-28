/*
  # Categories Table for Store Admin Management

  Creates a categories table that allows each store admin to manage their own categories.

  1. New Tables
    - `categories`
      - `id` (uuid, primary key) - Unique category identifier
      - `name` (text) - Category name
      - `store_id` (text) - Store identifier for multi-tenant support
      - `display_order` (integer) - Order for display sorting
      - `is_active` (boolean) - Soft delete flag
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on categories table
    - Public access policies for all operations (suitable for internal business tool)

  3. Seed Data
    - Insert default categories for Isha's Treat store
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  store_id text DEFAULT 'ishas-treat',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete categories"
  ON categories FOR DELETE
  USING (true);

-- Create index for store_id lookups
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Insert default categories for Isha's Treat
-- Comprehensive category structure for African & Caribbean wholesale grocery
INSERT INTO categories (name, store_id, display_order) VALUES
  -- Fresh Products
  ('Fresh Meat & Poultry', 'ishas-treat', 1),
  ('Fresh & Frozen Seafood', 'ishas-treat', 2),
  ('Fresh Fruits & Vegetables', 'ishas-treat', 3),
  ('Dairy & Eggs', 'ishas-treat', 4),

  -- Grains & Staples
  ('Grains, Rice & Pasta', 'ishas-treat', 10),
  ('African & World Foods', 'ishas-treat', 11),
  ('Flours', 'ishas-treat', 12),
  ('Beans & Legumes', 'ishas-treat', 13),

  -- Dried & Preserved
  ('Dried Fish', 'ishas-treat', 20),
  ('Dried Vegetables', 'ishas-treat', 21),

  -- Cooking Essentials
  ('Spices, Seasonings & Oils', 'ishas-treat', 30),
  ('Canned, Packaged & Dry Foods', 'ishas-treat', 31),

  -- Bakery & Snacks
  ('Bakery & Breakfast Items', 'ishas-treat', 40),
  ('Snacks & Treats', 'ishas-treat', 41),
  ('Snacks & Confectionery', 'ishas-treat', 42),

  -- Beverages
  ('Drinks & Beverages', 'ishas-treat', 50),

  -- Household
  ('Household & Personal Care', 'ishas-treat', 60),
  ('Household & Essentials', 'ishas-treat', 61),

  -- Family & Specialty
  ('Baby & Family Essentials', 'ishas-treat', 70),
  ('Halal & Specialty Products', 'ishas-treat', 71),

  -- Legacy categories (for backward compatibility with existing products)
  ('Oils & Fats', 'ishas-treat', 80),
  ('Grains & Rice', 'ishas-treat', 81),
  ('Meats', 'ishas-treat', 82),
  ('Seeds & Nuts', 'ishas-treat', 83),
  ('Seasonings', 'ishas-treat', 84),
  ('Spices', 'ishas-treat', 85),
  ('Beverages', 'ishas-treat', 86),
  ('Canned Goods', 'ishas-treat', 87),
  ('Fresh Produce', 'ishas-treat', 88),
  ('Snacks', 'ishas-treat', 89),
  ('Household', 'ishas-treat', 90),

  -- Default
  ('General', 'ishas-treat', 100)
ON CONFLICT DO NOTHING;
