-- ============================================================================
-- SUPABASE STORAGE POLICIES FOR APINLERO
-- Run this in Supabase Dashboard > SQL Editor
-- This fixes the "Permission denied" error when uploading product images
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure the apinlero-products bucket exists and is PUBLIC
-- ============================================================================

-- Create the bucket if it doesn't exist, or update it to be public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apinlero-products',
  'apinlero-products',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================================================
-- STEP 2: Create RLS policies for storage.objects
-- These allow authenticated users to upload/manage product images
-- ============================================================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- 1. Allow ANYONE to READ from the public apinlero-products bucket
-- This is required for product images to display on the storefront
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'apinlero-products');

-- 2. Allow authenticated users to UPLOAD to apinlero-products
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apinlero-products');

-- 3. Allow authenticated users to UPDATE files in apinlero-products
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'apinlero-products');

-- 4. Allow authenticated users to DELETE files in apinlero-products
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'apinlero-products');

-- ============================================================================
-- STEP 3: Create private buckets for other media (optional)
-- ============================================================================

-- Create apinlero-media bucket (private - for WhatsApp media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('apinlero-media', 'apinlero-media', false)
ON CONFLICT (id) DO NOTHING;

-- Create apinlero-documents bucket (private - for receipts/invoices)
INSERT INTO storage.buckets (id, name, public)
VALUES ('apinlero-documents', 'apinlero-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for private buckets (authenticated users only)
DROP POLICY IF EXISTS "Authenticated can upload to private buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read private buckets" ON storage.objects;

CREATE POLICY "Authenticated can upload to private buckets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('apinlero-media', 'apinlero-documents'));

CREATE POLICY "Authenticated can read private buckets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('apinlero-media', 'apinlero-documents'));

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after the above to confirm everything worked
-- ============================================================================

-- Check that the bucket exists and is public:
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'apinlero-products';

-- Check that policies exist:
-- SELECT policyname, tablename, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- DONE! After running this:
-- 1. Go to Inventory Manager in the dashboard
-- 2. Click the Database icon to run Storage Diagnostics
-- 3. All checks should show green checkmarks
-- 4. Try uploading a product image - it should work now
-- ============================================================================
