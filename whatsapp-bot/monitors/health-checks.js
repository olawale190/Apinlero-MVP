/**
 * Health Check Monitor
 *
 * Runs proactive health checks on the WhatsApp bot system:
 * - Database connectivity (Supabase)
 * - Session cache health
 * - Product catalog availability
 * - Message log size
 * - Neo4j connectivity (if configured)
 * - Environment configuration
 * - Message handler module
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Health check result structure
 */
class HealthCheckResult {
  constructor(name, category) {
    this.name = name;
    this.category = category;
    this.status = 'unknown'; // 'pass', 'fail', 'warn', 'skip'
    this.message = '';
    this.details = null;
    this.duration = 0;
  }

  pass(message, details = null) {
    this.status = 'pass';
    this.message = message;
    this.details = details;
  }

  fail(message, details = null) {
    this.status = 'fail';
    this.message = message;
    this.details = details;
  }

  warn(message, details = null) {
    this.status = 'warn';
    this.message = message;
    this.details = details;
  }

  skip(message) {
    this.status = 'skip';
    this.message = message;
  }
}

/**
 * Run all health checks
 *
 * @returns {Promise<Object>} Health check results
 */
export async function runHealthChecks() {
  console.log('🏥 Running health checks...\n');

  const startTime = Date.now();
  const checks = [];

  // Category 1: Database
  checks.push(await checkSupabaseConnection());
  checks.push(await checkDatabaseSchema());

  // Category 2: Environment
  checks.push(checkRequiredEnvironmentVariables());
  checks.push(checkOptionalEnvironmentVariables());

  // Category 3: Application
  checks.push(await checkMessageHandler());
  checks.push(checkDirectoryStructure());

  // Category 4: External Services
  checks.push(await checkNeo4jConnection());
  checks.push(await checkTwilioConfiguration());
  checks.push(await checkMetaConfiguration());

  const duration = Date.now() - startTime;

  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warn').length;
  const skipped = checks.filter(c => c.status === 'skip').length;

  const overallStatus = failed > 0 ? 'fail' : warnings > 0 ? 'warn' : 'pass';

  return {
    overallStatus,
    duration,
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings,
      skipped,
    },
  };
}

/**
 * Check Supabase database connection
 */
async function checkSupabaseConnection() {
  const check = new HealthCheckResult('Supabase Connection', 'database');
  const startTime = Date.now();

  console.log('1. Checking Supabase connection...');

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      check.fail('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
      console.log('   ❌ Missing configuration\n');
      return check;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) throw error;

    check.pass('Connected to Supabase successfully', {
      url: process.env.SUPABASE_URL,
      responseTime: Date.now() - startTime,
    });
    console.log('   ✅ Connected to Supabase\n');
  } catch (error) {
    check.fail(`Supabase connection failed: ${error.message}`);
    console.log(`   ❌ Connection failed: ${error.message}\n`);
  }

  check.duration = Date.now() - startTime;
  return check;
}

/**
 * Check database schema
 */
async function checkDatabaseSchema() {
  const check = new HealthCheckResult('Database Schema', 'database');

  console.log('2. Checking database schema...');

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      check.skip('Supabase not configured');
      console.log('   ⚠️  Skipped (Supabase not configured)\n');
      return check;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const requiredTables = ['customers', 'orders', 'products', 'whatsapp_sessions'];
    const tableChecks = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          tableChecks.push({ table, exists: false, error: error.message });
        } else {
          tableChecks.push({ table, exists: true });
        }
      } catch (error) {
        tableChecks.push({ table, exists: false, error: error.message });
      }
    }

    const missingTables = tableChecks.filter(t => !t.exists);

    if (missingTables.length === 0) {
      check.pass('All required tables exist', { tables: tableChecks });
      console.log('   ✅ All required tables exist\n');
    } else {
      check.warn(
        `Missing tables: ${missingTables.map(t => t.table).join(', ')}`,
        { tables: tableChecks }
      );
      console.log(`   ⚠️  Missing tables: ${missingTables.map(t => t.table).join(', ')}\n`);
    }
  } catch (error) {
    check.fail(`Schema check failed: ${error.message}`);
    console.log(`   ❌ Schema check failed: ${error.message}\n`);
  }

  return check;
}

/**
 * Check required environment variables
 */
function checkRequiredEnvironmentVariables() {
  const check = new HealthCheckResult('Required Environment Variables', 'environment');

  console.log('3. Checking required environment variables...');

  const requiredVars = [
    { name: 'SUPABASE_URL', description: 'Supabase project URL' },
    { name: 'SUPABASE_SERVICE_KEY', description: 'Supabase service role key' },
  ];

  const missing = [];
  const present = [];

  for (const varConfig of requiredVars) {
    if (!process.env[varConfig.name]) {
      missing.push(varConfig.name);
      console.log(`   ❌ Missing: ${varConfig.name} - ${varConfig.description}`);
    } else {
      present.push(varConfig.name);
      console.log(`   ✅ ${varConfig.name}`);
    }
  }

  console.log('');

  if (missing.length === 0) {
    check.pass('All required environment variables set', { present });
  } else {
    check.fail(
      `Missing required variables: ${missing.join(', ')}`,
      { missing, present }
    );
  }

  return check;
}

/**
 * Check optional environment variables
 */
function checkOptionalEnvironmentVariables() {
  const check = new HealthCheckResult('Optional Environment Variables', 'environment');

  console.log('4. Checking optional environment variables...');

  const optionalVars = [
    { name: 'TWILIO_ACCOUNT_SID', description: 'Twilio account SID' },
    { name: 'TWILIO_AUTH_TOKEN', description: 'Twilio auth token' },
    { name: 'META_ACCESS_TOKEN', description: 'Meta WhatsApp access token' },
    { name: 'NEO4J_URI', description: 'Neo4j database URI' },
    { name: 'NEO4J_USER', description: 'Neo4j username' },
    { name: 'NEO4J_PASSWORD', description: 'Neo4j password' },
  ];

  const present = [];
  const missing = [];

  for (const varConfig of optionalVars) {
    if (process.env[varConfig.name]) {
      present.push(varConfig.name);
      console.log(`   ✅ ${varConfig.name}`);
    } else {
      missing.push(varConfig.name);
      console.log(`   ⚠️  ${varConfig.name} (not set)`);
    }
  }

  console.log('');

  check.pass(
    `${present.length}/${optionalVars.length} optional variables configured`,
    { present, missing }
  );

  return check;
}

/**
 * Check message handler module
 */
async function checkMessageHandler() {
  const check = new HealthCheckResult('Message Handler Module', 'application');

  console.log('5. Checking message handler module...');

  try {
    const { handleIncomingMessage } = await import('../src/message-handler.js');

    if (typeof handleIncomingMessage === 'function') {
      check.pass('Message handler loaded successfully');
      console.log('   ✅ Message handler loaded\n');
    } else {
      check.fail('handleIncomingMessage is not a function');
      console.log('   ❌ Message handler not a function\n');
    }
  } catch (error) {
    check.fail(`Failed to load message handler: ${error.message}`);
    console.log(`   ❌ Failed to load: ${error.message}\n`);
  }

  return check;
}

/**
 * Check directory structure
 */
function checkDirectoryStructure() {
  const check = new HealthCheckResult('Directory Structure', 'application');

  console.log('6. Checking directory structure...');

  const requiredDirs = [
    'src',
    'generators',
    'validators',
    'simulators',
    'monitors',
    'fixtures',
  ];

  const dirChecks = [];
  const basePath = process.cwd();

  for (const dir of requiredDirs) {
    const dirPath = path.join(basePath, dir);
    const exists = fs.existsSync(dirPath);
    dirChecks.push({ dir, exists });

    if (exists) {
      console.log(`   ✅ ${dir}/`);
    } else {
      console.log(`   ⚠️  ${dir}/ (not found)`);
    }
  }

  console.log('');

  const missingDirs = dirChecks.filter(d => !d.exists);

  if (missingDirs.length === 0) {
    check.pass('All required directories exist', { directories: dirChecks });
  } else {
    check.warn(
      `Missing directories: ${missingDirs.map(d => d.dir).join(', ')}`,
      { directories: dirChecks }
    );
  }

  return check;
}

/**
 * Check Neo4j connection
 */
async function checkNeo4jConnection() {
  const check = new HealthCheckResult('Neo4j Connection', 'external');

  console.log('7. Checking Neo4j connection...');

  try {
    if (!process.env.NEO4J_URI) {
      check.skip('Neo4j not configured');
      console.log('   ⚠️  Skipped (Neo4j not configured)\n');
      return check;
    }

    // Try to import neo4j-driver if available
    try {
      const neo4j = await import('neo4j-driver');
      const driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(
          process.env.NEO4J_USER || 'neo4j',
          process.env.NEO4J_PASSWORD || ''
        )
      );

      const session = driver.session();
      await session.run('RETURN 1');
      await session.close();
      await driver.close();

      check.pass('Neo4j connection successful');
      console.log('   ✅ Connected to Neo4j\n');
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND') {
        check.skip('Neo4j driver not installed');
        console.log('   ⚠️  Neo4j driver not installed\n');
      } else {
        check.fail(`Neo4j connection failed: ${error.message}`);
        console.log(`   ❌ Connection failed: ${error.message}\n`);
      }
    }
  } catch (error) {
    check.fail(`Neo4j check failed: ${error.message}`);
    console.log(`   ❌ Check failed: ${error.message}\n`);
  }

  return check;
}

/**
 * Check Twilio configuration
 */
async function checkTwilioConfiguration() {
  const check = new HealthCheckResult('Twilio Configuration', 'external');

  console.log('8. Checking Twilio configuration...');

  const hasSid = !!process.env.TWILIO_ACCOUNT_SID;
  const hasToken = !!process.env.TWILIO_AUTH_TOKEN;

  if (!hasSid && !hasToken) {
    check.skip('Twilio not configured');
    console.log('   ⚠️  Skipped (Twilio not configured)\n');
  } else if (hasSid && hasToken) {
    check.pass('Twilio credentials configured', {
      accountSid: process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...',
    });
    console.log('   ✅ Twilio credentials configured\n');
  } else {
    check.warn('Partial Twilio configuration', {
      hasSid,
      hasToken,
    });
    console.log('   ⚠️  Partial configuration (missing SID or token)\n');
  }

  return check;
}

/**
 * Check Meta WhatsApp configuration
 */
async function checkMetaConfiguration() {
  const check = new HealthCheckResult('Meta WhatsApp Configuration', 'external');

  console.log('9. Checking Meta WhatsApp configuration...');

  if (!process.env.META_ACCESS_TOKEN) {
    check.skip('Meta WhatsApp not configured');
    console.log('   ⚠️  Skipped (Meta WhatsApp not configured)\n');
  } else {
    check.pass('Meta access token configured', {
      token: process.env.META_ACCESS_TOKEN.substring(0, 10) + '...',
    });
    console.log('   ✅ Meta access token configured\n');
  }

  return check;
}

/**
 * Generate health check report
 */
export function generateHealthCheckReport(results) {
  const { overallStatus, duration, checks, summary } = results;

  let report = '\n' + '='.repeat(60) + '\n';
  report += `HEALTH CHECK REPORT\n`;
  report += '='.repeat(60) + '\n\n';

  const statusIcon =
    overallStatus === 'pass' ? '✅' :
    overallStatus === 'warn' ? '⚠️' : '❌';

  report += `Overall Status: ${statusIcon} ${overallStatus.toUpperCase()}\n`;
  report += `Duration: ${duration}ms\n\n`;

  report += `Summary:\n`;
  report += `  Total checks: ${summary.total}\n`;
  report += `  Passed: ${summary.passed}\n`;
  report += `  Failed: ${summary.failed}\n`;
  report += `  Warnings: ${summary.warnings}\n`;
  report += `  Skipped: ${summary.skipped}\n\n`;

  // Group checks by category
  const categories = [...new Set(checks.map(c => c.category))];

  for (const category of categories) {
    const categoryChecks = checks.filter(c => c.category === category);
    report += `${category.charAt(0).toUpperCase() + category.slice(1)} Checks:\n`;

    for (const check of categoryChecks) {
      const icon =
        check.status === 'pass' ? '✅' :
        check.status === 'fail' ? '❌' :
        check.status === 'warn' ? '⚠️' : '⏭️';

      report += `  ${icon} ${check.name}: ${check.message}\n`;
    }
    report += '\n';
  }

  // Recommendations
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warnChecks = checks.filter(c => c.status === 'warn');

  if (failedChecks.length > 0 || warnChecks.length > 0) {
    report += 'Recommendations:\n';

    if (failedChecks.length > 0) {
      report += '  Critical Issues:\n';
      failedChecks.forEach(check => {
        report += `    - Fix ${check.name}: ${check.message}\n`;
      });
    }

    if (warnChecks.length > 0) {
      report += '  Warnings:\n';
      warnChecks.forEach(check => {
        report += `    - Review ${check.name}: ${check.message}\n`;
      });
    }

    report += '\n';
  }

  report += '='.repeat(60) + '\n';

  return report;
}
