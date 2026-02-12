#!/usr/bin/env node

/**
 * Stripe Test Payment Script
 *
 * Quick script to test Stripe payment creation without running the full app.
 * Useful for verifying your Stripe keys work correctly.
 *
 * Usage:
 *   node scripts/test-payment.js
 *
 * What it does:
 * 1. Loads your Stripe secret key from backend/.env
 * 2. Creates a test payment intent for £10
 * 3. Shows you the client secret for frontend use
 * 4. Provides test card numbers for completing the payment
 */

const fs = require('fs');
const path = require('path');

// Colors
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

async function createTestPayment(secretKey) {
  try {
    // Dynamically import stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    log('\n📝 Creating test payment intent...', colors.cyan);

    // Create a payment intent for £10
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // £10.00 in pence
      currency: 'gbp',
      description: 'Test payment from Apinlero',
      metadata: {
        orderId: `TEST-${Date.now()}`,
        source: 'test-script',
      },
    });

    return {
      success: true,
      paymentIntent,
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
  log('║             Stripe Test Payment Script                           ║', colors.blue);
  log('║              Àpínlẹ̀rọ SaaS Platform                               ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════════════╝', colors.blue);

  const projectRoot = path.join(__dirname, '..');
  const backendEnvPath = path.join(projectRoot, 'backend', '.env');

  // Load backend environment
  log('\n📂 Loading configuration...', colors.cyan);
  const backendEnv = loadEnvFile(backendEnvPath);

  if (!backendEnv) {
    log('❌ Error: Cannot read backend/.env file', colors.red);
    log('Make sure the file exists at: ' + backendEnvPath, colors.reset);
    process.exit(1);
  }

  const secretKey = backendEnv.STRIPE_SECRET_KEY;

  if (!secretKey) {
    log('❌ Error: STRIPE_SECRET_KEY not set in backend/.env', colors.red);
    log('\nTo fix this:', colors.yellow);
    log('  1. Get your Stripe secret key from: https://dashboard.stripe.com/apikeys', colors.reset);
    log('  2. Add it to backend/.env:', colors.reset);
    log('     STRIPE_SECRET_KEY=sk_test_your_key_here', colors.cyan);
    process.exit(1);
  }

  if (!secretKey.startsWith('sk_')) {
    log('❌ Error: STRIPE_SECRET_KEY has invalid format', colors.red);
    log('Expected to start with "sk_test_" or "sk_live_"', colors.reset);
    process.exit(1);
  }

  const isTestMode = secretKey.includes('_test_');
  log(`✓ Stripe key loaded (${isTestMode ? 'TEST' : 'LIVE'} mode)`, colors.green);

  // Create test payment
  const result = await createTestPayment(secretKey);

  if (!result.success) {
    log('\n❌ Failed to create payment intent:', colors.red);
    log(result.error, colors.reset);
    log('\nPossible issues:', colors.yellow);
    log('  • Invalid Stripe secret key', colors.reset);
    log('  • Network connection problem', colors.reset);
    log('  • Stripe account not activated', colors.reset);
    process.exit(1);
  }

  const { paymentIntent } = result;

  log('\n✅ Payment intent created successfully!', colors.green);
  log('\n═══════════════════════════════════════════════════════════════════', colors.blue);
  log('  Payment Details', colors.bold + colors.blue);
  log('═══════════════════════════════════════════════════════════════════', colors.blue);

  log(`\n  Payment Intent ID: ${paymentIntent.id}`, colors.cyan);
  log(`  Amount: £${(paymentIntent.amount / 100).toFixed(2)}`, colors.cyan);
  log(`  Currency: ${paymentIntent.currency.toUpperCase()}`, colors.cyan);
  log(`  Status: ${paymentIntent.status}`, colors.cyan);
  log(`  Client Secret: ${paymentIntent.client_secret}`, colors.cyan);

  log('\n═══════════════════════════════════════════════════════════════════', colors.blue);
  log('  How to Complete This Payment', colors.bold + colors.blue);
  log('═══════════════════════════════════════════════════════════════════', colors.blue);

  log('\n📋 Test Card Numbers:', colors.green);
  log('  Success:  4242 4242 4242 4242', colors.reset);
  log('  Decline:  4000 0000 0000 0002', colors.reset);
  log('  3D Secure: 4000 0025 0000 3155', colors.reset);
  log('  Expiry:   Any future date (e.g., 12/34)', colors.reset);
  log('  CVC:      Any 3 digits (e.g., 123)', colors.reset);

  log('\n🌐 Test in Stripe Dashboard:', colors.cyan);
  log('  https://dashboard.stripe.com/test/payments', colors.reset);

  log('\n💡 Using the Client Secret:', colors.cyan);
  log('  1. Copy the client secret above', colors.reset);
  log('  2. Use it in your frontend checkout form', colors.reset);
  log('  3. Or test directly in Stripe Dashboard', colors.reset);

  if (isTestMode) {
    log('\n⚠️  TEST MODE', colors.yellow);
    log('  No real money will be charged', colors.reset);
    log('  Use test card numbers above', colors.reset);
  } else {
    log('\n⚠️  LIVE MODE - REAL CHARGES!', colors.red);
    log('  Real credit cards will be charged!', colors.reset);
    log('  Money will be transferred to your account!', colors.reset);
  }

  log('\n═══════════════════════════════════════════════════════════════════\n', colors.blue);
}

// Run the script
main().catch(error => {
  log('\n✗ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});
