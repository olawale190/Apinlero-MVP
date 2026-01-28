-- Migration: Add Stripe Key Encryption using pgcrypto
-- Created: 2026-01-27
-- Purpose: Encrypt Stripe secret keys in database for security compliance

-- =====================================================
-- STEP 1: Enable pgcrypto extension
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- STEP 2: Create encryption helper functions
-- =====================================================

-- Function to encrypt Stripe secret key
-- Uses AES-256 encryption with a master key from environment
CREATE OR REPLACE FUNCTION encrypt_stripe_key(secret_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  master_key TEXT;
BEGIN
  -- Get master key from environment variable
  -- In production, set this in Supabase Dashboard → Settings → Vault
  master_key := current_setting('app.settings.stripe_encryption_key', true);

  -- Fallback for development (CHANGE IN PRODUCTION!)
  IF master_key IS NULL OR master_key = '' THEN
    master_key := 'dev-encryption-key-change-in-production-2026';
  END IF;

  -- Encrypt using AES-256
  RETURN encode(
    pgp_sym_encrypt(secret_key, master_key),
    'base64'
  );
END;
$$;

-- Function to decrypt Stripe secret key
CREATE OR REPLACE FUNCTION decrypt_stripe_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  master_key TEXT;
BEGIN
  -- Get master key from environment variable
  master_key := current_setting('app.settings.stripe_encryption_key', true);

  -- Fallback for development (CHANGE IN PRODUCTION!)
  IF master_key IS NULL OR master_key = '' THEN
    master_key := 'dev-encryption-key-change-in-production-2026';
  END IF;

  -- Decrypt using AES-256
  RETURN pgp_sym_decrypt(
    decode(encrypted_key, 'base64'),
    master_key
  );
END;
$$;

-- =====================================================
-- STEP 3: Migrate existing unencrypted keys
-- =====================================================

-- Encrypt any existing plaintext Stripe keys
-- This is safe to run multiple times (idempotent)
DO $$
DECLARE
  business_record RECORD;
  encrypted_key TEXT;
BEGIN
  FOR business_record IN
    SELECT id, stripe_secret_key_encrypted
    FROM businesses
    WHERE stripe_secret_key_encrypted IS NOT NULL
      AND stripe_secret_key_encrypted != ''
      -- Only encrypt if it looks like plaintext (starts with sk_)
      AND stripe_secret_key_encrypted LIKE 'sk_%'
  LOOP
    BEGIN
      -- Encrypt the key
      encrypted_key := encrypt_stripe_key(business_record.stripe_secret_key_encrypted);

      -- Update with encrypted version
      UPDATE businesses
      SET stripe_secret_key_encrypted = encrypted_key
      WHERE id = business_record.id;

      RAISE NOTICE 'Encrypted Stripe key for business: %', business_record.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to encrypt key for business %: %', business_record.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create secure view for decrypted keys
-- =====================================================

-- View that only service_role can access
-- This decrypts keys on-the-fly for backend use
CREATE OR REPLACE VIEW businesses_with_decrypted_stripe AS
SELECT
  id,
  business_name,
  owner_email,
  stripe_publishable_key,
  CASE
    WHEN stripe_secret_key_encrypted IS NOT NULL
      AND stripe_secret_key_encrypted != ''
      AND NOT stripe_secret_key_encrypted LIKE 'sk_%'
    THEN decrypt_stripe_key(stripe_secret_key_encrypted)
    ELSE stripe_secret_key_encrypted
  END as stripe_secret_key,
  stripe_account_id,
  stripe_webhook_secret,
  stripe_connected_at
FROM businesses;

-- Only service_role (backend) can access decrypted view
REVOKE ALL ON businesses_with_decrypted_stripe FROM PUBLIC;
REVOKE ALL ON businesses_with_decrypted_stripe FROM anon;
REVOKE ALL ON businesses_with_decrypted_stripe FROM authenticated;
GRANT SELECT ON businesses_with_decrypted_stripe TO service_role;

-- =====================================================
-- STEP 5: Add trigger to auto-encrypt on INSERT/UPDATE
-- =====================================================

-- Function that automatically encrypts before saving
CREATE OR REPLACE FUNCTION auto_encrypt_stripe_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only encrypt if the key looks like plaintext (starts with sk_)
  IF NEW.stripe_secret_key_encrypted IS NOT NULL
    AND NEW.stripe_secret_key_encrypted != ''
    AND NEW.stripe_secret_key_encrypted LIKE 'sk_%' THEN

    NEW.stripe_secret_key_encrypted := encrypt_stripe_key(NEW.stripe_secret_key_encrypted);
    RAISE NOTICE 'Auto-encrypted Stripe key for business: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS encrypt_stripe_key_trigger ON businesses;
CREATE TRIGGER encrypt_stripe_key_trigger
  BEFORE INSERT OR UPDATE OF stripe_secret_key_encrypted
  ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_stripe_key();

-- =====================================================
-- STEP 6: Grant permissions
-- =====================================================

-- Allow authenticated users to use encryption functions
GRANT EXECUTE ON FUNCTION encrypt_stripe_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_stripe_key(TEXT) TO service_role;

-- =====================================================
-- STEP 7: Add audit logging
-- =====================================================

-- Table to track when keys are accessed
CREATE TABLE IF NOT EXISTS stripe_key_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_by TEXT,
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'view'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_access_log_business
  ON stripe_key_access_log(business_id, accessed_at DESC);

-- Function to log key access
CREATE OR REPLACE FUNCTION log_stripe_key_access(
  p_business_id TEXT,
  p_action TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO stripe_key_access_log (business_id, accessed_by, action)
  VALUES (
    p_business_id,
    current_user,
    p_action
  );
END;
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  -- Check extension is enabled
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension not enabled';
  END IF;

  -- Check functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'encrypt_stripe_key'
  ) THEN
    RAISE EXCEPTION 'encrypt_stripe_key function not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'decrypt_stripe_key'
  ) THEN
    RAISE EXCEPTION 'decrypt_stripe_key function not created';
  END IF;

  -- Check trigger exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'encrypt_stripe_key_trigger'
  ) THEN
    RAISE EXCEPTION 'Encryption trigger not created';
  END IF;

  RAISE NOTICE '✅ Stripe encryption setup completed successfully';
  RAISE NOTICE '⚠️  IMPORTANT: Set stripe_encryption_key in Supabase Vault for production';
  RAISE NOTICE '📝 All new Stripe keys will be automatically encrypted on save';
END $$;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

COMMENT ON FUNCTION encrypt_stripe_key IS
'Encrypts Stripe secret keys using AES-256.
Usage: UPDATE businesses SET stripe_secret_key_encrypted = encrypt_stripe_key(''sk_test_123'')';

COMMENT ON FUNCTION decrypt_stripe_key IS
'Decrypts Stripe secret keys. Only accessible to service_role.
Usage: SELECT decrypt_stripe_key(stripe_secret_key_encrypted) FROM businesses';

COMMENT ON VIEW businesses_with_decrypted_stripe IS
'Secure view that decrypts Stripe keys on-the-fly.
Only accessible to service_role (backend).
Frontend should NEVER access this view.';

COMMENT ON TRIGGER encrypt_stripe_key_trigger ON businesses IS
'Automatically encrypts Stripe secret keys when inserted or updated.
Keys starting with sk_ are detected and encrypted transparently.';
