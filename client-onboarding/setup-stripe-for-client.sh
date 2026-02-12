#!/bin/bash

# ============================================================================
# Setup Stripe Keys for a Client Business
# ============================================================================
# This script helps you add a client's Stripe API keys to their business
# in the Apinlero database.
#
# Usage:
#   ./setup-stripe-for-client.sh
#
# The script will prompt you for:
#   - Business slug (e.g., "ishas-treat")
#   - Stripe Publishable Key
#   - Stripe Secret Key
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  Setup Stripe Keys for Client Business${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Error: Not in project directory${NC}"
    echo "Please run this from: /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project"
    exit 1
fi

echo -e "${GREEN}✅ Project directory found${NC}"
echo ""

# Prompt for business slug
echo -e "${YELLOW}Step 1: Which business are you setting up?${NC}"
echo "Enter the business slug (e.g., 'ishas-treat'):"
read -p "> " BUSINESS_SLUG

if [ -z "$BUSINESS_SLUG" ]; then
    echo -e "${RED}❌ Business slug is required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Business slug: $BUSINESS_SLUG${NC}"
echo ""

# Prompt for Publishable Key
echo -e "${YELLOW}Step 2: Enter the Stripe Publishable Key${NC}"
echo "This should start with 'pk_test_' or 'pk_live_'"
echo ""
read -p "Publishable Key: " PUBLISHABLE_KEY

if [ -z "$PUBLISHABLE_KEY" ]; then
    echo -e "${RED}❌ Publishable key is required${NC}"
    exit 1
fi

# Validate Publishable Key format
if [[ ! "$PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
    echo -e "${RED}❌ Invalid publishable key format${NC}"
    echo "Expected format: pk_test_... or pk_live_..."
    exit 1
fi

echo -e "${GREEN}✅ Valid publishable key${NC}"
echo ""

# Prompt for Secret Key
echo -e "${YELLOW}Step 3: Enter the Stripe Secret Key${NC}"
echo "This should start with 'sk_test_' or 'sk_live_'"
echo ""
read -sp "Secret Key (hidden): " SECRET_KEY
echo ""

if [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}❌ Secret key is required${NC}"
    exit 1
fi

# Validate Secret Key format
if [[ ! "$SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
    echo -e "${RED}❌ Invalid secret key format${NC}"
    echo "Expected format: sk_test_... or sk_live_..."
    exit 1
fi

echo -e "${GREEN}✅ Valid secret key${NC}"
echo ""

# Determine if test or live keys
if [[ "$PUBLISHABLE_KEY" =~ ^pk_test_ ]] && [[ "$SECRET_KEY" =~ ^sk_test_ ]]; then
    KEY_MODE="TEST"
    KEY_MODE_COLOR="${YELLOW}"
elif [[ "$PUBLISHABLE_KEY" =~ ^pk_live_ ]] && [[ "$SECRET_KEY" =~ ^sk_live_ ]]; then
    KEY_MODE="LIVE"
    KEY_MODE_COLOR="${GREEN}"
else
    echo -e "${RED}❌ Key mismatch!${NC}"
    echo "Publishable and Secret keys must both be test OR both be live"
    exit 1
fi

echo -e "${KEY_MODE_COLOR}ℹ️  Key Mode: ${KEY_MODE}${NC}"
echo ""

# Summary
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo "Business:         $BUSINESS_SLUG"
echo "Key Mode:         $KEY_MODE"
echo "Publishable Key:  ${PUBLISHABLE_KEY:0:15}...${PUBLISHABLE_KEY: -4}"
echo "Secret Key:       ${SECRET_KEY:0:15}...${SECRET_KEY: -4}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: The secret key will be stored in the database.${NC}"
echo -e "${YELLOW}    For production, implement encryption!${NC}"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Cancelled${NC}"
    exit 0
fi

echo ""

# Create SQL file
SQL_FILE="/tmp/setup-stripe-${BUSINESS_SLUG}-$(date +%s).sql"

cat > "$SQL_FILE" <<EOF
-- ============================================================================
-- Setup Stripe Keys for: $BUSINESS_SLUG
-- Mode: $KEY_MODE
-- Generated: $(date)
-- ============================================================================

-- Update the business with Stripe credentials
UPDATE businesses
SET
  stripe_publishable_key = '$PUBLISHABLE_KEY',
  stripe_secret_key_encrypted = '$SECRET_KEY',
  stripe_connected_at = NOW(),
  updated_at = NOW()
WHERE slug = '$BUSINESS_SLUG';

-- Verify the update
SELECT
  id,
  name,
  slug,
  CASE
    WHEN stripe_publishable_key IS NOT NULL THEN '✅ Connected'
    ELSE '❌ Not Connected'
  END as stripe_status,
  CASE
    WHEN stripe_publishable_key LIKE 'pk_test_%' THEN 'TEST MODE'
    WHEN stripe_publishable_key LIKE 'pk_live_%' THEN 'LIVE MODE'
    ELSE 'UNKNOWN'
  END as key_mode,
  stripe_connected_at,
  updated_at
FROM businesses
WHERE slug = '$BUSINESS_SLUG';
EOF

echo -e "${GREEN}✅ SQL file created: $SQL_FILE${NC}"
echo ""

# Execute via Supabase
echo -e "${YELLOW}Executing SQL...${NC}"
echo ""

if supabase db execute -f "$SQL_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Stripe keys added successfully!${NC}"
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}  Next Steps${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
    echo "1. ✅ Stripe keys are now configured for $BUSINESS_SLUG"
    echo ""
    echo "2. Test the payment flow:"
    echo "   npm run dev"
    echo "   - Go to https://$BUSINESS_SLUG.apinlero.com"
    echo "   - Add items to cart"
    echo "   - Go to checkout"
    if [ "$KEY_MODE" = "TEST" ]; then
        echo "   - Use test card: 4242 4242 4242 4242"
    else
        echo "   - Use a real card (LIVE MODE - real charges!)"
    fi
    echo ""
    echo "3. Setup Stripe webhook (if not done yet):"
    echo "   - Go to: https://dashboard.stripe.com/webhooks"
    echo "   - Add endpoint: https://gafoezdpaotwvpfldyhc.supabase.co/functions/v1/stripe-webhook"
    echo "   - Select events: payment_intent.succeeded, payment_intent.payment_failed"
    echo "   - Copy webhook secret (whsec_...)"
    echo "   - Run: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""
    echo "4. Notify the client:"
    echo "   Send them a confirmation email that payment processing is now live!"
    echo ""

    # Clean up SQL file
    rm "$SQL_FILE"
    echo -e "${GREEN}✅ Setup complete!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to execute SQL${NC}"
    echo "SQL file saved at: $SQL_FILE"
    echo "You can manually run it in Supabase SQL Editor"
    exit 1
fi
