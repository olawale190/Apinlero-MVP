#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * Validates that ALL required environment variables are set before starting the app.
 * Run this before starting your development servers to catch missing configs early.
 *
 * Usage:
 *   node scripts/check-env.js
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

// Required variables for each environment
const REQUIRED_VARS = {
  frontend: {
    file: '.env',
    required: [
      {
        name: 'VITE_SUPABASE_URL',
        description: 'Supabase project URL',
        example: 'https://xxx.supabase.co',
      },
      {
        name: 'VITE_SUPABASE_ANON_KEY',
        description: 'Supabase anonymous/public key',
        example: 'eyJhbGci...',
      },
      {
        name: 'VITE_STRIPE_PUBLISHABLE_KEY',
        description: 'Stripe publishable key',
        example: 'pk_test_...',
      },
    ],
    optional: [
      {
        name: 'VITE_ENABLE_STRIPE_PAYMENTS',
        description: 'Enable/disable Stripe payments',
        default: 'true',
      },
    ],
  },
  backend: {
    file: 'backend/.env',
    required: [
      {
        name: 'SUPABASE_URL',
        description: 'Supabase project URL',
        example: 'https://xxx.supabase.co',
      },
      {
        name: 'SUPABASE_ANON_KEY',
        description: 'Supabase anonymous/public key',
        example: 'eyJhbGci...',
      },
      {
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        description: 'Supabase service role key (secret!)',
        example: 'sbp_...',
      },
      {
        name: 'STRIPE_SECRET_KEY',
        description: 'Stripe secret key (secret!)',
        example: 'sk_test_...',
      },
      {
        name: 'DELIVERY_TOKEN_SECRET',
        description: 'Secret for signing delivery link tokens (generate: openssl rand -hex 32)',
        example: 'a1b2c3d4e5f6...',
      },
    ],
    optional: [
      {
        name: 'PORT',
        description: 'Backend server port',
        default: '3001',
      },
      {
        name: 'NODE_ENV',
        description: 'Environment mode',
        default: 'development',
      },
      {
        name: 'FRONTEND_URL',
        description: 'Frontend URL for CORS',
        default: 'http://localhost:5173',
      },
      {
        name: 'STRIPE_WEBHOOK_SECRET',
        description: 'Stripe webhook secret (needed for production)',
        default: 'Not required for development',
      },
    ],
  },
};

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', colors.blue);
  log('║          Environment Variables Validation Tool                   ║', colors.blue);
  log('║                 Àpínlẹ̀rọ SaaS Platform                            ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════════════╝', colors.blue);

  const projectRoot = path.join(__dirname, '..');
  let allChecksPassed = true;
  const missingVars = [];

  // Check Frontend Environment
  logSection('1. Frontend Environment (.env)');

  const frontendEnvPath = path.join(projectRoot, REQUIRED_VARS.frontend.file);
  const frontendEnv = loadEnvFile(frontendEnvPath);

  if (!frontendEnv) {
    logCheck('Frontend .env file', 'fail', 'File not found or cannot be read');
    allChecksPassed = false;
  } else {
    logCheck('Frontend .env file', 'pass', 'File exists and readable');

    // Check required variables
    for (const variable of REQUIRED_VARS.frontend.required) {
      if (!frontendEnv[variable.name] || frontendEnv[variable.name] === '') {
        logCheck(variable.name, 'fail', `Missing! ${variable.description}`);
        missingVars.push({
          file: REQUIRED_VARS.frontend.file,
          name: variable.name,
          description: variable.description,
          example: variable.example,
        });
        allChecksPassed = false;
      } else {
        const preview = frontendEnv[variable.name].substring(0, 20) + '...';
        logCheck(variable.name, 'pass', `Set (${preview})`);
      }
    }

    // Check optional variables
    for (const variable of REQUIRED_VARS.frontend.optional) {
      if (!frontendEnv[variable.name] || frontendEnv[variable.name] === '') {
        logCheck(variable.name, 'warn', `Not set, using default: ${variable.default}`);
      } else {
        logCheck(variable.name, 'pass', `Set to: ${frontendEnv[variable.name]}`);
      }
    }
  }

  // Check Backend Environment
  logSection('2. Backend Environment (backend/.env)');

  const backendEnvPath = path.join(projectRoot, REQUIRED_VARS.backend.file);
  const backendEnv = loadEnvFile(backendEnvPath);

  if (!backendEnv) {
    logCheck('Backend .env file', 'fail', 'File not found or cannot be read');
    allChecksPassed = false;
  } else {
    logCheck('Backend .env file', 'pass', 'File exists and readable');

    // Check required variables
    for (const variable of REQUIRED_VARS.backend.required) {
      if (!backendEnv[variable.name] || backendEnv[variable.name] === '') {
        logCheck(variable.name, 'fail', `Missing! ${variable.description}`);
        missingVars.push({
          file: REQUIRED_VARS.backend.file,
          name: variable.name,
          description: variable.description,
          example: variable.example,
        });
        allChecksPassed = false;
      } else {
        const preview = backendEnv[variable.name].substring(0, 20) + '...';
        logCheck(variable.name, 'pass', `Set (${preview})`);
      }
    }

    // Check optional variables
    for (const variable of REQUIRED_VARS.backend.optional) {
      if (!backendEnv[variable.name] || backendEnv[variable.name] === '') {
        logCheck(variable.name, 'warn', `Not set, using default: ${variable.default}`);
      } else {
        logCheck(variable.name, 'pass', `Set to: ${backendEnv[variable.name]}`);
      }
    }
  }

  // Summary
  logSection('Validation Summary');

  if (allChecksPassed) {
    log('\n✅ All required environment variables are set!', colors.green);
    log('\n📋 You can now start your application:', colors.cyan);
    log('  Terminal 1: cd backend && npm run dev', colors.reset);
    log('  Terminal 2: npm run dev', colors.reset);
  } else {
    log('\n❌ Some required environment variables are missing!', colors.red);
    log('\n📋 Missing Variables:', colors.cyan);

    for (const missing of missingVars) {
      log(`\n  File: ${missing.file}`, colors.yellow);
      log(`  Variable: ${missing.name}`, colors.bold);
      log(`  Description: ${missing.description}`, colors.reset);
      log(`  Example: ${missing.example}`, colors.cyan);
    }

    log('\n📚 How to Fix:', colors.cyan);
    log('  1. Open the .env files listed above', colors.reset);
    log('  2. Add the missing variables', colors.reset);
    log('  3. Get values from:', colors.reset);
    log('     - Supabase: https://supabase.com/dashboard (Settings → API)', colors.reset);
    log('     - Stripe: https://dashboard.stripe.com/apikeys', colors.reset);
    log('  4. Run this script again to verify', colors.reset);
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
