-- Migration: Add business_id to core tables for multi-tenancy
-- Created: 2026-01-27
-- Purpose: Enable SaaS multi-tenancy by adding business_id foreign keys to products, customers, and orders

-- =====================================================
-- STEP 1: Add business_id columns (nullable initially)
-- =====================================================

-- Add business_id to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Add business_id to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- Add business_id to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 2: Update unique constraints for multi-tenancy
-- =====================================================

-- Drop existing phone unique constraint on customers
-- Phone numbers should be unique per business, not globally
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_unique;

-- Add composite unique constraint: (business_id, phone)
-- This allows same phone number across different businesses
ALTER TABLE customers ADD CONSTRAINT customers_business_phone_unique
  UNIQUE (business_id, phone);

-- =====================================================
-- STEP 3: Add indexes for query performance
-- =====================================================

-- Index for filtering products by business
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);

-- Index for filtering customers by business
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);

-- Index for filtering orders by business
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);

-- Composite index for common query pattern: business_id + is_active
CREATE INDEX IF NOT EXISTS idx_products_business_active ON products(business_id, is_active);

-- =====================================================
-- NOTES
-- =====================================================
-- After running this migration, you MUST:
-- 1. Run the backfill migration to set business_id for existing data
-- 2. Make business_id NOT NULL after backfill
-- 3. Enable RLS policies on these tables
-- 4. Update application code to filter by business_id
