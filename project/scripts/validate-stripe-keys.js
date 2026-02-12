#!/usr/bin/env node

/**
 * Stripe Key Validation Script
 *
 * This script validates that your Stripe keys are properly configured
 * and can connect to the Stripe API successfully.
 *
 * Usage:
 *   node scripts/validate-stripe-keys.js
 *
 * It will check:
 * 1. Frontend publishable key is set
 * 2. Backend secret key is set
 * 3. Keys have correct format
 * 4. Keys can connect to Stripe API
 * 5. Test/Live mode consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '═'.repeat(70), colors.blue);
  log(`  ${title}`, colors.bold + colors.blue);
  log('═'.repeat(70), colors.blue);
}

function logCheck(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  log(`  ${icon} ${name}`, color);
  if (details) {
    log(`    ${details}`, colors.reset);
  }
}

// Load environment files
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          env[key.trim()] = value;
        }
      }
    });

    return env;
  } catch (error) {
    return null;
  }
}

function validateKeyFormat(key, type) {
  if (!key) {
    return { valid: false, error: 'Key is empty or not set' };
  }

  const expectedPrefix = type === 'publishable' ? 'pk_' : 'sk_';

  if (!key.startsWith(expectedPrefix)) {
    return {
      valid: false,
      error: `Key should start with '${expectedPrefix}' but starts with '${key.substring(0, 3)}'`
    };
  }

  // Check if test or live
  const isTest = key.includes('_test_');
  const isLive = key.includes('_live_');

  if (!isTest && !isLive) {
    return {
      valid: false,
      error: 'Key should contain "_test_" or "_live_"'
    };
  }

  return {
    valid: true,
    mode: isTest ? 'test' : 'live'
  };
}

async function testStripeConnection(secretKey) {
  try {
    // Dynamically import stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    // Try to retrieve account info
    const account = await stripe.account.retrieve();

    return {
      success: true,
      accountId: account.id,
      accountName: account.business_profile?.name || account.email || 'N/A',
      country: account.country,
      currency: account.default_currency,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', colors.blue);
  log('║              Stripe Key Validation Tool                          ║', colors.blue);
  log('║                 Àpínlẹ̀rọ SaaS Platform                            ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════════════╝', colors.blue);

  const projectRoot = path.join(__dirname, '..');
  const frontendEnvPath = path.join(projectRoot, '.env');
  const backendEnvPath = path.join(projectRoot, 'backend', '.env');

  let allChecksPassed = true;

  // ========================================
  // 1. Check Frontend .env
  // ========================================
  logSection('1. Frontend Configuration (.env)');

  const frontendEnv = loadEnvFile(frontendEnvPath);

  if (!frontendEnv) {
    logCheck('Frontend .env file', 'fail', 'File not found or cannot be read');
    allChecksPassed = false;
  } else {
    logCheck('Frontend .env file', 'pass', 'File exists and readable');

    const publishableKey = frontendEnv.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      logCheck('VITE_STRIPE_PUBLISHABLE_KEY', 'fail', 'Not set in .env file');
      allChecksPassed = false;
    } else {
      const validation = validateKeyFormat(publishableKey, 'publishable');

      if (validation.valid) {
        logCheck('VITE_STRIPE_PUBLISHABLE_KEY', 'pass', `Valid ${validation.mode} mode key`);
        log(`    Preview: ${publishableKey.substring(0, 20)}...`, colors.cyan);
      } else {
        logCheck('VITE_STRIPE_PUBLISHABLE_KEY', 'fail', validation.error);
        allChecksPassed = false;
      }
    }

    const paymentsEnabled = frontendEnv.VITE_ENABLE_STRIPE_PAYMENTS;
    if (paymentsEnabled === 'true') {
      logCheck('VITE_ENABLE_STRIPE_PAYMENTS', 'pass', 'Enabled');
    } else {
      logCheck('VITE_ENABLE_STRIPE_PAYMENTS', 'warn', 'Set to false - payments disabled');
    }
  }

  // ========================================
  // 2. Check Backend .env
  // ========================================
  logSection('2. Backend Configuration (backend/.env)');

  const backendEnv = loadEnvFile(backendEnvPath);

  if (!backendEnv) {
    logCheck('Backend .env file', 'fail', 'File not found or cannot be read');
    allChecksPassed = false;
  } else {
    logCheck('Backend .env file', 'pass', 'File exists and readable');

    const secretKey = backendEnv.STRIPE_SECRET_KEY;

    if (!secretKey) {
      logCheck('STRIPE_SECRET_KEY', 'fail', 'Not set in backend/.env file');
      allChecksPassed = false;
    } else {
      const validation = validateKeyFormat(secretKey, 'secret');

      if (validation.valid) {
        logCheck('STRIPE_SECRET_KEY', 'pass', `Valid ${validation.mode} mode key`);
        log(`    Preview: ${secretKey.substring(0, 20)}...`, colors.cyan);

        // Check mode consistency
        if (frontendEnv?.VITE_STRIPE_PUBLISHABLE_KEY) {
          const pubValidation = validateKeyFormat(frontendEnv.VITE_STRIPE_PUBLISHABLE_KEY, 'publishable');
          if (pubValidation.valid && pubValidation.mode !== validation.mode) {
            logCheck('Mode Consistency', 'fail', `Frontend is ${pubValidation.mode} but backend is ${validation.mode}`);
            allChecksPassed = false;
          } else if (pubValidation.valid) {
            logCheck('Mode Consistency', 'pass', `Both keys are in ${validation.mode} mode`);
          }
        }

        // ========================================
        // 3. Test Stripe API Connection
        // ========================================
        logSection('3. Stripe API Connection Test');

        log('\n  Testing connection to Stripe API...', colors.cyan);
        const connectionResult = await testStripeConnection(secretKey);

        if (connectionResult.success) {
          logCheck('Stripe API Connection', 'pass', 'Successfully connected!');
          log('\n  Account Details:', colors.cyan);
          log(`    • Account ID: ${connectionResult.accountId}`, colors.reset);
          log(`    • Account Name: ${connectionResult.accountName}`, colors.reset);
          log(`    • Country: ${connectionResult.country}`, colors.reset);
          log(`    • Currency: ${connectionResult.currency}`, colors.reset);
        } else {
          logCheck('Stripe API Connection', 'fail', connectionResult.error);
          allChecksPassed = false;
        }
      } else {
        logCheck('STRIPE_SECRET_KEY', 'fail', validation.error);
        allChecksPassed = false;
      }
    }
  }

  // ========================================
  // Summary
  // ========================================
  logSection('Validation Summary');

  if (allChecksPassed) {
    log('\n✅ All checks passed! Your Stripe keys are configured correctly.', colors.green);
    log('\n📋 Next Steps:', colors.cyan);
    log('  1. Restart your application to load the new keys', colors.reset);
    log('  2. Test a payment with card: 4242 4242 4242 4242', colors.reset);
    log('  3. Check Stripe Dashboard for the test payment', colors.reset);
  } else {
    log('\n❌ Some checks failed. Please review the errors above.', colors.red);
    log('\n📋 To Fix:', colors.cyan);
    log('  1. Add missing keys to the .env files', colors.reset);
    log('  2. Ensure keys start with correct prefix (pk_ or sk_)', colors.reset);
    log('  3. Make sure both keys are from same account (test or live)', colors.reset);
    log('  4. Get keys from: https://dashboard.stripe.com/apikeys', colors.reset);
  }

  log('\n' + '═'.repeat(70), colors.blue);

  process.exit(allChecksPassed ? 0 : 1);
}

// Run the script
main().catch(error => {
  log('\n✗ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});
