#!/usr/bin/env node

/**
 * Stripe Migration Runner
 *
 * This script automates running the Stripe database migration.
 * It can be run locally or in CI/CD pipelines.
 *
 * Usage:
 *   node scripts/run-stripe-migration.js
 *
 * Requirements:
 *   - Supabase CLI installed
 *   - SUPABASE_ACCESS_TOKEN environment variable set
 *   OR
 *   - Supabase project ref and database password
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATION_FILE = '20260126232812_add_stripe_columns_to_businesses.sql';
const MIGRATION_PATH = path.join(__dirname, '../supabase/migrations', MIGRATION_FILE);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  log(`\n▶ ${description}...`, colors.cyan);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✓ ${description} - Success`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`✗ ${description} - Failed`, colors.red);
    if (error.stdout) log(error.stdout, colors.yellow);
    if (error.stderr) log(error.stderr, colors.red);
    return { success: false, error };
  }
}

function checkMigrationFile() {
  log('\n📁 Checking migration file...', colors.blue);

  if (!fs.existsSync(MIGRATION_PATH)) {
    log(`✗ Migration file not found: ${MIGRATION_PATH}`, colors.red);
    log('\nExpected location:', colors.yellow);
    log(`  ${MIGRATION_PATH}`, colors.yellow);
    return false;
  }

  log(`✓ Migration file found: ${MIGRATION_FILE}`, colors.green);

  // Show migration content preview
  const content = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const lines = content.split('\n').slice(0, 5);
  log('\nMigration preview:', colors.cyan);
  lines.forEach(line => log(`  ${line}`, colors.reset));
  log('  ...', colors.reset);

  return true;
}

function checkSupabaseCLI() {
  log('\n🔍 Checking Supabase CLI...', colors.blue);

  try {
    const version = execSync('supabase --version', { encoding: 'utf8', stdio: 'pipe' });
    log(`✓ Supabase CLI installed: ${version.trim()}`, colors.green);
    return true;
  } catch (error) {
    log('✗ Supabase CLI not installed', colors.red);
    log('\nInstall with:', colors.yellow);
    log('  npm install -g supabase', colors.cyan);
    log('  or', colors.yellow);
    log('  brew install supabase/tap/supabase', colors.cyan);
    return false;
  }
}

function runMigrationViaCLI() {
  log('\n🚀 Running migration via Supabase CLI...', colors.blue);

  // Check if logged in
  const loginCheck = executeCommand(
    'supabase projects list 2>&1',
    'Checking Supabase authentication'
  );

  if (!loginCheck.success) {
    log('\n⚠ Not authenticated with Supabase CLI', colors.yellow);
    log('\nTo authenticate, run:', colors.cyan);
    log('  supabase login', colors.cyan);
    log('  or', colors.yellow);
    log('  export SUPABASE_ACCESS_TOKEN=<your-token>', colors.cyan);
    return false;
  }

  // Run migration
  const result = executeCommand(
    `supabase db push`,
    'Pushing migrations to database'
  );

  return result.success;
}

function showManualInstructions() {
  log('\n📋 Manual Migration Instructions:', colors.blue);
  log('=' .repeat(60), colors.blue);

  log('\n1. Open Supabase Dashboard:', colors.cyan);
  log('   https://app.supabase.com/', colors.reset);

  log('\n2. Navigate to:', colors.cyan);
  log('   Project → SQL Editor → New Query', colors.reset);

  log('\n3. Copy and paste the migration SQL:', colors.cyan);
  log(`   File: ${MIGRATION_PATH}`, colors.reset);

  log('\n4. Run the query', colors.cyan);

  log('\n5. Verify columns were added:', colors.cyan);
  log('   SELECT column_name FROM information_schema.columns', colors.reset);
  log('   WHERE table_name = \'businesses\'', colors.reset);
  log('   AND column_name LIKE \'stripe%\';', colors.reset);

  log('\n' + '='.repeat(60), colors.blue);
}

function verifyMigration() {
  log('\n✅ Verifying migration...', colors.blue);

  const verifySQL = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'businesses'
    AND column_name LIKE 'stripe%'
    ORDER BY column_name;
  `;

  log('\nTo verify the migration succeeded, run this query:', colors.cyan);
  log(verifySQL, colors.reset);

  log('\nExpected columns:', colors.cyan);
  const expectedColumns = [
    'stripe_account_id',
    'stripe_connected_at',
    'stripe_publishable_key',
    'stripe_secret_key_encrypted',
    'stripe_webhook_secret'
  ];
  expectedColumns.forEach(col => log(`  ✓ ${col}`, colors.green));
}

// Main execution
async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.blue);
  log('║          Stripe Migration Runner for Apinlero            ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════╝', colors.blue);

  // Step 1: Check migration file exists
  if (!checkMigrationFile()) {
    process.exit(1);
  }

  // Step 2: Check if Supabase CLI is available
  const hasSupabaseCLI = checkSupabaseCLI();

  // Step 3: Try to run migration
  let migrationSuccess = false;

  if (hasSupabaseCLI) {
    migrationSuccess = runMigrationViaCLI();
  }

  // Step 4: Show manual instructions if automatic failed
  if (!migrationSuccess) {
    log('\n⚠ Automatic migration failed or unavailable', colors.yellow);
    showManualInstructions();
  } else {
    log('\n✓ Migration completed successfully!', colors.green);
    verifyMigration();
  }

  // Step 5: Next steps
  log('\n📝 Next Steps:', colors.blue);
  log('=' .repeat(60), colors.blue);
  log('\n1. Verify migration succeeded (see query above)', colors.cyan);
  log('2. Deploy Edge Functions:', colors.cyan);
  log('   - create-payment-intent', colors.reset);
  log('   - test-stripe-connection', colors.reset);
  log('3. Add Stripe Settings to app navigation', colors.cyan);
  log('4. Test Stripe integration end-to-end', colors.cyan);
  log('\n' + '='.repeat(60), colors.blue);

  if (migrationSuccess) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log('\n✗ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});
