#!/usr/bin/env node

/**
 * Pre-Deployment Checklist
 * Run this before deploying to catch common issues
 *
 * Usage: node scripts/pre-deploy-check.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const checks = [];
let failedChecks = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(name, fn) {
  checks.push({ name, fn });
}

function runCheck(name, fn) {
  try {
    const result = fn();
    if (result === false) {
      log(`✗ ${name}`, 'red');
      failedChecks++;
      return false;
    } else {
      log(`✓ ${name}`, 'green');
      return true;
    }
  } catch (err) {
    log(`✗ ${name}: ${err.message}`, 'red');
    failedChecks++;
    return false;
  }
}

// ============================================
// CHECKS
// ============================================

check('Environment variables exist', () => {
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envContent = readFileSync(envPath, 'utf8');
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  for (const key of required) {
    if (!envContent.includes(key)) {
      throw new Error(`Missing ${key} in .env`);
    }
  }

  return true;
});

check('TypeScript compiles without errors', () => {
  try {
    execSync('npx tsc --noEmit', { cwd: projectRoot, stdio: 'pipe' });
    return true;
  } catch (err) {
    log('  TypeScript errors found. Run `npx tsc --noEmit` to see details.', 'yellow');
    return false;
  }
});

check('Build succeeds', () => {
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    return true;
  } catch (err) {
    throw new Error('Build failed. Run `npm run build` to see details.');
  }
});

check('No console.error in production code', () => {
  const srcFiles = execSync('find src -name "*.tsx" -o -name "*.ts"', {
    cwd: projectRoot,
    encoding: 'utf8'
  }).trim().split('\n');

  const errors = [];
  for (const file of srcFiles) {
    const content = readFileSync(join(projectRoot, file), 'utf8');
    // Allow console.error in error handlers, but flag standalone ones
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('console.error') && !line.includes('// OK') && !line.includes('catch')) {
        errors.push(`${file}:${i + 1}`);
      }
    });
  }

  if (errors.length > 0) {
    log(`  Found console.error in: ${errors.join(', ')}`, 'yellow');
    log('  Consider using proper error tracking instead', 'yellow');
  }

  return true; // Warning only, not failure
});

check('Database migrations are tracked', () => {
  const migrationsDir = join(projectRoot, 'supabase/migrations');
  if (!existsSync(migrationsDir)) {
    throw new Error('supabase/migrations directory not found');
  }

  const migrations = execSync('ls -1 supabase/migrations/*.sql 2>/dev/null || echo ""', {
    cwd: projectRoot,
    encoding: 'utf8'
  }).trim();

  if (!migrations) {
    log('  No migration files found (this might be OK for initial setup)', 'yellow');
  } else {
    log(`  Found ${migrations.split('\n').length} migration files`, 'blue');
  }

  return true;
});

check('Performance monitoring is imported in App.tsx', () => {
  const appPath = join(projectRoot, 'src/App.tsx');
  const content = readFileSync(appPath, 'utf8');

  if (!content.includes('performance-monitor')) {
    log('  Warning: performance-monitor not imported in App.tsx', 'yellow');
    log('  Add: import { performanceMonitor } from \'./lib/performance-monitor\'', 'yellow');
    return true; // Warning only
  }

  return true;
});

check('Health check is set up', () => {
  const healthCheckPath = join(projectRoot, 'src/lib/health-check.ts');
  if (!existsSync(healthCheckPath)) {
    log('  Warning: health-check.ts not found', 'yellow');
    return true; // Warning only
  }

  return true;
});

check('Git working directory is clean', () => {
  try {
    const status = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf8'
    }).trim();

    if (status) {
      log('  Uncommitted changes found:', 'yellow');
      log(status.split('\n').map(l => `    ${l}`).join('\n'), 'yellow');
      log('  Consider committing before deploying', 'yellow');
    }

    return true; // Warning only
  } catch (err) {
    // Not a git repo or git not installed
    return true;
  }
});

check('No TODO or FIXME comments in critical files', () => {
  const criticalFiles = [
    'src/lib/business-resolver.ts',
    'src/contexts/BusinessContext.tsx',
    'src/lib/supabase.ts'
  ];

  const todos = [];
  for (const file of criticalFiles) {
    const fullPath = join(projectRoot, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('TODO') || line.includes('FIXME')) {
          todos.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }

  if (todos.length > 0) {
    log('  Found TODOs/FIXMEs in critical files:', 'yellow');
    todos.forEach(t => log(`    ${t}`, 'yellow'));
  }

  return true; // Warning only
});

// ============================================
// RUN ALL CHECKS
// ============================================

log('\n🔍 Running Pre-Deployment Checks...\n', 'blue');

for (const { name, fn } of checks) {
  runCheck(name, fn);
}

log('\n' + '='.repeat(50), 'blue');

if (failedChecks > 0) {
  log(`\n❌ ${failedChecks} check(s) failed. Fix issues before deploying.\n`, 'red');
  process.exit(1);
} else {
  log('\n✅ All checks passed! Safe to deploy.\n', 'green');
  process.exit(0);
}
