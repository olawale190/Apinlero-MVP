#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Verifies all required environment variables are set
 */

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_NAME',
  'VITE_APP_URL'
];

const optionalVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_ENABLE_STRIPE_PAYMENTS',
  'VITE_ENABLE_NOTIFICATIONS',
  'VITE_SENTRY_DSN',
  'VITE_N8N_WEBHOOK_URL',
  'VITE_API_URL'
];

console.log('\n🔍 Checking Environment Variables...\n');

let hasErrors = false;

console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === 'undefined' || value === 'your_*') {
    console.log(`  ❌ ${varName} - MISSING or INVALID`);
    hasErrors = true;
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`  ✅ ${varName} - ${preview}`);
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === 'undefined') {
    console.log(`  ⚠️  ${varName} - Not set (optional)`);
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`  ✅ ${varName} - ${preview}`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ ERRORS FOUND: Some required environment variables are missing!');
  console.log('\nTo fix:');
  console.log('1. Check your .env file in the project root');
  console.log('2. Copy .env.example to .env if you haven\'t');
  console.log('3. Fill in all required values');
  console.log('4. For Vercel deployment, set these in Vercel dashboard:');
  console.log('   https://vercel.com/apinlero/project/settings/environment-variables\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  process.exit(0);
}
