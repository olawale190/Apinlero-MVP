-- Add bulk_pricing column to products table
-- This stores an array of pricing tiers as JSONB

ALTER TABLE products
ADD COLUMN IF NOT EXISTS bulk_pricing JSONB DEFAULT NULL;

-- Example of bulk pricing structure:
-- [
--   {"minQty": 1, "maxQty": 10, "price": 5.00},
--   {"minQty": 11, "maxQty": 50, "price": 4.50},
--   {"minQty": 51, "maxQty": null, "price": 4.00}
-- ]

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_bulk_pricing ON products USING GIN (bulk_pricing);

-- Comment on column
COMMENT ON COLUMN products.bulk_pricing IS 'JSON array of bulk pricing tiers with minQty, maxQty, and price';
