#!/bin/bash

# 🚀 Stripe Security Fixes - Automated Deployment Script
# This script deploys all security fixes to your Supabase project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Stripe Payment Security Fixes - Deployment${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not installed${NC}"
    echo "Install it: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found (version: $(supabase --version | head -n 1))${NC}"
echo ""

# Change to project directory
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project || exit 1

# Check if user is logged in
echo -e "${YELLOW}📝 Checking Supabase login status...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase CLI${NC}"
    echo -e "${BLUE}Please login:${NC}"
    echo "  supabase login"
    echo ""
    read -p "Press Enter after you've logged in, or Ctrl+C to cancel..."

    # Verify login succeeded
    if ! supabase projects list &> /dev/null; then
        echo -e "${RED}❌ Still not logged in. Please run 'supabase login' first${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Check if project is linked
echo -e "${YELLOW}📝 Checking project link status...${NC}"
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked${NC}"
    echo ""
    echo "Available projects:"
    supabase projects list
    echo ""
    read -p "Enter your project reference ID: " PROJECT_REF

    echo -e "${BLUE}Linking to project...${NC}"
    supabase link --project-ref "$PROJECT_REF"

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to link project${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Deploy Edge Functions
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Deploying Edge Functions${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

FUNCTIONS=(
    "create-payment-intent"
    "verify-order-total"
    "stripe-webhook"
    "test-stripe-connection"
)

DEPLOYED=0
FAILED=0

for FUNC in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}📤 Deploying ${FUNC}...${NC}"

    if supabase functions deploy "$FUNC" --no-verify-jwt; then
        echo -e "${GREEN}✅ ${FUNC} deployed successfully${NC}"
        ((DEPLOYED++))
    else
        echo -e "${RED}❌ Failed to deploy ${FUNC}${NC}"
        ((FAILED++))
    fi
    echo ""
done

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "✅ Successfully deployed: ${GREEN}${DEPLOYED}${NC} functions"
if [ $FAILED -gt 0 ]; then
    echo -e "❌ Failed: ${RED}${FAILED}${NC} functions"
fi
echo ""

# Check environment variables
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Environment Variables Check${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"

    # Check for required variables
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env && grep -q "VITE_STRIPE_PUBLISHABLE_KEY" .env; then
        echo -e "${GREEN}✅ All required environment variables present${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing some environment variables${NC}"
        echo "Required variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_ANON_KEY"
        echo "  - VITE_STRIPE_PUBLISHABLE_KEY"
    fi
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "Create a .env file with:"
    echo "  VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo "  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..."
fi
echo ""

# Webhook Secret Reminder
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}1. Set Webhook Secret (if not already set):${NC}"
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""

echo -e "${YELLOW}2. Configure Stripe Webhook:${NC}"
echo "   Go to: https://dashboard.stripe.com/webhooks"
echo "   Add endpoint URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "   Select events:"
echo "     - payment_intent.succeeded"
echo "     - payment_intent.payment_failed"
echo "     - payment_intent.processing"
echo "     - charge.refunded"
echo ""

echo -e "${YELLOW}3. Test the deployment:${NC}"
echo "   npm run dev"
echo "   - Add items to cart"
echo "   - Go to checkout"
echo "   - Test with card: 4242 4242 4242 4242"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}View function logs:${NC}"
echo "  supabase functions logs create-payment-intent"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  - SECURITY_FIXES_COMPLETED.md - Complete fix details"
echo "  - TEST_SECURITY_FIXES.md - Testing guide"
echo "  - DEPLOYMENT_GUIDE.md - Full deployment instructions"
echo ""
