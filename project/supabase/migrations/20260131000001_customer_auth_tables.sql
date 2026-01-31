-- ==============================================================================
-- CUSTOMER AUTHENTICATION SYSTEM - DATABASE TABLES
-- Run this in Supabase Dashboard > SQL Editor
-- ==============================================================================

-- ==============================================================================
-- 1. CUSTOMER PROFILES TABLE
-- Links to Supabase auth.users for customer authentication
-- ==============================================================================
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_business_id ON customer_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);

-- ==============================================================================
-- 2. CUSTOMER ADDRESSES TABLE
-- Saved delivery addresses for customers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Other')),
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'UK',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_business_id ON customer_addresses(business_id);

-- ==============================================================================
-- 3. WISHLIST TABLE
-- Customer product wishlist
-- ==============================================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_business_id ON wishlist(business_id);

-- ==============================================================================
-- 4. RECENTLY VIEWED TABLE
-- Track products customers have viewed
-- ==============================================================================
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recently_viewed_customer_id ON recently_viewed(customer_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product_id ON recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- CUSTOMER PROFILES POLICIES
DROP POLICY IF EXISTS "Customers can view own profile" ON customer_profiles;
CREATE POLICY "Customers can view own profile"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
CREATE POLICY "Customers can insert own profile"
  ON customer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;
CREATE POLICY "Customers can update own profile"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- CUSTOMER ADDRESSES POLICIES
DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;
CREATE POLICY "Customers can view own addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
CREATE POLICY "Customers can insert own addresses"
  ON customer_addresses FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
CREATE POLICY "Customers can update own addresses"
  ON customer_addresses FOR UPDATE
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;
CREATE POLICY "Customers can delete own addresses"
  ON customer_addresses FOR DELETE
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

-- WISHLIST POLICIES
DROP POLICY IF EXISTS "Customers can view own wishlist" ON wishlist;
CREATE POLICY "Customers can view own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can insert to wishlist" ON wishlist;
CREATE POLICY "Customers can insert to wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can delete from wishlist" ON wishlist;
CREATE POLICY "Customers can delete from wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

-- RECENTLY VIEWED POLICIES
DROP POLICY IF EXISTS "Customers can view own recently viewed" ON recently_viewed;
CREATE POLICY "Customers can view own recently viewed"
  ON recently_viewed FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can insert recently viewed" ON recently_viewed;
CREATE POLICY "Customers can insert recently viewed"
  ON recently_viewed FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can update recently viewed" ON recently_viewed;
CREATE POLICY "Customers can update recently viewed"
  ON recently_viewed FOR UPDATE
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Customers can delete recently viewed" ON recently_viewed;
CREATE POLICY "Customers can delete recently viewed"
  ON recently_viewed FOR DELETE
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM customer_profiles WHERE user_id = auth.uid()
  ));

-- ==============================================================================
-- 6. UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================
-- Uncomment to verify table creation:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('customer_profiles', 'customer_addresses', 'wishlist', 'recently_viewed');
