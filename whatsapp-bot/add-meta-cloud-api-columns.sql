-- ============================================================================
-- ONE PASTE — lets the WhatsApp bot receive messages from Meta Cloud API
-- Supabase SQL Editor → New query → paste everything → Run.
-- Idempotent: safe to run more than once.
-- ============================================================================
-- Twilio routes an incoming message to a vendor by the number it was sent TO.
-- Meta never sends that number — it sends an opaque `phone_number_id` from the
-- WhatsApp Business Account. So whatsapp_configs needs somewhere to store it,
-- otherwise every inbound Meta message is dropped with "no business mapped".
--
-- Run this BEFORE pointing Meta's webhook at the bot.
-- ============================================================================

-- Part 1: the columns
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS meta_waba_id         TEXT;
ALTER TABLE whatsapp_configs ADD COLUMN IF NOT EXISTS meta_access_token    TEXT;

-- One vendor per phone_number_id — a duplicate would route customers to the
-- wrong shop, so let the database refuse it outright.
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_configs_meta_phone_number_id_key
  ON whatsapp_configs (meta_phone_number_id)
  WHERE meta_phone_number_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Part 2: point Isha's Treat at her Meta number
-- ----------------------------------------------------------------------------
-- Replace PASTE_PHONE_NUMBER_ID_HERE with the "Phone number ID" shown in
-- Meta for Developers → WhatsApp → API Setup. It is a long number like
-- 123456789012345 — NOT the phone number itself.
--
-- Leave meta_access_token NULL to use the bot's META_ACCESS_TOKEN env var for
-- every vendor (simplest while there is one shop). Set it per-row later, when
-- each vendor has their own WhatsApp Business Account.
--
-- ⚠️ This UPDATE is commented out on purpose — fill the ID in first, then
--    uncomment and run it. Running it with the placeholder would store junk.

-- UPDATE whatsapp_configs
--    SET meta_phone_number_id = 'PASTE_PHONE_NUMBER_ID_HERE',
--        provider             = 'meta'
--  WHERE business_id = 'bf642ec5-8990-4581-bc1c-e4171d472007'   -- Isha's Treat
--    AND is_active = true;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
-- Expect the three new columns.
SELECT 'meta-columns' AS check, column_name
  FROM information_schema.columns
 WHERE table_name = 'whatsapp_configs'
   AND column_name IN ('meta_phone_number_id', 'meta_waba_id', 'meta_access_token')
 ORDER BY column_name;

-- After running the UPDATE, this should show Isha's row with the ID set.
SELECT 'vendor-routing' AS check,
       business_id,
       business_name,
       provider,
       twilio_phone_number,
       meta_phone_number_id,
       (meta_access_token IS NOT NULL) AS has_own_token
  FROM whatsapp_configs
 WHERE is_active = true;
