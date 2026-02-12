-- Migration: Add JWT Business Claims Support
-- Purpose: Enable business_id in JWT tokens for multi-tenant security
-- Date: 2026-02-04
-- Author: Claude Code Security Audit

-- ============================================================================
-- STEP 1: Create user_businesses junction table
-- ============================================================================
-- This table links users (from auth.users) to businesses they can access
-- Supports: Multiple users per business, multiple businesses per user

CREATE TABLE IF NOT EXISTS user_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Role within the business
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),

  -- Permissions (can be extended)
  permissions jsonb DEFAULT '{
    "products": ["read", "write", "delete"],
    "orders": ["read", "write"],
    "analytics": ["read"],
    "settings": ["read"]
  }'::jsonb,

  -- Status
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  UNIQUE(user_id, business_id)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_business_id ON user_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_active ON user_businesses(is_active) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE user_businesses IS 'Junction table linking users to businesses they can access';

-- ============================================================================
-- STEP 2: Add owner_email to businesses table for backward compatibility
-- ============================================================================
-- This allows us to auto-assign businesses to users based on email

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email text;
CREATE INDEX IF NOT EXISTS idx_businesses_owner_email ON businesses(owner_email);

-- ============================================================================
-- STEP 3: Add business_slug to businesses table for subdomain routing
-- ============================================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE is_active = true;

-- Add constraint: slug must be lowercase, alphanumeric with hyphens
ALTER TABLE businesses ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Update existing businesses with slugs (if any exist without slugs)
UPDATE businesses
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after migration
ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;

-- ============================================================================
-- STEP 4: Create function to get user's active business_id
-- ============================================================================
-- This function will be called by the JWT claims Edge Function
-- Returns the user's active business_id (or first available business)

CREATE OR REPLACE FUNCTION get_user_business_id(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_uuid uuid;
BEGIN
  -- Try to get the user's primary business (most recent joined)
  SELECT ub.business_id INTO business_uuid
  FROM user_businesses ub
  INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid
    AND ub.is_active = true
    AND b.is_active = true
  ORDER BY ub.joined_at DESC
  LIMIT 1;

  -- If user has no business via junction table, try owner_email fallback
  IF business_uuid IS NULL THEN
    SELECT b.id INTO business_uuid
    FROM businesses b
    INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid
      AND b.is_active = true
    LIMIT 1;
  END IF;

  RETURN business_uuid;
END;
$$;

COMMENT ON FUNCTION get_user_business_id IS 'Returns the active business_id for a given user';

-- ============================================================================
-- STEP 5: Create function to get all user's business IDs
-- ============================================================================
-- Returns array of all business_ids the user has access to

CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_uuids uuid[];
BEGIN
  -- Get all businesses the user has access to
  SELECT ARRAY_AGG(DISTINCT ub.business_id)
  INTO business_uuids
  FROM user_businesses ub
  INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid
    AND ub.is_active = true
    AND b.is_active = true;

  -- If none found via junction table, try owner_email fallback
  IF business_uuids IS NULL OR array_length(business_uuids, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT b.id)
    INTO business_uuids
    FROM businesses b
    INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid
      AND b.is_active = true;
  END IF;

  RETURN COALESCE(business_uuids, ARRAY[]::uuid[]);
END;
$$;

COMMENT ON FUNCTION get_user_business_ids IS 'Returns array of all business_ids a user has access to';

-- ============================================================================
-- STEP 6: Seed user_businesses for existing data
-- ============================================================================
-- Auto-create user_businesses records for existing owner_email relationships

INSERT INTO user_businesses (user_id, business_id, role)
SELECT DISTINCT
  u.id as user_id,
  b.id as business_id,
  'owner' as role
FROM businesses b
INNER JOIN auth.users u ON u.email = b.owner_email
WHERE b.owner_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_businesses ub
    WHERE ub.user_id = u.id AND ub.business_id = b.id
  )
ON CONFLICT (user_id, business_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Create RLS policies for user_businesses table
-- ============================================================================

ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own business associations
CREATE POLICY "Users can view their own business associations"
ON user_businesses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Business owners can view all users in their business
CREATE POLICY "Business owners can view all users in their business"
ON user_businesses
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Policy: Business owners can insert new users
CREATE POLICY "Business owners can invite users"
ON user_businesses
FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Policy: Business owners can update user roles
CREATE POLICY "Business owners can update user roles"
ON user_businesses
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Policy: Business owners can remove users
CREATE POLICY "Business owners can remove users"
ON user_businesses
FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ============================================================================
-- STEP 8: Update RLS policies for products table
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view products from their business" ON products;
DROP POLICY IF EXISTS "Users can insert products to their business" ON products;
DROP POLICY IF EXISTS "Users can update products in their business" ON products;
DROP POLICY IF EXISTS "Users can delete products in their business" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access (for storefront)
CREATE POLICY "Public can view active products"
ON products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Authenticated users can view products from their businesses
CREATE POLICY "Users can view products from their businesses"
ON products
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Users can insert products to their businesses
CREATE POLICY "Users can insert products to their businesses"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'manager')
  )
);

-- Users can update products in their businesses
CREATE POLICY "Users can update products in their businesses"
ON products
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'manager')
  )
);

-- Users can soft-delete products in their businesses
CREATE POLICY "Users can delete products in their businesses"
ON products
FOR DELETE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- STEP 9: Update RLS policies for orders table
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view orders from their business" ON orders;
DROP POLICY IF EXISTS "Users can insert orders to their business" ON orders;
DROP POLICY IF EXISTS "Users can update orders in their business" ON orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can create orders (for storefront)
CREATE POLICY "Public can create orders"
ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view orders from their businesses
CREATE POLICY "Users can view orders from their businesses"
ON orders
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Users can update orders in their businesses
CREATE POLICY "Users can update orders in their businesses"
ON orders
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'manager')
  )
);

-- ============================================================================
-- STEP 10: Update RLS policies for categories and sub_categories
-- ============================================================================

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories"
ON categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Users can manage categories in their businesses"
ON categories
FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'manager')
  )
);

-- Sub-categories
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sub-categories"
ON sub_categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Users can manage sub-categories in their businesses"
ON sub_categories
FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT business_id FROM user_businesses
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'manager')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration worked:

-- 1. Check user_businesses table exists
-- SELECT * FROM user_businesses LIMIT 5;

-- 2. Test get_user_business_id function
-- SELECT get_user_business_id(auth.uid());

-- 3. Test get_user_business_ids function
-- SELECT get_user_business_ids(auth.uid());

-- 4. Verify RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('products', 'orders', 'user_businesses');

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To rollback this migration, run:
-- DROP TABLE IF EXISTS user_businesses CASCADE;
-- DROP FUNCTION IF EXISTS get_user_business_id(uuid);
-- DROP FUNCTION IF EXISTS get_user_business_ids(uuid);
-- ALTER TABLE businesses DROP COLUMN IF EXISTS slug;
-- ALTER TABLE businesses DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE businesses DROP COLUMN IF EXISTS owner_email;
