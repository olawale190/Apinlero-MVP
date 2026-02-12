#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates all .env files across the project
 *
 * Usage:
 *   npm run check-env           - Check all environments
 *   npm run check-env -- stripe - Check Stripe vars only
 *   npm run check-env -- supabase - Check Supabase vars only
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse a .env file into key-value pairs
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
  return vars;
}

// Validation rules
const validators = {
  supabase_url: (v) => v && v.startsWith('https://') && v.includes('.supabase.co'),
  supabase_anon_key: (v) => v && v.startsWith('eyJ'),
  supabase_service_role: (v) => v && v.startsWith('eyJ'),
  stripe_publishable: (v) => v && (v.startsWith('pk_test_') || v.startsWith('pk_live_')),
  stripe_secret: (v) => v && (v.startsWith('sk_test_') || v.startsWith('sk_live_')),
  stripe_webhook: (v) => v && v.startsWith('whsec_'),
  resend_key: (v) => v && v.startsWith('re_'),
  anthropic_key: (v) => v && v.startsWith('sk-ant-') && v !== 'sk-ant-your_api_key_here',
  neo4j_uri: (v) => v && v.startsWith('neo4j'),
  url: (v) => v && (v.startsWith('http://') || v.startsWith('https://')),
  not_empty: (v) => v && v.length > 0,
  boolean: (v) => v === 'true' || v === 'false',
  number: (v) => v && !isNaN(parseInt(v)),
};

// Define all environment files and their variables
const envConfigs = [
  {
    name: 'Frontend',
    file: resolve(__dirname, '.env'),
    vars: [
      { key: 'VITE_SUPABASE_URL', validate: validators.supabase_url, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API' },
      { key: 'VITE_SUPABASE_ANON_KEY', validate: validators.supabase_anon_key, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API > anon key' },
      { key: 'VITE_STRIPE_PUBLISHABLE_KEY', validate: validators.stripe_publishable, required: false, category: 'stripe', source: 'Stripe Dashboard > API Keys > Publishable key' },
      { key: 'VITE_ENABLE_STRIPE_PAYMENTS', validate: validators.boolean, required: false, category: 'stripe', source: 'Set to true or false' },
      { key: 'VITE_RESEND_API_KEY', validate: validators.resend_key, required: false, category: 'email', source: 'https://resend.com/api-keys' },
      { key: 'VITE_FROM_EMAIL', validate: validators.not_empty, required: false, category: 'email', source: 'Your sender email address' },
      { key: 'VITE_BUSINESS_EMAIL', validate: validators.not_empty, required: false, category: 'email', source: 'Your business email address' },
      { key: 'VITE_APP_NAME', validate: validators.not_empty, required: false, category: 'app', source: 'Your app display name' },
      { key: 'VITE_APP_URL', validate: validators.url, required: false, category: 'app', source: 'Your app URL' },
      { key: 'VITE_N8N_WEBHOOK_URL', validate: validators.url, required: false, category: 'n8n', source: 'n8n Cloud dashboard' },
      { key: 'VITE_SENTRY_DSN', validate: validators.url, required: false, category: 'monitoring', source: 'https://sentry.io' },
      { key: 'ANTHROPIC_API_KEY', validate: validators.anthropic_key, required: false, category: 'ai', source: 'https://console.anthropic.com/settings/keys' },
    ]
  },
  {
    name: 'Backend',
    file: resolve(__dirname, 'backend', '.env'),
    vars: [
      { key: 'PORT', validate: validators.number, required: false, category: 'server', source: 'Default: 3001' },
      { key: 'NODE_ENV', validate: validators.not_empty, required: false, category: 'server', source: 'development or production' },
      { key: 'FRONTEND_URL', validate: validators.url, required: true, category: 'server', source: 'Your frontend URL for CORS' },
      { key: 'SUPABASE_URL', validate: validators.supabase_url, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API' },
      { key: 'SUPABASE_ANON_KEY', validate: validators.supabase_anon_key, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API > anon key' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', validate: validators.supabase_service_role, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API > service_role key' },
      { key: 'STRIPE_SECRET_KEY', validate: validators.stripe_secret, required: true, category: 'stripe', source: 'Stripe Dashboard > API Keys > Secret key' },
      { key: 'STRIPE_WEBHOOK_SECRET', validate: validators.stripe_webhook, required: true, category: 'stripe', source: 'Stripe Dashboard > Webhooks > endpoint > Signing secret' },
    ]
  },
  {
    name: 'Knowledge Graph',
    file: resolve(__dirname, 'knowledge-graph', '.env'),
    vars: [
      { key: 'NEO4J_URI', validate: validators.neo4j_uri, required: true, category: 'neo4j', source: 'https://console.neo4j.io' },
      { key: 'NEO4J_USER', validate: validators.not_empty, required: true, category: 'neo4j', source: 'Neo4j instance settings' },
      { key: 'NEO4J_PASSWORD', validate: validators.not_empty, required: true, category: 'neo4j', source: 'Neo4j instance settings' },
      { key: 'SUPABASE_URL', validate: validators.supabase_url, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API' },
      { key: 'SUPABASE_SERVICE_KEY', validate: validators.supabase_service_role, required: true, category: 'supabase', source: 'Supabase Dashboard > Settings > API > service_role key' },
    ]
  }
];

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function icon(status) {
  if (status === 'ok') return `${colors.green}✅${colors.reset}`;
  if (status === 'warn') return `${colors.yellow}⚠️${colors.reset}`;
  if (status === 'error') return `${colors.red}❌${colors.reset}`;
  return '  ';
}

// Filter by category if specified
const filterCategory = process.argv[2];

console.log(`\n${colors.bold}🔍 Apinlero Environment Variables Check${colors.reset}\n`);
if (filterCategory) {
  console.log(`${colors.dim}Filtering by: ${filterCategory}${colors.reset}\n`);
}

let totalConfigured = 0;
let totalMissing = 0;
let totalInvalid = 0;
const issues = [];

for (const config of envConfigs) {
  const envVars = parseEnvFile(config.file);

  console.log(`${colors.bold}${colors.cyan}━━━ ${config.name} (${config.file.replace(__dirname + '/', '')}) ━━━${colors.reset}`);

  if (!envVars) {
    console.log(`  ${icon('error')} File not found\n`);
    totalMissing += config.vars.length;
    continue;
  }

  for (const varDef of config.vars) {
    if (filterCategory && varDef.category !== filterCategory) continue;

    const value = envVars[varDef.key];
    const isValid = varDef.validate(value);
    const preview = value
      ? (value.length > 30 ? value.substring(0, 15) + '...' + value.substring(value.length - 5) : value)
      : '';

    if (!value || value === '') {
      if (varDef.required) {
        console.log(`  ${icon('error')} ${varDef.key} ${colors.red}MISSING${colors.reset} ${colors.dim}(${varDef.source})${colors.reset}`);
        totalMissing++;
        issues.push({ env: config.name, key: varDef.key, issue: 'Missing', source: varDef.source, severity: 'critical' });
      } else {
        console.log(`  ${icon('warn')} ${varDef.key} ${colors.yellow}not set${colors.reset} ${colors.dim}(optional)${colors.reset}`);
      }
    } else if (!isValid) {
      console.log(`  ${icon('warn')} ${varDef.key} ${colors.yellow}INVALID FORMAT${colors.reset} ${colors.dim}(${preview})${colors.reset}`);
      totalInvalid++;
      issues.push({ env: config.name, key: varDef.key, issue: 'Invalid format', source: varDef.source, severity: 'warning' });
    } else {
      console.log(`  ${icon('ok')} ${varDef.key} ${colors.dim}${preview}${colors.reset}`);
      totalConfigured++;
    }
  }
  console.log();
}

// Summary
console.log(`${colors.bold}━━━ Summary ━━━${colors.reset}`);
console.log(`  ${colors.green}✅ Configured: ${totalConfigured}${colors.reset}`);
if (totalInvalid > 0) console.log(`  ${colors.yellow}⚠️  Invalid:    ${totalInvalid}${colors.reset}`);
if (totalMissing > 0) console.log(`  ${colors.red}❌ Missing:    ${totalMissing}${colors.reset}`);
console.log();

// Show issues
if (issues.length > 0) {
  console.log(`${colors.bold}${colors.red}Issues to fix:${colors.reset}\n`);
  issues.forEach((issue, i) => {
    const sev = issue.severity === 'critical' ? colors.red : colors.yellow;
    console.log(`  ${i + 1}. ${sev}[${issue.env}]${colors.reset} ${issue.key}: ${issue.issue}`);
    console.log(`     ${colors.dim}Get from: ${issue.source}${colors.reset}`);
  });
  console.log();
}

// Exit code
if (totalMissing > 0) {
  console.log(`${colors.red}Fix the missing required variables above before deploying.${colors.reset}\n`);
  process.exit(1);
} else if (totalInvalid > 0) {
  console.log(`${colors.yellow}Fix the invalid variables above for full functionality.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.green}All required credentials are configured!${colors.reset}\n`);
  process.exit(0);
}
