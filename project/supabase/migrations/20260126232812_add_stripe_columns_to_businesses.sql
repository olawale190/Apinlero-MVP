-- ============================================================================
-- ADD STRIPE PAYMENT COLUMNS TO BUSINESSES TABLE
-- Migration for Option A: Per-Business Stripe Accounts
-- See: STRIPE_SETUP_GUIDE.md
-- ============================================================================

-- Add Stripe API key columns to store per-business credentials
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
ADD COLUMN IF NOT EXISTS stripe_secret_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ;

-- Add index for faster lookups by Stripe account ID
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account
ON businesses(stripe_account_id);

-- Add index for finding businesses with Stripe connected
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_connected
ON businesses(stripe_connected_at) WHERE stripe_connected_at IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN businesses.stripe_publishable_key IS 'Stripe publishable key (pk_test_... or pk_live_...) - safe to expose in frontend';
COMMENT ON COLUMN businesses.stripe_secret_key_encrypted IS 'Encrypted Stripe secret key (sk_test_... or sk_live_...) - must remain secure';
COMMENT ON COLUMN businesses.stripe_account_id IS 'Stripe account ID (acct_...) for reference';
COMMENT ON COLUMN businesses.stripe_webhook_secret IS 'Stripe webhook signing secret (whsec_...) for verifying webhook authenticity';
COMMENT ON COLUMN businesses.stripe_connected_at IS 'Timestamp when Stripe was first connected';

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'businesses'
  AND column_name LIKE 'stripe%'
ORDER BY ordinal_position;

-- Show current businesses and their Stripe connection status
SELECT
    id,
    name,
    slug,
    CASE
        WHEN stripe_publishable_key IS NOT NULL THEN 'Connected'
        ELSE 'Not Connected'
    END as stripe_status,
    stripe_connected_at
FROM businesses
ORDER BY created_at DESC;
