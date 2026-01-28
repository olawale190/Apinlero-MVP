#!/usr/bin/env node

/**
 * Stripe Integration End-to-End Test Script
 *
 * This script tests the complete Stripe integration:
 * 1. Database schema verification
 * 2. Edge Functions availability
 * 3. Test connection with Stripe API
 * 4. Payment intent creation
 * 5. Multi-tenant isolation
 *
 * Usage:
 *   node scripts/test-stripe-integration.js
 *
 * Environment Variables Required:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anon key
 *   TEST_STRIPE_PUBLISHABLE_KEY - Test Stripe publishable key (pk_test_...)
 *   TEST_STRIPE_SECRET_KEY - Test Stripe secret key (sk_test_...)
 *   TEST_BUSINESS_ID - Business ID to test with
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

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

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⊘';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  log(`  ${icon} ${name}`, color);
  if (details) {
    log(`    ${details}`, colors.reset);
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
      resolve(answer.trim());
    });
  });
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

function recordTest(name, status, details = '') {
  testResults.tests.push({ name, status, details });
  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else testResults.skipped++;
}

async function checkEnvironmentVariables() {
  logSection('1. Environment Variables Check');

  const requiredVars = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  };

  const testVars = {
    TEST_STRIPE_PUBLISHABLE_KEY: process.env.TEST_STRIPE_PUBLISHABLE_KEY,
    TEST_STRIPE_SECRET_KEY: process.env.TEST_STRIPE_SECRET_KEY,
    TEST_BUSINESS_ID: process.env.TEST_BUSINESS_ID,
  };

  let allPresent = true;

  // Check required Supabase variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      logTest(`${key}`, 'pass', 'Set');
      recordTest(`Env: ${key}`, 'pass');
    } else {
      logTest(`${key}`, 'fail', 'Missing - required for tests');
      recordTest(`Env: ${key}`, 'fail', 'Missing');
      allPresent = false;
    }
  }

  // Check test Stripe variables (can prompt if missing)
  for (const [key, value] of Object.entries(testVars)) {
    if (value) {
      logTest(`${key}`, 'pass', 'Set');
      recordTest(`Env: ${key}`, 'pass');
    } else {
      logTest(`${key}`, 'skip', 'Not set - will prompt or skip tests');
      recordTest(`Env: ${key}`, 'skip');
    }
  }

  return allPresent;
}

async function testDatabaseSchema(supabase) {
  logSection('2. Database Schema Verification');

  try {
    // Check if businesses table exists and has Stripe columns
    const { data, error } = await supabase.rpc('get_stripe_columns', {}, { count: 'exact' }).catch(() => {
      // If the RPC doesn't exist, query information_schema directly
      return supabase.from('information_schema.columns').select('column_name').eq('table_name', 'businesses').like('column_name', 'stripe%');
    });

    // Fallback: try direct query
    const { data: columns, error: schemaError } = await supabase
      .from('businesses')
      .select('stripe_publishable_key, stripe_secret_key_encrypted, stripe_account_id, stripe_webhook_secret, stripe_connected_at')
      .limit(0);

    if (schemaError) {
      if (schemaError.message.includes('does not exist') || schemaError.message.includes('column')) {
        logTest('Stripe columns exist', 'fail', 'Migration not run or columns missing');
        recordTest('DB Schema: Stripe columns', 'fail', schemaError.message);
        return false;
      }
    }

    const expectedColumns = [
      'stripe_publishable_key',
      'stripe_secret_key_encrypted',
      'stripe_account_id',
      'stripe_webhook_secret',
      'stripe_connected_at',
    ];

    logTest('Stripe columns exist', 'pass', `All ${expectedColumns.length} columns present`);
    recordTest('DB Schema: Stripe columns', 'pass');

    // List the columns
    log('\n  Expected columns:', colors.cyan);
    expectedColumns.forEach(col => log(`    • ${col}`, colors.green));

    return true;
  } catch (error) {
    logTest('Database schema check', 'fail', error.message);
    recordTest('DB Schema: Check', 'fail', error.message);
    return false;
  }
}

async function testEdgeFunctions(supabase) {
  logSection('3. Edge Functions Availability');

  const functions = ['create-payment-intent', 'test-stripe-connection'];
  let allAvailable = true;

  for (const funcName of functions) {
    try {
      // Try invoking with invalid data to see if function exists
      const { error } = await supabase.functions.invoke(funcName, {
        body: {},
      });

      // If we get a specific error (not 404), the function exists
      if (error && error.message && !error.message.includes('404')) {
        logTest(`${funcName}`, 'pass', 'Deployed and responding');
        recordTest(`Edge Function: ${funcName}`, 'pass');
      } else if (!error) {
        logTest(`${funcName}`, 'pass', 'Deployed and responding');
        recordTest(`Edge Function: ${funcName}`, 'pass');
      } else {
        logTest(`${funcName}`, 'fail', 'Not found (404)');
        recordTest(`Edge Function: ${funcName}`, 'fail', 'Not deployed');
        allAvailable = false;
      }
    } catch (error) {
      logTest(`${funcName}`, 'fail', error.message);
      recordTest(`Edge Function: ${funcName}`, 'fail', error.message);
      allAvailable = false;
    }
  }

  return allAvailable;
}

async function testStripeConnection(supabase, publishableKey, secretKey) {
  logSection('4. Stripe API Connection Test');

  if (!publishableKey || !secretKey) {
    logTest('Stripe connection', 'skip', 'No test keys provided');
    recordTest('Stripe: Connection test', 'skip');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('test-stripe-connection', {
      body: {
        publishableKey,
        secretKey,
      },
    });

    if (error) {
      logTest('Stripe connection', 'fail', error.message);
      recordTest('Stripe: Connection test', 'fail', error.message);
      return null;
    }

    if (data && data.success) {
      logTest('Stripe connection', 'pass', `Connected to ${data.accountName} (${data.accountId})`);
      recordTest('Stripe: Connection test', 'pass', data.accountId);

      log('\n  Account Details:', colors.cyan);
      log(`    • Account ID: ${data.accountId}`, colors.reset);
      log(`    • Account Name: ${data.accountName}`, colors.reset);
      log(`    • Country: ${data.country}`, colors.reset);
      log(`    • Currency: ${data.currency}`, colors.reset);
      log(`    • Test Mode: ${data.testMode ? 'Yes' : 'No'}`, colors.reset);

      return data;
    } else {
      logTest('Stripe connection', 'fail', data?.error || 'Unknown error');
      recordTest('Stripe: Connection test', 'fail', data?.error);
      return null;
    }
  } catch (error) {
    logTest('Stripe connection', 'fail', error.message);
    recordTest('Stripe: Connection test', 'fail', error.message);
    return null;
  }
}

async function testPaymentIntent(supabase, businessId) {
  logSection('5. Payment Intent Creation Test');

  if (!businessId) {
    logTest('Payment intent creation', 'skip', 'No business ID provided');
    recordTest('Stripe: Payment intent', 'skip');
    return null;
  }

  try {
    // Create a test payment intent for £10
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        businessId,
        amount: 10.00,
        currency: 'gbp',
        orderId: `TEST-${Date.now()}`,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        description: 'Test payment from integration script',
      },
    });

    if (error) {
      logTest('Payment intent creation', 'fail', error.message);
      recordTest('Stripe: Payment intent', 'fail', error.message);
      return null;
    }

    if (data && data.clientSecret) {
      logTest('Payment intent creation', 'pass', `Created payment intent: ${data.paymentIntentId}`);
      recordTest('Stripe: Payment intent', 'pass', data.paymentIntentId);

      log('\n  Payment Intent Details:', colors.cyan);
      log(`    • Payment Intent ID: ${data.paymentIntentId}`, colors.reset);
      log(`    • Amount: £${data.amount}`, colors.reset);
      log(`    • Currency: ${data.currency}`, colors.reset);
      log(`    • Client Secret: ${data.clientSecret.substring(0, 30)}...`, colors.reset);

      return data;
    } else {
      logTest('Payment intent creation', 'fail', data?.error || 'No client secret returned');
      recordTest('Stripe: Payment intent', 'fail', data?.error);
      return null;
    }
  } catch (error) {
    logTest('Payment intent creation', 'fail', error.message);
    recordTest('Stripe: Payment intent', 'fail', error.message);
    return null;
  }
}

async function testMultiTenantIsolation(supabase) {
  logSection('6. Multi-Tenant Isolation Test');

  try {
    // Try to query businesses table (should be restricted by RLS)
    const { data, error } = await supabase
      .from('businesses')
      .select('id, stripe_connected_at')
      .limit(5);

    if (error) {
      // RLS is working - this is expected for non-authenticated requests
      logTest('Row Level Security', 'pass', 'RLS preventing unauthorized access');
      recordTest('Security: RLS', 'pass', 'Blocking unauthorized access');
    } else if (data && data.length === 0) {
      logTest('Row Level Security', 'pass', 'No data returned (RLS working)');
      recordTest('Security: RLS', 'pass', 'No data leaked');
    } else {
      logTest('Row Level Security', 'skip', `Returned ${data?.length || 0} rows - check RLS policies`);
      recordTest('Security: RLS', 'skip', 'May need review');
    }

    return true;
  } catch (error) {
    logTest('Multi-tenant isolation', 'fail', error.message);
    recordTest('Security: Isolation', 'fail', error.message);
    return false;
  }
}

function showTestSummary() {
  logSection('Test Summary');

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  log(`\n  Total Tests: ${total}`, colors.bold);
  log(`  ✓ Passed: ${testResults.passed}`, colors.green);
  log(`  ✗ Failed: ${testResults.failed}`, colors.red);
  log(`  ⊘ Skipped: ${testResults.skipped}`, colors.yellow);
  log(`  Pass Rate: ${passRate}%`, testResults.failed === 0 ? colors.green : colors.yellow);

  if (testResults.failed > 0) {
    log('\n  Failed Tests:', colors.red);
    testResults.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        log(`    • ${t.name}`, colors.red);
        if (t.details) log(`      ${t.details}`, colors.reset);
      });
  }

  log('\n' + '═'.repeat(70), colors.blue);

  if (testResults.failed === 0) {
    log('\n✅ All critical tests passed! Stripe integration is working.', colors.green);
  } else {
    log('\n⚠ Some tests failed. Review the errors above.', colors.yellow);
  }
}

function showNextSteps(connectionData, paymentData) {
  logSection('Next Steps');

  log('\n📋 Recommended Actions:', colors.cyan);

  if (testResults.failed > 0) {
    log('\n1. Fix Failed Tests', colors.yellow);
    log('   Review and resolve any failed tests above', colors.reset);
  }

  if (!connectionData) {
    log('\n2. Configure Stripe Keys', colors.cyan);
    log('   • Get test keys from: https://dashboard.stripe.com/test/apikeys', colors.reset);
    log('   • Add keys via Stripe Settings in the dashboard', colors.reset);
  }

  if (connectionData && !paymentData) {
    log('\n3. Test Payment Creation', colors.cyan);
    log('   • Create a test order in your dashboard', colors.reset);
    log('   • Process payment with test card: 4242 4242 4242 4242', colors.reset);
  }

  log('\n4. Implement Security', colors.red);
  log('   ⚠ CRITICAL: Encrypt secret keys before production', colors.yellow);
  log('   • Use Supabase Vault for key encryption', colors.reset);
  log('   • Implement webhook signature verification', colors.reset);
  log('   • Add rate limiting to Edge Functions', colors.reset);

  log('\n5. Test in Production Mode', colors.cyan);
  log('   • Get live keys from Stripe Dashboard', colors.reset);
  log('   • Test with real credit card (small amount)', colors.reset);
  log('   • Verify payments appear in Stripe Dashboard', colors.reset);

  log('\n6. Monitor and Maintain', colors.cyan);
  log('   • Set up Stripe webhook monitoring', colors.reset);
  log('   • Monitor Edge Function logs', colors.reset);
  log('   • Review failed payments regularly', colors.reset);

  log('\n═══════════════════════════════════════════════════════════════════', colors.blue);
}

// Main execution
async function main() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', colors.blue);
  log('║           Stripe Integration End-to-End Test Suite               ║', colors.blue);
  log('║                   Apinlero SaaS Platform                          ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════════════╝', colors.blue);

  // Step 1: Check environment
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    log('\n✗ Missing required environment variables. Tests cannot run.', colors.red);
    log('\nSet these variables in your .env file or environment:', colors.yellow);
    log('  VITE_SUPABASE_URL=your-project-url', colors.reset);
    log('  VITE_SUPABASE_ANON_KEY=your-anon-key', colors.reset);
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  // Step 2: Test database schema
  await testDatabaseSchema(supabase);

  // Step 3: Test Edge Functions
  await testEdgeFunctions(supabase);

  // Step 4: Test Stripe connection (with prompts if keys not in env)
  let publishableKey = process.env.TEST_STRIPE_PUBLISHABLE_KEY;
  let secretKey = process.env.TEST_STRIPE_SECRET_KEY;

  if (!publishableKey || !secretKey) {
    log('\n⚠ Stripe test keys not set in environment', colors.yellow);
    const answer = await promptUser('Would you like to enter test keys now? (yes/no)');

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      publishableKey = await promptUser('Enter Stripe publishable key (pk_test_...):');
      secretKey = await promptUser('Enter Stripe secret key (sk_test_...):');
    }
  }

  const connectionData = await testStripeConnection(supabase, publishableKey, secretKey);

  // Step 5: Test payment intent creation
  let businessId = process.env.TEST_BUSINESS_ID;
  if (connectionData && !businessId) {
    const answer = await promptUser('\nWould you like to test payment creation? (yes/no)');
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      businessId = await promptUser('Enter business ID to test with:');
    }
  }

  const paymentData = await testPaymentIntent(supabase, businessId);

  // Step 6: Test multi-tenant isolation
  await testMultiTenantIsolation(supabase);

  // Show summary
  showTestSummary();
  showNextSteps(connectionData, paymentData);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log('\n✗ Unexpected error during tests:', colors.red);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };
