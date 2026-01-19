-- ==============================================================================
-- Àpínlẹ̀rọ Production Row Level Security (RLS) Policies
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor to secure your database
-- This prevents unauthorized access and SQL injection attacks
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- DROP EXISTING POLICIES (Clean slate)
-- ==============================================================================

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;

-- Orders policies
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

-- Customers policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can create customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;

-- Payments policies
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

-- ==============================================================================
-- PRODUCTS TABLE POLICIES
-- ==============================================================================

-- Public: Anyone can view active products (for storefront)
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true);

-- Admin: Only authenticated users can insert/update/delete products
CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- ORDERS TABLE POLICIES
-- ==============================================================================

-- Public: Anyone can create orders (customers placing orders)
CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
WITH CHECK (
  -- Validate required fields
  customer_name IS NOT NULL AND
  LENGTH(customer_name) >= 2 AND
  LENGTH(customer_name) <= 100 AND
  total >= 0 AND
  total <= 100000 AND
  delivery_fee >= 0 AND
  delivery_fee <= 100
);

-- Admin: Only authenticated users can view all orders
CREATE POLICY "Authenticated users can view all orders"
ON orders FOR SELECT
TO authenticated
USING (true);

-- Admin: Only authenticated users can update orders
CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Only allow valid status updates
  status IN ('Pending', 'Confirmed', 'Delivered', 'Cancelled')
);

-- Admin: Only authenticated users can delete orders
CREATE POLICY "Authenticated users can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- CUSTOMERS TABLE POLICIES
-- ==============================================================================

-- Public: Anyone can create a customer record (during checkout)
CREATE POLICY "Anyone can create customers"
ON customers FOR INSERT
WITH CHECK (
  name IS NOT NULL AND
  LENGTH(name) >= 2 AND
  LENGTH(name) <= 100
);

-- Admin: Only authenticated users can view customers
CREATE POLICY "Authenticated users can view customers"
ON customers FOR SELECT
TO authenticated
USING (true);

-- Admin: Only authenticated users can update customers
CREATE POLICY "Authenticated users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- PAYMENTS TABLE POLICIES
-- ==============================================================================

-- Admin: Only authenticated users can view payments
CREATE POLICY "Authenticated users can view payments"
ON payments FOR SELECT
TO authenticated
USING (true);

-- Service role only: Payments should only be created via backend (Stripe webhook)
CREATE POLICY "Service role can insert payments"
ON payments FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update payments"
ON payments FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ==============================================================================

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log (only service role can access)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit log"
ON audit_log
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- VALIDATION FUNCTIONS
-- ==============================================================================

-- Function to validate UK phone numbers
CREATE OR REPLACE FUNCTION is_valid_uk_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN TRUE; -- Phone is optional
  END IF;
  RETURN phone ~ '^\+?44\s?\d{4}\s?\d{6}$|^0\d{4}\s?\d{6}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN TRUE; -- Email is optional
  END IF;
  RETURN email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND LENGTH(email) <= 255;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- ADD CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ==============================================================================

-- Products constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_name_length;
ALTER TABLE products ADD CONSTRAINT chk_product_name_length
  CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_price;
ALTER TABLE products ADD CONSTRAINT chk_product_price
  CHECK (price >= 0 AND price <= 10000);

ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_stock_quantity;
ALTER TABLE products ADD CONSTRAINT chk_stock_quantity
  CHECK (stock_quantity >= 0 AND stock_quantity <= 100000);

-- Orders constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_customer_name;
ALTER TABLE orders ADD CONSTRAINT chk_order_customer_name
  CHECK (LENGTH(customer_name) >= 2 AND LENGTH(customer_name) <= 100);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_total;
ALTER TABLE orders ADD CONSTRAINT chk_order_total
  CHECK (total >= 0 AND total <= 100000);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_delivery_fee;
ALTER TABLE orders ADD CONSTRAINT chk_order_delivery_fee
  CHECK (delivery_fee >= 0 AND delivery_fee <= 100);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_status;
ALTER TABLE orders ADD CONSTRAINT chk_order_status
  CHECK (status IN ('Pending', 'Confirmed', 'Delivered', 'Cancelled'));

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(phone_number);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);

-- ==============================================================================
-- GRANT PERMISSIONS
-- ==============================================================================

-- Revoke all permissions from public and grant specific ones
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant specific permissions
GRANT SELECT ON products TO anon;
GRANT INSERT ON orders TO anon;
GRANT INSERT ON customers TO anon;

GRANT ALL ON products TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT SELECT ON payments TO authenticated;

-- Service role has full access (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Run these to verify RLS is properly configured:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Àpínlẹ̀rọ Production RLS policies applied successfully!';
  RAISE NOTICE '🔒 Row Level Security is now enabled on all tables';
  RAISE NOTICE '📊 Check constraints and indexes have been created';
END $$;
