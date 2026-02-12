#!/usr/bin/env node

/**
 * Token Expiration Checker
 *
 * This script checks all your API tokens and alerts you before they expire.
 * Run it manually or set it up as a cron job to run daily.
 *
 * Usage:
 *   node check-tokens.js
 *   node check-tokens.js --add    (to add a new token)
 *   node check-tokens.js --list   (to list all tokens)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadTokens() {
  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log('Error loading tokens file. Make sure tokens.json exists.', 'red');
    process.exit(1);
  }
}

function saveTokens(data) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
}

function getDaysUntilExpiry(expiresAt) {
  const today = new Date();
  const expiryDate = new Date(expiresAt);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function checkTokens() {
  const data = loadTokens();
  const tokens = data.tokens;

  log('\n========================================', 'blue');
  log('  Token Expiration Check', 'bold');
  log('========================================\n', 'blue');

  let hasExpired = false;
  let hasExpiringSoon = false;

  tokens.forEach((token, index) => {
    const daysLeft = getDaysUntilExpiry(token.expiresAt);
    const warningDays = token.notifyDaysBefore || 7;

    let status = '';
    let statusColor = 'green';

    if (daysLeft < 0) {
      status = '❌ EXPIRED';
      statusColor = 'red';
      hasExpired = true;
    } else if (daysLeft === 0) {
      status = '⚠️  EXPIRES TODAY';
      statusColor = 'red';
      hasExpiringSoon = true;
    } else if (daysLeft <= warningDays) {
      status = `⚠️  EXPIRES IN ${daysLeft} DAY${daysLeft !== 1 ? 'S' : ''}`;
      statusColor = 'yellow';
      hasExpiringSoon = true;
    } else {
      status = `✅ ${daysLeft} days left`;
      statusColor = 'green';
    }

    log(`${index + 1}. ${token.name}`, 'bold');
    log(`   Service: ${token.service}`);
    log(`   Type: ${token.type}`);
    log(`   Expires: ${token.expiresAt}`);
    log(`   Status: ${status}`, statusColor);
    if (token.notes) {
      log(`   Notes: ${token.notes}`, 'blue');
    }
    console.log('');
  });

  // Update last checked time
  data.lastChecked = new Date().toISOString();
  saveTokens(data);

  // Summary
  log('========================================', 'blue');
  if (hasExpired) {
    log('⚠️  ACTION REQUIRED: Some tokens have EXPIRED!', 'red');
    log('   Please renew them immediately.', 'red');
  } else if (hasExpiringSoon) {
    log('⚠️  WARNING: Some tokens are expiring soon!', 'yellow');
    log('   Please renew them before they expire.', 'yellow');
  } else {
    log('✅ All tokens are valid and not expiring soon.', 'green');
  }
  log('========================================\n', 'blue');

  log(`Last checked: ${new Date().toLocaleString()}`, 'blue');
  log(`Total tokens tracked: ${tokens.length}\n`);
}

function listTokens() {
  const data = loadTokens();
  const tokens = data.tokens;

  log('\n========================================', 'blue');
  log('  All Tracked Tokens', 'bold');
  log('========================================\n', 'blue');

  if (tokens.length === 0) {
    log('No tokens tracked yet. Add one with: node check-tokens.js --add\n', 'yellow');
    return;
  }

  tokens.forEach((token, index) => {
    log(`${index + 1}. ${token.name}`, 'bold');
    log(`   ID: ${token.id}`);
    log(`   Service: ${token.service}`);
    log(`   Type: ${token.type}`);
    log(`   Expires: ${token.expiresAt}`);
    log(`   Notify: ${token.notifyDaysBefore} days before`);
    if (token.notes) {
      log(`   Notes: ${token.notes}`, 'blue');
    }
    console.log('');
  });
}

async function addToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  log('\n========================================', 'blue');
  log('  Add New Token', 'bold');
  log('========================================\n', 'blue');

  try {
    const name = await question('Token name (e.g., "Supabase Deployment Token"): ');
    const service = await question('Service (e.g., "Supabase", "Stripe", "AWS"): ');
    const type = await question('Token type (e.g., "API Key", "Access Token", "Secret Key"): ');
    const expiresAt = await question('Expiration date (YYYY-MM-DD): ');
    const notifyDays = await question('Notify how many days before expiry? (default: 7): ');
    const notes = await question('Notes (optional): ');

    const data = loadTokens();
    const tokenId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newToken = {
      id: tokenId,
      name: name.trim(),
      service: service.trim(),
      type: type.trim(),
      expiresAt: expiresAt.trim(),
      notifyDaysBefore: parseInt(notifyDays) || 7,
      status: 'active',
      notes: notes.trim()
    };

    data.tokens.push(newToken);
    saveTokens(data);

    log('\n✅ Token added successfully!', 'green');
    log(`\nRemember to store the actual token securely in:`, 'yellow');
    log(`  - Keychain Access (recommended)`, 'yellow');
    log(`  - Password manager (1Password, Bitwarden, etc.)`, 'yellow');
    log(`\nNEVER store actual token values in tokens.json!\n`, 'red');

  } catch (error) {
    log('\nError adding token: ' + error.message, 'red');
  } finally {
    rl.close();
  }
}

function showHelp() {
  log('\n========================================', 'blue');
  log('  Token Manager - Help', 'bold');
  log('========================================\n', 'blue');

  log('Usage:', 'bold');
  log('  node check-tokens.js          Check all tokens for expiration');
  log('  node check-tokens.js --add    Add a new token to track');
  log('  node check-tokens.js --list   List all tracked tokens');
  log('  node check-tokens.js --help   Show this help message\n');

  log('Examples:', 'bold');
  log('  node check-tokens.js                    # Daily check');
  log('  node check-tokens.js --add              # Add Supabase token');
  log('  node check-tokens.js --list             # View all tokens\n');

  log('Security Note:', 'bold');
  log('  This tool only tracks expiration dates, NOT actual token values.');
  log('  Store actual tokens in Keychain Access or a password manager.\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--add')) {
  addToken();
} else if (args.includes('--list')) {
  listTokens();
} else if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  checkTokens();
}
