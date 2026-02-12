-- ============================================================
-- Migration: Add business_id to products & orders + create user_businesses
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Add business_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- 2. Set all existing products to the current business (Isha's Treat)
UPDATE products SET business_id = 'bf642ec5-8990-4581-bc1c-e4171d472007' WHERE business_id IS NULL;

-- 3. Make business_id NOT NULL going forward
ALTER TABLE products ALTER COLUMN business_id SET NOT NULL;

-- 4. Add index for business_id lookups on products
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);

-- 5. Add business_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- 6. Set all existing orders to the current business (Isha's Treat)
UPDATE orders SET business_id = 'bf642ec5-8990-4581-bc1c-e4171d472007' WHERE business_id IS NULL;

-- 7. Make business_id NOT NULL going forward
ALTER TABLE orders ALTER COLUMN business_id SET NOT NULL;

-- 8. Add index for business_id lookups on orders
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);

-- 9. Create user_businesses table (maps auth users to businesses)
CREATE TABLE IF NOT EXISTS user_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- 10. Add index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);

-- 11. Enable RLS on user_businesses
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

-- 12. RLS policy: users can read their own business mappings
CREATE POLICY "Users can read own business mappings"
  ON user_businesses FOR SELECT
  USING (auth.uid() = user_id);

-- 13. RLS policy: allow insert for authenticated users (for signup flow)
CREATE POLICY "Authenticated users can insert own mappings"
  ON user_businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- IMPORTANT: After running this migration, you need to link your
-- authenticated user to the business. Run this query, replacing
-- YOUR_USER_ID with your actual auth user ID:
--
-- INSERT INTO user_businesses (user_id, business_id, role)
-- SELECT id, 'bf642ec5-8990-4581-bc1c-e4171d472007', 'owner'
-- FROM auth.users
-- WHERE email = 'YOUR_EMAIL_HERE';
--
-- To find your user ID:
-- SELECT id, email FROM auth.users;
-- ============================================================
