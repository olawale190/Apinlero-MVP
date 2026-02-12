-- ==============================================================================
-- APINLERO: CONSOLIDATED PENDING MIGRATIONS
-- ==============================================================================
-- Generated: 2026-02-11 (v3 - fixed policy + is_active errors)
-- Purpose: Single file containing ALL pending migrations in correct dependency order
-- Target: Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: gafoezdpaotwvpfldyhc
--
-- HOW TO USE:
--   1. Open Supabase Dashboard > SQL Editor
--   2. Paste this entire file
--   3. Click "Run" (it's safe to re-run - uses IF NOT EXISTS / ON CONFLICT)
--   4. Check the NOTICES tab for verification output
-- ==============================================================================


-- ============================================================================
-- MIGRATION 1: Create products & orders tables (20251208071120)
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  category text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text DEFAULT '',
  delivery_address text DEFAULT '',
  channel text NOT NULL CHECK (channel IN ('WhatsApp', 'Web', 'Phone', 'Walk-in')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_fee numeric(10, 2) DEFAULT 5.00,
  total numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Delivered')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view products') THEN
    CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can insert products') THEN
    CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can update products') THEN
    CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can view orders') THEN
    CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can insert orders') THEN
    CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can update orders') THEN
    CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can delete orders') THEN
    CREATE POLICY "Anyone can delete orders" ON orders FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

DO $$ BEGIN RAISE NOTICE '[1/23] Base products & orders tables OK'; END $$;


-- ============================================================================
-- MIGRATION 2: Add missing order columns (20251208220433)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'email') THEN
    ALTER TABLE orders ADD COLUMN email text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_method') THEN
    ALTER TABLE orders ADD COLUMN delivery_method text DEFAULT 'delivery' CHECK (delivery_method IN ('delivery', 'collection'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer'));
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '[2/23] Order columns OK'; END $$;


-- ============================================================================
-- MIGRATION 3: Add product columns for storefront (20251218000000)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'unit') THEN
    ALTER TABLE products ADD COLUMN unit text DEFAULT 'Each';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE products ADD COLUMN image_url text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 100;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

DO $$ BEGIN RAISE NOTICE '[3/23] Product storefront columns OK'; END $$;


-- ============================================================================
-- MIGRATION 4: Create categories table (20260117000000)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  store_id text DEFAULT 'ishas-treat',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can view categories') THEN
    CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can insert categories') THEN
    CREATE POLICY "Anyone can insert categories" ON categories FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can update categories') THEN
    CREATE POLICY "Anyone can update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Anyone can delete categories') THEN
    CREATE POLICY "Anyone can delete categories" ON categories FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

INSERT INTO categories (name, store_id, display_order) VALUES
  ('Fresh Meat & Poultry', 'ishas-treat', 1),
  ('Fresh & Frozen Seafood', 'ishas-treat', 2),
  ('Fresh Fruits & Vegetables', 'ishas-treat', 3),
  ('Dairy & Eggs', 'ishas-treat', 4),
  ('Grains, Rice & Pasta', 'ishas-treat', 10),
  ('African & World Foods', 'ishas-treat', 11),
  ('Flours', 'ishas-treat', 12),
  ('Beans & Legumes', 'ishas-treat', 13),
  ('Dried Fish', 'ishas-treat', 20),
  ('Dried Vegetables', 'ishas-treat', 21),
  ('Spices, Seasonings & Oils', 'ishas-treat', 30),
  ('Canned, Packaged & Dry Foods', 'ishas-treat', 31),
  ('Bakery & Breakfast Items', 'ishas-treat', 40),
  ('Snacks & Treats', 'ishas-treat', 41),
  ('Snacks & Confectionery', 'ishas-treat', 42),
  ('Drinks & Beverages', 'ishas-treat', 50),
  ('Household & Personal Care', 'ishas-treat', 60),
  ('Household & Essentials', 'ishas-treat', 61),
  ('Baby & Family Essentials', 'ishas-treat', 70),
  ('Halal & Specialty Products', 'ishas-treat', 71),
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
  ('General', 'ishas-treat', 100)
ON CONFLICT DO NOTHING;

DO $$ BEGIN RAISE NOTICE '[4/23] Categories table OK'; END $$;


-- ============================================================================
-- MIGRATION 5: Delete placeholder products (20260126000000)
-- ============================================================================

DELETE FROM products
WHERE (name = 'Jollof Rice Mix' AND price = 8.50)
   OR (name = 'Plantain (Green)' AND price = 3.25)
   OR (name = 'Palm Oil (5L)' AND price = 25.00)
   OR (name = 'Egusi Seeds' AND price = 12.50)
   OR (name = 'Stockfish' AND price = 18.75)
   OR (name = 'Scotch Bonnet Peppers' AND price = 4.50)
   OR (name = 'Yam Flour' AND price = 6.99)
   OR (name = 'Maggi Seasoning' AND price = 3.50)
   OR (name = 'Cassava Flour' AND price = 5.75)
   OR (name = 'Dried Crayfish' AND price = 15.00)
   OR (name = 'Garden Eggs' AND price = 4.25)
   OR (name = 'Fufu Flour' AND price = 7.50)
   OR (name = 'Coconut Oil (1L)' AND price = 12.00)
   OR (name = 'Red Palm Oil' AND price = 22.50)
   OR (name = 'African Nutmeg' AND price = 8.25);

DO $$ BEGIN RAISE NOTICE '[5/23] Placeholder products deleted OK'; END $$;


-- ============================================================================
-- MIGRATION 6: Fix products RLS policy (20260126000001)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
DROP POLICY IF EXISTS "Enable update access for all users" ON products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON products;

CREATE POLICY "Enable read access for all users" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE TO public USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN RAISE NOTICE '[6/23] Products RLS fixed OK'; END $$;


-- ============================================================================
-- MIGRATION 7: Add Stripe columns to businesses (20260126232812)
-- ============================================================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account ON businesses(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_connected ON businesses(stripe_connected_at) WHERE stripe_connected_at IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '[7/23] Stripe columns on businesses OK'; END $$;


-- ============================================================================
-- MIGRATION 8: Add business_id to core tables (20260127000000)
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    EXECUTE 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE';
  END IF;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_active ON products(business_id, is_active);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '[8/23] Business_id columns on core tables OK'; END $$;


-- ============================================================================
-- MIGRATION 9: Backfill business_id (20260127000001)
-- ============================================================================

INSERT INTO businesses (
  id, name, slug, owner_email, phone, address, city, country, currency, timezone, plan, monthly_message_limit, is_active, created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'Isha''s Treat & Groceries', 'ishas-treat', 'isha@ishas-treat.com', '+447448682282',
  'South London', 'London', 'United Kingdom', 'GBP', 'Europe/London', 'pilot', 10000, true, NOW()
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

DO $$
DECLARE ishas_id UUID; cnt INTEGER;
BEGIN
  SELECT id INTO ishas_id FROM businesses WHERE slug = 'ishas-treat' LIMIT 1;
  IF ishas_id IS NOT NULL THEN
    UPDATE products SET business_id = ishas_id WHERE business_id IS NULL;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    RAISE NOTICE 'Backfilled % products', cnt;
  END IF;
END $$;

DO $$
DECLARE ishas_id UUID; cnt INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    SELECT id INTO ishas_id FROM businesses WHERE slug = 'ishas-treat' LIMIT 1;
    IF ishas_id IS NOT NULL THEN
      EXECUTE format('UPDATE customers SET business_id = %L WHERE business_id IS NULL', ishas_id);
      GET DIAGNOSTICS cnt = ROW_COUNT;
      RAISE NOTICE 'Backfilled % customers', cnt;
    END IF;
  END IF;
END $$;

DO $$
DECLARE ishas_id UUID; cnt INTEGER;
BEGIN
  SELECT id INTO ishas_id FROM businesses WHERE slug = 'ishas-treat' LIMIT 1;
  IF ishas_id IS NOT NULL THEN
    UPDATE orders SET business_id = ishas_id WHERE business_id IS NULL;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    RAISE NOTICE 'Backfilled % orders', cnt;
  END IF;
END $$;

DO $$
DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM products WHERE business_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE products ALTER COLUMN business_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'WARNING: % products still have NULL business_id', null_count;
  END IF;
END $$;

DO $$
DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM orders WHERE business_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE orders ALTER COLUMN business_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'WARNING: % orders still have NULL business_id', null_count;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '[9/23] Business_id backfill OK'; END $$;


-- ============================================================================
-- MIGRATION 10: Enable RLS policies for multi-tenant (20260127000002)
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to orders" ON orders;
CREATE POLICY "Service role full access to orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own business products" ON products;
CREATE POLICY "Users view own business products" ON products FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

DROP POLICY IF EXISTS "Users manage own business products" ON products;
CREATE POLICY "Users manage own business products" ON products FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

DROP POLICY IF EXISTS "Users view own business orders" ON orders;
CREATE POLICY "Users view own business orders" ON orders FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

DROP POLICY IF EXISTS "Users manage own business orders" ON orders;
CREATE POLICY "Users manage own business orders" ON orders FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Service role full access to customers" ON customers;
    CREATE POLICY "Service role full access to customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Users view own business customers" ON customers;
    CREATE POLICY "Users view own business customers" ON customers FOR SELECT TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));
    DROP POLICY IF EXISTS "Users manage own business customers" ON customers;
    CREATE POLICY "Users manage own business customers" ON customers FOR ALL TO authenticated
      USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()))
      WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.email()));
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '[10/23] Multi-tenant RLS policies OK'; END $$;


-- ============================================================================
-- MIGRATION 11: Stripe key encryption with pgcrypto (20260127010000)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_stripe_key(secret_key TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE master_key TEXT;
BEGIN
  master_key := current_setting('app.settings.stripe_encryption_key', true);
  IF master_key IS NULL OR master_key = '' THEN
    master_key := 'dev-encryption-key-change-in-production-2026';
  END IF;
  RETURN encode(pgp_sym_encrypt(secret_key, master_key), 'base64');
END; $$;

CREATE OR REPLACE FUNCTION decrypt_stripe_key(encrypted_key TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE master_key TEXT;
BEGIN
  master_key := current_setting('app.settings.stripe_encryption_key', true);
  IF master_key IS NULL OR master_key = '' THEN
    master_key := 'dev-encryption-key-change-in-production-2026';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_key, 'base64'), master_key);
END; $$;

CREATE OR REPLACE FUNCTION auto_encrypt_stripe_key()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stripe_secret_key_encrypted IS NOT NULL
    AND NEW.stripe_secret_key_encrypted != ''
    AND NEW.stripe_secret_key_encrypted LIKE 'sk_%' THEN
    NEW.stripe_secret_key_encrypted := encrypt_stripe_key(NEW.stripe_secret_key_encrypted);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS encrypt_stripe_key_trigger ON businesses;
CREATE TRIGGER encrypt_stripe_key_trigger
  BEFORE INSERT OR UPDATE OF stripe_secret_key_encrypted ON businesses
  FOR EACH ROW EXECUTE FUNCTION auto_encrypt_stripe_key();

CREATE TABLE IF NOT EXISTS stripe_key_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_by TEXT,
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'view'))
);
CREATE INDEX IF NOT EXISTS idx_stripe_access_log_business ON stripe_key_access_log(business_id, accessed_at DESC);

DO $$ BEGIN RAISE NOTICE '[11/23] Stripe encryption OK'; END $$;


-- ============================================================================
-- MIGRATION 12: Update categories (20260128000000)
-- ============================================================================

UPDATE categories SET is_active = false
WHERE store_id = 'ishas-treat'
  AND name IN ('Grains', 'Oils', 'Produce', 'Fish', 'Meat', 'Spices', 'Canned', 'Drinks', 'Flour');

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_name_per_store
  ON categories(store_id, name) WHERE is_active = true;

DO $$ BEGIN RAISE NOTICE '[12/23] Categories updated OK'; END $$;


-- ============================================================================
-- MIGRATION 13: Map products to new categories (20260128000001)
-- ============================================================================

UPDATE products SET category = 'Spices, Seasonings & Oils' WHERE category = 'Oils & Fats' AND is_active = true;
UPDATE products SET category = 'Grains, Rice & Pasta' WHERE category = 'Grains & Rice' AND is_active = true;
UPDATE products SET category = 'Fresh Meat & Poultry' WHERE category IN ('Meats', 'Meat') AND is_active = true;
UPDATE products SET category = 'Spices, Seasonings & Oils' WHERE category = 'Seeds & Nuts' AND is_active = true;
UPDATE products SET category = 'Spices, Seasonings & Oils' WHERE category = 'Seasonings' AND is_active = true;
UPDATE products SET category = 'Spices, Seasonings & Oils' WHERE category = 'Spices' AND is_active = true;
UPDATE products SET category = 'Drinks & Beverages' WHERE category = 'Beverages' AND is_active = true;
UPDATE products SET category = 'Canned, Packaged & Dry Foods' WHERE category = 'Canned Goods' AND is_active = true;
UPDATE products SET category = 'Fresh Fruits & Vegetables' WHERE category = 'Fresh Produce' AND is_active = true;
UPDATE products SET category = 'Snacks & Treats' WHERE category = 'Snacks' AND is_active = true;
UPDATE products SET category = 'Household & Personal Care' WHERE category = 'Household' AND is_active = true;

DO $$ BEGIN RAISE NOTICE '[13/23] Products mapped to new categories OK'; END $$;


-- ============================================================================
-- MIGRATION 14: Add subcategories (20260128000002)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  store_id text DEFAULT 'ishas-treat',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_subcategory_per_category UNIQUE (category_id, name)
);

ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sub_categories' AND policyname = 'Anyone can view sub_categories') THEN
    CREATE POLICY "Anyone can view sub_categories" ON sub_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sub_categories' AND policyname = 'Anyone can insert sub_categories') THEN
    CREATE POLICY "Anyone can insert sub_categories" ON sub_categories FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sub_categories' AND policyname = 'Anyone can update sub_categories') THEN
    CREATE POLICY "Anyone can update sub_categories" ON sub_categories FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sub_categories' AND policyname = 'Anyone can delete sub_categories') THEN
    CREATE POLICY "Anyone can delete sub_categories" ON sub_categories FOR DELETE USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_store_id ON sub_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_display_order ON sub_categories(display_order);

ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category text DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);

DO $$
DECLARE seafood_cat_id uuid;
BEGIN
  SELECT id INTO seafood_cat_id FROM categories
  WHERE name = 'Fresh & Frozen Seafood' AND store_id = 'ishas-treat' AND is_active = true LIMIT 1;
  IF seafood_cat_id IS NOT NULL THEN
    INSERT INTO sub_categories (name, category_id, store_id, display_order) VALUES
      ('Tiger Prawns', seafood_cat_id, 'ishas-treat', 1),
      ('King Prawns', seafood_cat_id, 'ishas-treat', 2),
      ('Jumbo Prawns', seafood_cat_id, 'ishas-treat', 3),
      ('Freshwater Prawns', seafood_cat_id, 'ishas-treat', 4),
      ('White Prawns', seafood_cat_id, 'ishas-treat', 5),
      ('Brown Prawns', seafood_cat_id, 'ishas-treat', 6)
    ON CONFLICT (category_id, name) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_sub_categories(category_name text, p_store_id text DEFAULT 'ishas-treat')
RETURNS TABLE (id uuid, name text, display_order integer, is_active boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.name, sc.display_order, sc.is_active
  FROM sub_categories sc JOIN categories c ON c.id = sc.category_id
  WHERE c.name = category_name AND c.store_id = p_store_id AND c.is_active = true AND sc.is_active = true
  ORDER BY sc.display_order;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE '[14/23] Subcategories OK'; END $$;


-- ============================================================================
-- MIGRATION 15: Customer auth tables (20260131000001)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_business_id ON customer_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Other')),
  full_name TEXT NOT NULL, phone TEXT, address_line1 TEXT NOT NULL, address_line2 TEXT,
  city TEXT NOT NULL, postcode TEXT NOT NULL, country TEXT DEFAULT 'UK',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_business_id ON customer_addresses(business_id);

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_business_id ON wishlist(business_id);

CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_customer_id ON recently_viewed(customer_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product_id ON recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own profile" ON customer_profiles;
CREATE POLICY "Customers can view own profile" ON customer_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
CREATE POLICY "Customers can insert own profile" ON customer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;
CREATE POLICY "Customers can update own profile" ON customer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;
CREATE POLICY "Customers can view own addresses" ON customer_addresses FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
CREATE POLICY "Customers can insert own addresses" ON customer_addresses FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
CREATE POLICY "Customers can update own addresses" ON customer_addresses FOR UPDATE TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;
CREATE POLICY "Customers can delete own addresses" ON customer_addresses FOR DELETE TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own wishlist" ON wishlist;
CREATE POLICY "Customers can view own wishlist" ON wishlist FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can insert to wishlist" ON wishlist;
CREATE POLICY "Customers can insert to wishlist" ON wishlist FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can delete from wishlist" ON wishlist;
CREATE POLICY "Customers can delete from wishlist" ON wishlist FOR DELETE TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own recently viewed" ON recently_viewed;
CREATE POLICY "Customers can view own recently viewed" ON recently_viewed FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can insert recently viewed" ON recently_viewed;
CREATE POLICY "Customers can insert recently viewed" ON recently_viewed FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can update recently viewed" ON recently_viewed;
CREATE POLICY "Customers can update recently viewed" ON recently_viewed FOR UPDATE TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can delete recently viewed" ON recently_viewed;
CREATE POLICY "Customers can delete recently viewed" ON recently_viewed FOR DELETE TO authenticated
  USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE '[15/23] Customer auth tables OK'; END $$;


-- ============================================================================
-- MIGRATION 16: Calendar system tables (20260201000000)
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL, description text,
  event_type text NOT NULL CHECK (event_type IN ('business_event', 'cultural_event', 'delivery_slot', 'appointment', 'store_hours')),
  start_datetime timestamptz NOT NULL, end_datetime timestamptz,
  all_day boolean DEFAULT false, timezone text DEFAULT 'Europe/London',
  is_recurring boolean DEFAULT false, recurrence_rule jsonb,
  recurrence_parent_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  emoji text, expected_increase integer, communities text[], affected_products text[], stock_recommendations jsonb,
  customer_id uuid, customer_name text, customer_phone text, customer_email text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  max_bookings integer DEFAULT 1, current_bookings integer DEFAULT 0, booking_duration_minutes integer DEFAULT 30,
  color text, priority integer DEFAULT 0, is_public boolean DEFAULT false,
  send_reminder boolean DEFAULT false, reminder_minutes integer DEFAULT 60,
  metadata jsonb DEFAULT '{}'::jsonb, created_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_slot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL, end_time time NOT NULL,
  max_bookings integer DEFAULT 5, is_active boolean DEFAULT true, zones text[],
  delivery_fee numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL, customer_phone text, customer_email text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes text, metadata jsonb DEFAULT '{}'::jsonb,
  booked_at timestamptz DEFAULT now(), confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_business ON calendar_events(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(business_id, event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(business_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_business ON delivery_slot_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_business ON event_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_event ON event_bookings(event_id);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Allow public read access to calendar_events') THEN
    CREATE POLICY "Allow public read access to calendar_events" ON calendar_events FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Allow public insert access to calendar_events') THEN
    CREATE POLICY "Allow public insert access to calendar_events" ON calendar_events FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Allow public update access to calendar_events') THEN
    CREATE POLICY "Allow public update access to calendar_events" ON calendar_events FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Allow public delete access to calendar_events') THEN
    CREATE POLICY "Allow public delete access to calendar_events" ON calendar_events FOR DELETE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_slot_templates' AND policyname = 'Allow public read access to delivery_slot_templates') THEN
    CREATE POLICY "Allow public read access to delivery_slot_templates" ON delivery_slot_templates FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_slot_templates' AND policyname = 'Allow public insert access to delivery_slot_templates') THEN
    CREATE POLICY "Allow public insert access to delivery_slot_templates" ON delivery_slot_templates FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_bookings' AND policyname = 'Allow public read access to event_bookings') THEN
    CREATE POLICY "Allow public read access to event_bookings" ON event_bookings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_bookings' AND policyname = 'Allow public insert access to event_bookings') THEN
    CREATE POLICY "Allow public insert access to event_bookings" ON event_bookings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_delivery_slot_templates_updated_at ON delivery_slot_templates;
CREATE TRIGGER update_delivery_slot_templates_updated_at BEFORE UPDATE ON delivery_slot_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_event_bookings_updated_at ON event_bookings;
CREATE TRIGGER update_event_bookings_updated_at BEFORE UPDATE ON event_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE '[16/23] Calendar system tables OK'; END $$;


-- ============================================================================
-- MIGRATION 17: Cultural events seed (skipped - run separately)
-- ============================================================================

DO $$ BEGIN RAISE NOTICE '[17/23] Cultural events - run 20260201000001_seed_cultural_events.sql separately'; END $$;


-- ============================================================================
-- MIGRATION 18: Security RLS policies (20260203000001)
-- ============================================================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
CREATE POLICY "Users can view own profile" ON customer_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
CREATE POLICY "Users can update own profile" ON customer_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
CREATE POLICY "Users can insert own profile" ON customer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role has full access to profiles" ON customer_profiles;
CREATE POLICY "Service role has full access to profiles" ON customer_profiles FOR ALL USING (auth.role() = 'service_role');

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_active')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'owner_email')
  THEN
    ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
    CREATE POLICY "Public can view active businesses" ON businesses FOR SELECT USING (is_active = true);
    DROP POLICY IF EXISTS "Owners can manage own business" ON businesses;
    CREATE POLICY "Owners can manage own business" ON businesses FOR ALL USING (owner_email = auth.jwt()->>'email');
    DROP POLICY IF EXISTS "Service role has full access to businesses" ON businesses;
    CREATE POLICY "Service role has full access to businesses" ON businesses FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_type TEXT NOT NULL, table_name TEXT,
  record_id TEXT, user_id UUID, user_email TEXT, ip_address TEXT, details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON security_audit_log(created_at);
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages audit log" ON security_audit_log;
CREATE POLICY "Service role manages audit log" ON security_audit_log FOR ALL USING (auth.role() = 'service_role');

DO $$ BEGIN RAISE NOTICE '[18/23] Security RLS policies OK'; END $$;


-- ============================================================================
-- MIGRATION 19: JWT business claims + user_businesses (002_add_jwt_business_claims)
-- ============================================================================

-- Create user_businesses with ALL columns including is_active
CREATE TABLE IF NOT EXISTS user_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions jsonb DEFAULT '{"products": ["read", "write", "delete"], "orders": ["read", "write"], "analytics": ["read"], "settings": ["read"]}'::jsonb,
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Ensure is_active column exists (in case table was created by simpler migration 22 first)
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS invited_by uuid;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_business_id ON user_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_active ON user_businesses(is_active) WHERE is_active = true;

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email text;
CREATE INDEX IF NOT EXISTS idx_businesses_owner_email ON businesses(owner_email);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE is_active = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_key') THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_user_business_id(user_uuid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE business_uuid uuid;
BEGIN
  SELECT ub.business_id INTO business_uuid
  FROM user_businesses ub INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid AND ub.is_active = true AND b.is_active = true
  ORDER BY ub.joined_at DESC LIMIT 1;
  IF business_uuid IS NULL THEN
    SELECT b.id INTO business_uuid FROM businesses b INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid AND b.is_active = true LIMIT 1;
  END IF;
  RETURN business_uuid;
END; $$;

CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid uuid)
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE business_uuids uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT ub.business_id) INTO business_uuids
  FROM user_businesses ub INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid AND ub.is_active = true AND b.is_active = true;
  IF business_uuids IS NULL OR array_length(business_uuids, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT b.id) INTO business_uuids FROM businesses b INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid AND b.is_active = true;
  END IF;
  RETURN COALESCE(business_uuids, ARRAY[]::uuid[]);
END; $$;

INSERT INTO user_businesses (user_id, business_id, role)
SELECT DISTINCT u.id, b.id, 'owner'
FROM businesses b INNER JOIN auth.users u ON u.email = b.owner_email
WHERE b.owner_email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_businesses ub WHERE ub.user_id = u.id AND ub.business_id = b.id)
ON CONFLICT (user_id, business_id) DO NOTHING;

ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own business associations" ON user_businesses;
CREATE POLICY "Users can view their own business associations" ON user_businesses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read own business mappings" ON user_businesses;
CREATE POLICY "Users can read own business mappings" ON user_businesses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can insert own mappings" ON user_businesses;
CREATE POLICY "Authenticated users can insert own mappings" ON user_businesses FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN RAISE NOTICE '[19/23] JWT business claims + user_businesses OK'; END $$;


-- ============================================================================
-- MIGRATION 20: AI inventory & promo tables (20260205000001)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('reorder_suggestion', 'expiry_warning', 'stock_optimization', 'bundle_recommendation', 'seasonal_prediction', 'waste_alert', 'velocity_analysis', 'demand_forecast')),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE, product_ids uuid[],
  title text NOT NULL, description text NOT NULL, ai_reasoning text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence_score numeric(3, 2), recommended_action jsonb, expected_impact jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  actioned_at timestamptz, outcome_notes text, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_inventory_insights_business ON inventory_insights(business_id);

CREATE TABLE IF NOT EXISTS product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_number text NOT NULL, quantity integer NOT NULL CHECK (quantity >= 0),
  cost_per_unit numeric(10, 2) CHECK (cost_per_unit >= 0),
  received_date date NOT NULL, expiry_date date,
  days_until_expiry integer GENERATED ALWAYS AS (
    CASE WHEN expiry_date IS NOT NULL THEN EXTRACT(day FROM (expiry_date - CURRENT_DATE))::integer ELSE NULL END
  ) STORED,
  location text, supplier_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'sold', 'discarded')),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_batches_business ON product_batches(business_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);

CREATE TABLE IF NOT EXISTS product_velocity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL, period_end date NOT NULL,
  units_sold integer DEFAULT 0, revenue numeric(10, 2) DEFAULT 0, avg_daily_sales numeric(10, 2),
  trend text CHECK (trend IN ('increasing', 'stable', 'decreasing')), trend_percentage numeric(5, 2),
  seasonal_factor numeric(3, 2), cultural_events text[], created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, product_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_product_velocity_business ON product_velocity(business_id);

CREATE TABLE IF NOT EXISTS promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text,
  campaign_type text NOT NULL CHECK (campaign_type IN ('flash_sale', 'bundle_offer', 'seasonal', 'win_back', 'loyalty_reward', 'new_product', 'cultural_event', 'custom')),
  ai_generated boolean DEFAULT false, ai_reasoning text, product_ids uuid[], bundle_config jsonb,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value numeric(10, 2),
  target_segment text CHECK (target_segment IN ('all', 'new_customers', 'returning', 'inactive', 'vip', 'custom')),
  target_criteria jsonb, estimated_reach integer, message_template text NOT NULL, visual_card_url text,
  start_date timestamptz NOT NULL, end_date timestamptz NOT NULL, send_time time,
  channels text[] DEFAULT ARRAY['whatsapp', 'email'],
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  sent_count integer DEFAULT 0, opened_count integer DEFAULT 0, clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0, revenue_generated numeric(10, 2) DEFAULT 0,
  is_ab_test boolean DEFAULT false, ab_variant text, ab_test_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promo_campaigns_business ON promo_campaigns(business_id);

CREATE TABLE IF NOT EXISTS campaign_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  customer_phone text NOT NULL, customer_email text, customer_id uuid,
  sent_at timestamptz, opened_at timestamptz, clicked_at timestamptz, converted_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL, order_value numeric(10, 2),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaign_engagement_campaign ON campaign_engagement(campaign_id);

CREATE TABLE IF NOT EXISTS smart_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text, items jsonb NOT NULL,
  total_value numeric(10, 2) NOT NULL, bundle_price numeric(10, 2) NOT NULL,
  savings numeric(10, 2) GENERATED ALWAYS AS (total_value - bundle_price) STORED,
  savings_percentage numeric(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_value > 0 THEN ((total_value - bundle_price) / total_value * 100)::numeric(5, 2) ELSE 0 END
  ) STORED,
  ai_generated boolean DEFAULT false, generation_reason text, confidence_score numeric(3, 2),
  cultural_event_id uuid REFERENCES calendar_events(id) ON DELETE SET NULL,
  recipe_suggestion text, times_suggested integer DEFAULT 0, times_purchased integer DEFAULT 0,
  conversion_rate numeric(5, 2), is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_smart_bundles_business ON smart_bundles(business_id);

CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text,
  segment_type text CHECK (segment_type IN ('behavioral', 'demographic', 'rfm', 'ai_discovered', 'custom')),
  criteria jsonb NOT NULL, ai_generated boolean DEFAULT false, ai_reasoning text,
  customer_count integer DEFAULT 0, avg_order_value numeric(10, 2), total_revenue numeric(10, 2),
  recommended_actions jsonb, is_active boolean DEFAULT true, last_updated timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  conversation_type text CHECK (conversation_type IN ('inventory_management', 'promotion_creation', 'analytics_query', 'general')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb, user_id uuid, session_id text,
  channel text DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'api')),
  actions_taken jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL, description text, cuisine text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time_minutes integer, serves integer, instructions text[], image_url text, cultural_context text,
  submitted_by_customer_id uuid, is_approved boolean DEFAULT false, is_featured boolean DEFAULT false,
  views integer DEFAULT 0, times_cooked integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity text, is_optional boolean DEFAULT false,
  PRIMARY KEY (recipe_id, product_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid, endpoint text,
  tokens_used integer, cost numeric(10, 4), response_time_ms integer,
  success boolean, error_message text, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  cache_key text PRIMARY KEY, response jsonb NOT NULL, created_at timestamptz DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_tracking_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_quantity integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_info jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_velocity numeric(10, 2);

ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS segment_ids uuid[];
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS lifetime_value numeric(10, 2);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS engagement_score integer;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_engagement_at timestamptz;

ALTER TABLE inventory_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_velocity ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_product_batches_updated_at ON product_batches;
CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_promo_campaigns_updated_at ON promo_campaigns;
CREATE TRIGGER update_promo_campaigns_updated_at BEFORE UPDATE ON promo_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_smart_bundles_updated_at ON smart_bundles;
CREATE TRIGGER update_smart_bundles_updated_at BEFORE UPDATE ON smart_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE '[20/23] AI inventory & promo tables OK'; END $$;


-- ============================================================================
-- MIGRATION 21: Business slug performance index (20260209000000)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_slug_active ON businesses(slug) WHERE is_active = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_unique') THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN RAISE NOTICE '[21/23] Business slug index OK'; END $$;


-- ============================================================================
-- MIGRATION 22: Safety net business_id + user_businesses (20260210)
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
UPDATE products SET business_id = 'bf642ec5-8990-4581-bc1c-e4171d472007' WHERE business_id IS NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
UPDATE orders SET business_id = 'bf642ec5-8990-4581-bc1c-e4171d472007' WHERE business_id IS NULL;

DO $$ BEGIN RAISE NOTICE '[22/23] Safety net business_id OK'; END $$;


-- ============================================================================
-- MIGRATION 23: Auto-create business on signup (20260210)
-- ============================================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'solo';

CREATE OR REPLACE FUNCTION public.handle_new_business_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _meta jsonb; _role text; _business_name text; _slug text; _base_slug text;
  _email text; _phone text; _business_type text; _plan text; _owner_name text;
  _business_id uuid; _slug_suffix int := 0; _slug_exists boolean;
BEGIN
  _meta := NEW.raw_user_meta_data;
  _role := _meta->>'role';
  IF _role IS NULL OR _role != 'business_owner' THEN RETURN NEW; END IF;
  _business_name := _meta->>'business_name';
  _slug := _meta->>'business_slug';
  _email := NEW.email;
  _phone := _meta->>'phone';
  _business_type := _meta->>'business_type';
  _plan := COALESCE(_meta->>'plan', 'solo');
  IF _business_name IS NULL OR _business_name = '' THEN RETURN NEW; END IF;
  IF _slug IS NULL OR _slug = '' THEN
    _slug := lower(regexp_replace(regexp_replace(_business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  _base_slug := _slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM businesses WHERE slug = _slug) INTO _slug_exists;
    EXIT WHEN NOT _slug_exists;
    _slug_suffix := _slug_suffix + 1;
    _slug := _base_slug || '-' || _slug_suffix;
  END LOOP;
  INSERT INTO businesses (slug, name, owner_email, phone, business_type, subscription_tier, is_active, trial_ends_at, created_at)
  VALUES (_slug, _business_name, _email, _phone, _business_type, _plan, true, now() + interval '30 days', now())
  RETURNING id INTO _business_id;
  INSERT INTO user_businesses (user_id, business_id, role) VALUES (NEW.id, _business_id, 'owner');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_business_owner failed: %', SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_business ON auth.users;
CREATE TRIGGER on_auth_user_created_business
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_owner();

DO $$ BEGIN RAISE NOTICE '[23/23] Auto-onboarding trigger OK'; END $$;


-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE tbl RECORD; tbl_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL 23 MIGRATIONS COMPLETE';
  RAISE NOTICE '========================================';
  FOR tbl IN SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name
  LOOP
    tbl_count := tbl_count + 1;
    RAISE NOTICE '  %', tbl.table_name;
  END LOOP;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total tables: %', tbl_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '  1. Run cultural events seed (migration 17) separately';
  RAISE NOTICE '  2. Link user: INSERT INTO user_businesses (user_id, business_id, role)';
  RAISE NOTICE '     SELECT id, ''bf642ec5-8990-4581-bc1c-e4171d472007'', ''owner''';
  RAISE NOTICE '     FROM auth.users WHERE email = ''YOUR_EMAIL'' ON CONFLICT DO NOTHING;';
END $$;
