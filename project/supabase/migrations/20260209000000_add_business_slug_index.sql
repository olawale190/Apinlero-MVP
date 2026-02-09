-- Migration: Add performance index for business slug lookups
-- Created: 2026-02-09
-- Purpose: Optimize business resolution for multi-tenant subdomain routing
-- This index dramatically speeds up the getBusinessBySlug() query

-- Add index on slug column for fast subdomain lookups
-- The WHERE clause makes this a partial index (only active businesses)
CREATE INDEX IF NOT EXISTS idx_businesses_slug_active
ON businesses(slug)
WHERE is_active = true;

-- Also ensure slug is unique (should already be, but enforce it)
ALTER TABLE businesses
ADD CONSTRAINT businesses_slug_unique
UNIQUE (slug);

-- Add comment for documentation
COMMENT ON INDEX idx_businesses_slug_active IS
'Optimizes business lookup by subdomain slug for multi-tenant routing. Critical for storefront performance.';
