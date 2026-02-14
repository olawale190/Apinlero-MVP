-- ============================================================
-- Fix Currency: Change from GBP (£) to NGN (₦)
-- Date: 2026-02-12
-- Purpose: Update currency display from Pounds to Nigerian Naira
-- ============================================================

-- Update existing businesses to use NGN currency
UPDATE businesses
SET
  currency = 'NGN',
  timezone = 'Africa/Lagos'
WHERE currency = 'GBP' OR currency IS NULL;

-- Set default currency for new businesses to NGN
ALTER TABLE businesses
  ALTER COLUMN currency SET DEFAULT 'NGN';

-- Set default timezone for new businesses to Africa/Lagos
ALTER TABLE businesses
  ALTER COLUMN timezone SET DEFAULT 'Africa/Lagos';

-- Verify the update
DO $$
DECLARE
  business_count INTEGER;
  ngn_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO business_count FROM businesses;
  SELECT COUNT(*) INTO ngn_count FROM businesses WHERE currency = 'NGN';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Currency Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total businesses: %', business_count;
  RAISE NOTICE 'Businesses with NGN currency: %', ngn_count;
  RAISE NOTICE '========================================';
END $$;
