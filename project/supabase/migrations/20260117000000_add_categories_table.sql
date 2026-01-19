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
INSERT INTO categories (name, store_id, display_order) VALUES
  ('Grains', 'ishas-treat', 1),
  ('Oils', 'ishas-treat', 2),
  ('Produce', 'ishas-treat', 3),
  ('Fish', 'ishas-treat', 4),
  ('Meat', 'ishas-treat', 5),
  ('Spices', 'ishas-treat', 6),
  ('Canned', 'ishas-treat', 7),
  ('Drinks', 'ishas-treat', 8),
  ('Flour', 'ishas-treat', 9),
  ('General', 'ishas-treat', 100)
ON CONFLICT DO NOTHING;
