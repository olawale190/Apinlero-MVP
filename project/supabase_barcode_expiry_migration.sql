-- Add barcode and expiry tracking to products table

-- Add barcode column for standard product barcodes (EAN, UPC, etc.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) DEFAULT NULL;

-- Add expiry date column
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE DEFAULT NULL;

-- Add batch/lot number for tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50) DEFAULT NULL;

-- Create index for fast barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Create index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);

-- Comments
COMMENT ON COLUMN products.barcode IS 'Standard product barcode (EAN, UPC, Code128, etc.)';
COMMENT ON COLUMN products.expiry_date IS 'Product expiry/best before date';
COMMENT ON COLUMN products.batch_number IS 'Batch or lot number for traceability';
