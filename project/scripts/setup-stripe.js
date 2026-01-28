#!/usr/bin/env node

/**
 * Stripe Setup Automation Script
 *
 * This script automates the complete Stripe integration setup process:
 * 1. Checks prerequisites (Node.js, Supabase CLI, etc.)
 * 2. Runs database migration
 * 3. Verifies Edge Functions are deployed
 * 4. Tests Stripe integration
 * 5. Provides next steps
 *
 * Usage:
 *   node scripts/setup-stripe.js
 *
 * Options:
 *   --skip-migration    Skip database migration step
 *   --skip-functions    Skip Edge Functions check
 *   --test-only         Only run tests, skip setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipMigration: args.includes('--skip-migration'),
  skipFunctions: args.includes('--skip-functions'),
  testOnly: args.includes('--test-only'),
};

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const MIGRATION_FILE = '20260126232812_add_stripe_columns_to_businesses.sql';
const EDGE_FUNCTIONS = ['create-payment-intent', 'test-stripe-connection'];

// Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '═'.repeat(70), colors.blue);
  log(`  ${title}`, colors.bold + colors.blue);
  log('═'.repeat(70), colors.blue);
}

function logStep(step, total, message) {
  log(`\n[${step}/${total}] ${message}`, colors.cyan);
}

function executeCommand(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      cwd: PROJECT_ROOT,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error, output: error.stdout || error.stderr };
  }
}

function checkPrerequisite(name, command, installInstructions) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`  ✓ ${name} - ${result.trim().split('\n')[0]}`, colors.green);
    return true;
  } catch (error) {
    log(`  ✗ ${name} - Not found`, colors.red);
    if (installInstructions) {
      log(`    Install: ${installInstructions}`, colors.yellow);
    }
    return false;
  }
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function checkPrerequisites() {
  logStep(1, 6, 'Checking Prerequisites');

  const checks = [
    {
      name: 'Node.js',
      command: 'node --version',
      required: true,
    },
    {
      name: 'npm',
      command: 'npm --version',
      required: true,
    },
    {
      name: 'Supabase CLI',
      command: 'supabase --version',
      required: false,
      install: 'npm install -g supabase',
    },
  ];

  let allRequired = true;
  for (const check of checks) {
    const passed = checkPrerequisite(check.name, check.command, check.install);
    if (check.required && !passed) {
      allRequired = false;
    }
  }

  if (!allRequired) {
    log('\n✗ Missing required prerequisites', colors.red);
    return false;
  }

  log('\n✓ All prerequisites satisfied', colors.green);
  return true;
}

async function checkEnvironmentVariables() {
  logStep(2, 6, 'Checking Environment Variables');

  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const optionalVars = [
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  // Check .env file
  const envPath = path.join(PROJECT_ROOT, '.env');
  const envLocalPath = path.join(PROJECT_ROOT, '.env.local');

  let envExists = false;
  if (fs.existsSync(envPath)) {
    log(`  ✓ Found .env file`, colors.green);
    envExists = true;
  } else if (fs.existsSync(envLocalPath)) {
    log(`  ✓ Found .env.local file`, colors.green);
    envExists = true;
  } else {
    log(`  ✗ No .env file found`, colors.yellow);
    log(`    Create .env or .env.local with required variables`, colors.yellow);
  }

  // Check required variables
  let allPresent = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`  ✓ ${varName} - Set`, colors.green);
    } else {
      log(`  ✗ ${varName} - Missing`, colors.yellow);
      allPresent = false;
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`  ✓ ${varName} - Set (optional)`, colors.green);
    } else {
      log(`  ⊘ ${varName} - Not set (optional)`, colors.reset);
    }
  }

  if (!allPresent) {
    log('\n⚠ Some required environment variables are missing', colors.yellow);
    log('  The app may not work correctly without them', colors.yellow);
  }

  return true;
}

async function runMigration() {
  if (options.skipMigration) {
    log('\n⊘ Skipping migration (--skip-migration)', colors.yellow);
    return true;
  }

  logStep(3, 6, 'Running Database Migration');

  const migrationPath = path.join(
    PROJECT_ROOT,
    'supabase/migrations',
    MIGRATION_FILE
  );

  if (!fs.existsSync(migrationPath)) {
    log(`  ✗ Migration file not found: ${MIGRATION_FILE}`, colors.red);
    return false;
  }

  log(`  ✓ Migration file found`, colors.green);

  // Try to run via Supabase CLI
  log('\n  Attempting to run migration via Supabase CLI...', colors.cyan);

  const result = executeCommand('supabase db push 2>&1', true);

  if (result.success) {
    log('  ✓ Migration completed via CLI', colors.green);
    return true;
  } else {
    log('  ⚠ CLI migration failed or not authenticated', colors.yellow);
    log('\n  Please run migration manually:', colors.cyan);
    log('  1. Open Supabase Dashboard → SQL Editor', colors.reset);
    log(`  2. Run the SQL from: ${migrationPath}`, colors.reset);

    const answer = await promptUser('\n  Have you run the migration manually? (yes/no)');
    return answer === 'yes' || answer === 'y';
  }
}

async function checkEdgeFunctions() {
  if (options.skipFunctions) {
    log('\n⊘ Skipping Edge Functions check (--skip-functions)', colors.yellow);
    return true;
  }

  logStep(4, 6, 'Checking Edge Functions');

  for (const funcName of EDGE_FUNCTIONS) {
    const funcPath = path.join(PROJECT_ROOT, 'supabase/functions', funcName);

    if (fs.existsSync(funcPath)) {
      log(`  ✓ ${funcName} - Code exists`, colors.green);
    } else {
      log(`  ✗ ${funcName} - Code not found`, colors.red);
      return false;
    }
  }

  log('\n  ℹ To deploy Edge Functions:', colors.cyan);
  log('  1. Open Supabase Dashboard → Edge Functions', colors.reset);
  log('  2. Deploy each function via the editor', colors.reset);
  log(`     - ${EDGE_FUNCTIONS.join('\n     - ')}`, colors.reset);

  const answer = await promptUser('\n  Are all Edge Functions deployed? (yes/no)');
  return answer === 'yes' || answer === 'y';
}

async function verifyIntegration() {
  logStep(5, 6, 'Verifying Stripe Integration');

  // Check that StripeSettings component exists
  const componentPath = path.join(PROJECT_ROOT, 'src/pages/StripeSettings.tsx');
  if (fs.existsSync(componentPath)) {
    log('  ✓ StripeSettings component exists', colors.green);
  } else {
    log('  ✗ StripeSettings component not found', colors.red);
    return false;
  }

  // Check that stripe library has new functions
  const stripePath = path.join(PROJECT_ROOT, 'src/lib/stripe.ts');
  if (fs.existsSync(stripePath)) {
    const content = fs.readFileSync(stripePath, 'utf8');
    const requiredFunctions = [
      'getBusinessStripe',
      'createBusinessPaymentIntent',
      'isStripeConnected',
      'getStripeStatus',
    ];

    let allPresent = true;
    for (const funcName of requiredFunctions) {
      if (content.includes(funcName)) {
        log(`  ✓ ${funcName} function exists`, colors.green);
      } else {
        log(`  ✗ ${funcName} function missing`, colors.red);
        allPresent = false;
      }
    }

    if (!allPresent) return false;
  } else {
    log('  ✗ stripe.ts library not found', colors.red);
    return false;
  }

  log('\n✓ All code components verified', colors.green);
  return true;
}

async function showNextSteps() {
  logStep(6, 6, 'Next Steps');

  log('\n📋 Complete these steps to finish Stripe integration:', colors.cyan);
  log('=' .repeat(70), colors.blue);

  const steps = [
    {
      title: '1. Add Stripe Settings to Navigation',
      details: [
        'Add route to App.tsx or router configuration',
        'Add navigation link to sidebar/menu',
        'Test navigation works',
      ],
    },
    {
      title: '2. Test Stripe Connection UI',
      details: [
        'Navigate to Stripe Settings page',
        'Enter test API keys from Stripe Dashboard',
        'Click "Test Connection"',
        'Verify connection succeeds',
      ],
    },
    {
      title: '3. Save Configuration',
      details: [
        'Click "Save Configuration"',
        'Verify keys are saved to database',
        'Check stripe_connected_at timestamp is set',
      ],
    },
    {
      title: '4. Test Payment Creation',
      details: [
        'Use test card: 4242 4242 4242 4242',
        'Any future expiry date (e.g., 12/34)',
        'Any 3-digit CVC',
        'Verify payment intent created in Stripe Dashboard',
      ],
    },
    {
      title: '5. Implement Security (CRITICAL before production)',
      details: [
        'Encrypt secret keys using Supabase Vault',
        'Add API key rotation mechanism',
        'Implement webhook signature verification',
        'Add rate limiting to Edge Functions',
      ],
    },
    {
      title: '6. Test Multi-Tenant Isolation',
      details: [
        'Connect different businesses with different Stripe accounts',
        'Verify each business only sees their own payments',
        'Test RLS policies prevent cross-business data access',
      ],
    },
  ];

  steps.forEach(step => {
    log(`\n${step.title}`, colors.bold + colors.cyan);
    step.details.forEach(detail => {
      log(`  • ${detail}`, colors.reset);
    });
  });

  log('\n' + '═'.repeat(70), colors.blue);

  log('\n📚 Documentation:', colors.cyan);
  log('  • STRIPE_INTEGRATION_COMPLETE.md - Complete integration guide', colors.reset);
  log('  • STRIPE_SETUP_GUIDE.md - Original setup guide', colors.reset);

  log('\n🔒 Security Warnings:', colors.red);
  log('  ⚠ Secret keys are currently stored in PLAIN TEXT', colors.yellow);
  log('  ⚠ You MUST implement encryption before production', colors.yellow);
  log('  ⚠ Use Supabase Vault or similar encryption solution', colors.yellow);

  log('\n✅ Setup complete! Your Stripe integration is ready for testing.', colors.green);
}

function showTestInstructions() {
  logSection('Stripe Integration Test Guide');

  log('\n🧪 Test Checklist:', colors.cyan);

  const tests = [
    {
      name: 'Database Migration',
      command: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'businesses\' AND column_name LIKE \'stripe%\';',
      expected: '5 columns (stripe_publishable_key, stripe_secret_key_encrypted, etc.)',
    },
    {
      name: 'Edge Functions Deployed',
      check: 'Visit Supabase Dashboard → Edge Functions',
      expected: 'create-payment-intent and test-stripe-connection both deployed',
    },
    {
      name: 'UI Navigation',
      check: 'Navigate to /stripe-settings',
      expected: 'StripeSettings page loads without errors',
    },
    {
      name: 'Test Connection',
      check: 'Enter test keys and click "Test Connection"',
      expected: 'Success message with account details',
    },
    {
      name: 'Save Configuration',
      check: 'Click "Save Configuration"',
      expected: 'Keys saved to database, success toast shown',
    },
    {
      name: 'Create Payment',
      check: 'Create test payment with test card 4242...',
      expected: 'Payment intent created, visible in Stripe Dashboard',
    },
  ];

  tests.forEach((test, idx) => {
    log(`\n${idx + 1}. ${test.name}`, colors.bold + colors.cyan);
    if (test.command) {
      log(`   SQL: ${test.command}`, colors.yellow);
    }
    if (test.check) {
      log(`   Test: ${test.check}`, colors.yellow);
    }
    log(`   Expected: ${test.expected}`, colors.green);
  });

  log('\n🎫 Stripe Test Cards:', colors.cyan);
  log('  • Success: 4242 4242 4242 4242', colors.green);
  log('  • Decline: 4000 0000 0000 0002', colors.red);
  log('  • 3D Secure: 4000 0025 0000 3155', colors.yellow);
  log('\n  Use any future expiry (12/34) and any CVC (123)', colors.reset);
}

// Main execution
async function main() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', colors.blue);
  log('║                 Stripe Setup Automation Script                   ║', colors.blue);
  log('║                      Apinlero SaaS Platform                       ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════════════╝', colors.blue);

  if (options.testOnly) {
    showTestInstructions();
    return;
  }

  log('\nThis script will guide you through the Stripe integration setup.', colors.cyan);

  try {
    // Step 1: Prerequisites
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      log('\n✗ Setup cannot continue without required prerequisites', colors.red);
      process.exit(1);
    }

    // Step 2: Environment variables
    await checkEnvironmentVariables();

    // Step 3: Migration
    const migrationOk = await runMigration();
    if (!migrationOk) {
      log('\n✗ Migration step failed', colors.red);
      log('  Please complete the migration before continuing', colors.yellow);
      process.exit(1);
    }

    // Step 4: Edge Functions
    const functionsOk = await checkEdgeFunctions();
    if (!functionsOk) {
      log('\n✗ Edge Functions not ready', colors.red);
      log('  Please deploy the Edge Functions before continuing', colors.yellow);
      process.exit(1);
    }

    // Step 5: Verify integration
    const verifyOk = await verifyIntegration();
    if (!verifyOk) {
      log('\n✗ Integration verification failed', colors.red);
      process.exit(1);
    }

    // Step 6: Next steps
    await showNextSteps();

    log('\n═══════════════════════════════════════════════════════════════════', colors.blue);
    log('\n✨ Setup script completed successfully!', colors.green);
    log('\nRun with --test-only to see the test checklist:', colors.cyan);
    log('  node scripts/setup-stripe.js --test-only', colors.reset);

  } catch (error) {
    log('\n✗ Unexpected error during setup:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
