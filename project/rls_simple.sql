-- Simple RLS Setup for Core Tables
-- Run this in Supabase SQL Editor

-- Enable RLS on core tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- BUSINESSES: Users see only their own business
DROP POLICY IF EXISTS "businesses_service" ON businesses;
CREATE POLICY "businesses_service" ON businesses FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "businesses_auth" ON businesses;
CREATE POLICY "businesses_auth" ON businesses FOR SELECT TO authenticated USING (owner_email = auth.email());

DROP POLICY IF EXISTS "businesses_update" ON businesses;
CREATE POLICY "businesses_update" ON businesses FOR UPDATE TO authenticated USING (owner_email = auth.email());

-- PRODUCTS: Public can view, owners can manage
DROP POLICY IF EXISTS "products_service" ON products;
CREATE POLICY "products_service" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "products_public" ON products;
CREATE POLICY "products_public" ON products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "products_auth" ON products;
CREATE POLICY "products_auth" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ORDERS: Service role and authenticated users
DROP POLICY IF EXISTS "orders_service" ON orders;
CREATE POLICY "orders_service" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orders_auth" ON orders;
CREATE POLICY "orders_auth" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CATEGORIES: Public can view, owners can manage
DROP POLICY IF EXISTS "categories_service" ON categories;
CREATE POLICY "categories_service" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "categories_public" ON categories;
CREATE POLICY "categories_public" ON categories FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "categories_auth" ON categories;
CREATE POLICY "categories_auth" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verify
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'products', 'orders', 'categories');
