/*
  # Fix Products Table RLS Policy

  This fixes the RLS policy issue preventing product inserts.
  The error "new row violates row-level security policy" means the INSERT policy
  isn't working correctly for anonymous users.

  This script:
  1. Drops existing policies that might be misconfigured
  2. Recreates permissive policies for all operations
  3. Ensures anonymous (anon) role can insert/update/delete products
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Recreate permissive policies for all operations
-- These policies allow both authenticated AND anonymous users

CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert access for all users"
ON products FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON products FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON products FOR DELETE
TO public
USING (true);

-- Verify RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Products table RLS policies fixed - all operations now permitted';
END $$;
