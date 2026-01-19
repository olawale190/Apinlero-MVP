-- ==============================================================================
-- ISHA'S TREAT - AUTHENTICATION & TEST USER SETUP
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- PART 1: ENSURE AUTH IS PROPERLY CONFIGURED
-- ==============================================================================

-- Make sure business_users table exists
CREATE TABLE IF NOT EXISTS business_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,  -- Links to Supabase auth.users
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  phone_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own record
DROP POLICY IF EXISTS "Users can view own profile" ON business_users;
CREATE POLICY "Users can view own profile"
  ON business_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy for owners to view all users
DROP POLICY IF EXISTS "Owners can view all users" ON business_users;
CREATE POLICY "Owners can view all users"
  ON business_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

-- ==============================================================================
-- PART 2: FIX RLS POLICIES FOR TESTING
-- ==============================================================================

-- Allow authenticated users to read products
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- Allow authenticated users to read orders
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Allow anyone to create orders (for storefront)
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update orders
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

-- ==============================================================================
-- PART 3: INSERT TEST BUSINESS USER
-- ==============================================================================

-- This will be linked when the user signs up with this email
INSERT INTO business_users (email, full_name, role, phone_number, is_active)
VALUES (
  'isha@ishastreat.co.uk',
  'Isha Patel',
  'owner',
  '+44 7XXX XXXXXX',
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Also add a test staff member
INSERT INTO business_users (email, full_name, role, phone_number, is_active)
VALUES (
  'staff@ishastreat.co.uk',
  'Staff Member',
  'staff',
  '+44 7XXX XXXXXX',
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- ==============================================================================
-- PART 4: VERIFY SETUP
-- ==============================================================================

-- Show business users
SELECT email, full_name, role, is_active FROM business_users ORDER BY role;

-- Show product count
SELECT COUNT(*) as total_products FROM products WHERE is_active = true;

-- Show recent orders
SELECT COUNT(*) as total_orders FROM orders;

-- ==============================================================================
-- SETUP NOTES
-- ==============================================================================
--
-- After running this script:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create a new user with email: isha@ishastreat.co.uk
-- 3. Set a password (e.g., IshaTest123!)
-- 4. The user can now log in to the dashboard
--
-- Alternative: Use the sign-up flow in the app with this email
-- ==============================================================================
