# Apinlero Automation Scripts

This directory contains automation scripts for managing the Apinlero platform, particularly the Stripe integration.

## Available Scripts

### 1. run-stripe-migration.js

Automates running the Stripe database migration.

**Purpose:**
- Run Stripe database migration automatically
- Verify Supabase CLI is installed
- Provide manual instructions as fallback
- Show verification queries

**Usage:**
```bash
node scripts/run-stripe-migration.js
```

**Requirements:**
- Supabase CLI (optional, will provide manual instructions if not available)
- SUPABASE_ACCESS_TOKEN environment variable (if using CLI)

**What it does:**
1. ✓ Checks migration file exists
2. ✓ Checks Supabase CLI installation
3. ✓ Attempts `supabase db push`
4. ✓ Shows manual instructions if CLI fails
5. ✓ Provides verification query
6. ✓ Shows next steps

**Exit codes:**
- `0` - Migration succeeded
- `1` - Migration failed or file missing

---

### 2. setup-stripe.js

Complete Stripe integration setup automation.

**Purpose:**
- Guide through entire Stripe setup process
- Check prerequisites and environment
- Run migration
- Verify Edge Functions
- Show comprehensive next steps

**Usage:**
```bash
# Full setup with interactive prompts
node scripts/setup-stripe.js

# Skip database migration
node scripts/setup-stripe.js --skip-migration

# Skip Edge Functions check
node scripts/setup-stripe.js --skip-functions

# Show test guide only
node scripts/setup-stripe.js --test-only
```

**Requirements:**
- Node.js 16+
- npm
- Supabase CLI (optional)
- Environment variables in .env:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

**What it does:**
1. ✓ Checks Node.js, npm, Supabase CLI
2. ✓ Verifies environment variables
3. ✓ Runs database migration (or prompts manual)
4. ✓ Checks Edge Functions deployment
5. ✓ Verifies integration code files
6. ✓ Shows detailed next steps
7. ✓ Security warnings and best practices

**Interactive:**
- Prompts for manual migration if CLI fails
- Asks if Edge Functions are deployed
- Provides step-by-step guidance

**Exit codes:**
- `0` - Setup completed successfully
- `1` - Setup failed (missing prerequisites or steps)

---

### 3. test-stripe-integration.js

End-to-end Stripe integration test suite.

**Purpose:**
- Verify complete Stripe integration
- Test database schema
- Test Edge Functions
- Test Stripe API connection
- Test payment creation
- Verify security (RLS)

**Usage:**
```bash
# Run with environment variables
TEST_STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
TEST_STRIPE_SECRET_KEY=sk_test_xxx \
TEST_BUSINESS_ID=xxx \
node scripts/test-stripe-integration.js

# Run with interactive prompts
node scripts/test-stripe-integration.js
```

**Requirements:**
- Environment variables:
  - `VITE_SUPABASE_URL` (required)
  - `VITE_SUPABASE_ANON_KEY` (required)
  - `TEST_STRIPE_PUBLISHABLE_KEY` (optional, will prompt)
  - `TEST_STRIPE_SECRET_KEY` (optional, will prompt)
  - `TEST_BUSINESS_ID` (optional, will prompt)

**What it tests:**
1. ✓ Environment variables present
2. ✓ Database schema (Stripe columns exist)
3. ✓ Edge Functions deployed and responding
4. ✓ Stripe API connection (account retrieval)
5. ✓ Payment intent creation
6. ✓ Multi-tenant isolation (RLS policies)

**Output:**
- Color-coded test results
- Pass/fail/skip status for each test
- Test summary with pass rate
- Failed test details
- Recommended next steps
- Security reminders

**Interactive:**
- Prompts for Stripe test keys if not in environment
- Prompts for business ID if testing payment creation
- Can skip optional tests

**Exit codes:**
- `0` - All tests passed
- `1` - One or more tests failed

---

## Quick Start

If you're setting up Stripe integration for the first time, run these in order:

### Step 1: Setup
```bash
node scripts/setup-stripe.js
```

Follow the prompts to:
- Check prerequisites
- Run migration
- Deploy Edge Functions
- Get next steps

### Step 2: Test
```bash
node scripts/test-stripe-integration.js
```

This will verify everything is working correctly.

### Step 3: Configure
1. Open your dashboard
2. Go to Settings tab
3. Enter Stripe API keys
4. Test connection
5. Save configuration

---

## Development

### Making Scripts Executable

All scripts are already marked as executable with `chmod +x`, but if needed:

```bash
chmod +x scripts/*.js
```

### Running Without node Command

If scripts are executable, you can run them directly:

```bash
./scripts/setup-stripe.js
./scripts/test-stripe-integration.js
```

### Adding New Scripts

When creating new automation scripts:

1. Add shebang line: `#!/usr/bin/env node`
2. Use color-coded console output (see existing scripts)
3. Include help/usage information
4. Handle errors gracefully
5. Provide clear success/failure messages
6. Exit with appropriate exit codes (0 = success, 1 = failure)
7. Document in this README

---

## Troubleshooting

### "command not found: supabase"

**Problem:** Supabase CLI not installed

**Solution:**
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### "Missing required environment variables"

**Problem:** .env file not configured

**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in Supabase credentials
3. Get credentials from Supabase Dashboard → Settings → API

### "Migration failed"

**Problem:** Database migration could not run

**Solution:**
1. Run migration manually via Supabase Dashboard
2. Navigate to SQL Editor
3. Copy/paste migration SQL
4. Execute query

### "Edge Functions not deployed"

**Problem:** Edge Functions not found or not responding

**Solution:**
1. Open Supabase Dashboard → Edge Functions
2. Deploy `create-payment-intent` function
3. Deploy `test-stripe-connection` function
4. Verify both show "Deployed" status

### "Stripe connection test failed"

**Problem:** Invalid Stripe API keys

**Solution:**
1. Verify keys from Stripe Dashboard → Developers → API Keys
2. Ensure both keys are test mode (pk_test_... and sk_test_...)
3. Check keys are from same Stripe account
4. Verify keys are not revoked

---

## Environment Variables Reference

### Required (for all scripts)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional (for testing)
```bash
TEST_STRIPE_PUBLISHABLE_KEY=pk_test_...
TEST_STRIPE_SECRET_KEY=sk_test_...
TEST_BUSINESS_ID=uuid-of-test-business
```

### Optional (for CLI operations)
```bash
SUPABASE_ACCESS_TOKEN=sbp_...
```

---

## Related Documentation

- [STRIPE_INTEGRATION_COMPLETE.md](../STRIPE_INTEGRATION_COMPLETE.md) - Complete Stripe integration guide
- [DEPLOY_TEST_STRIPE_CONNECTION.md](../DEPLOY_TEST_STRIPE_CONNECTION.md) - Edge Function deployment guide
- [STRIPE_SETUP_GUIDE.md](../STRIPE_SETUP_GUIDE.md) - Original setup guide

---

## Support

If you encounter issues with these scripts:

1. Check this README for troubleshooting
2. Review script output for specific error messages
3. Verify environment variables are set correctly
4. Check Supabase Dashboard for deployment status
5. Review Edge Function logs for errors

For Stripe-specific issues:
- Check Stripe Dashboard → Developers → Logs
- Verify API keys are valid
- Check webhook configuration
- Review payment intent details

---

**Last Updated:** January 27, 2026
