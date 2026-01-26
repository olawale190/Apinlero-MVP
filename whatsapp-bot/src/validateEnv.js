/**
 * Environment Variable Validation for WhatsApp Bot Backend
 *
 * Validates required environment variables at server startup.
 * Exits with error code 1 if critical variables are missing.
 */

export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Core required variables
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (supabaseUrl) {
    if (!supabaseUrl.includes('supabase.co')) {
      warnings.push(`SUPABASE_URL may be incorrect: ${supabaseUrl}`);
    }

    // Check we're using the correct project
    const expectedProject = 'gafoezdpaotwvpfldyhc';
    if (!supabaseUrl.includes(expectedProject)) {
      errors.push(
        `Supabase project mismatch! Expected ${expectedProject} but got ${supabaseUrl}`
      );
    }
  }

  // Validate service key (should be a JWT starting with eyJ and be longer than anon key)
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    if (!serviceKey.startsWith('eyJ')) {
      errors.push('SUPABASE_SERVICE_KEY does not appear to be a valid JWT');
    }
    // Service keys are typically longer than anon keys
    if (serviceKey.length < 200) {
      warnings.push(
        'SUPABASE_SERVICE_KEY appears short - ensure you are using the service_role key, not anon key'
      );
    }
  }

  // Check WhatsApp provider configuration
  const hasTwilio =
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
  const hasMeta =
    process.env.META_PHONE_NUMBER_ID && process.env.META_ACCESS_TOKEN;

  if (!hasTwilio && !hasMeta) {
    warnings.push(
      'No WhatsApp provider configured. Set either Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) or Meta (META_PHONE_NUMBER_ID, META_ACCESS_TOKEN) credentials.'
    );
  }

  // Check Neo4j configuration (optional but recommended for product matching)
  const hasNeo4j =
    process.env.NEO4J_URI &&
    process.env.NEO4J_USER &&
    process.env.NEO4J_PASSWORD;
  if (!hasNeo4j) {
    warnings.push(
      'Neo4j not configured. Product alias matching will use fallback logic. Set NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD for enhanced matching.'
    );
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach((error) => console.error(`   - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
  } else if (errors.length === 0) {
    console.log('✅ Environment validation passed with warnings');
  }

  // Exit if there are critical errors
  if (errors.length > 0) {
    console.error('\n❌ Cannot start server with missing/invalid environment variables.');
    console.error('   Please check your .env file or Railway environment variables.\n');
    process.exit(1);
  }

  return { valid: true, warnings };
}

/**
 * Get configured WhatsApp provider
 */
export function getWhatsAppProvider() {
  if (process.env.META_PHONE_NUMBER_ID && process.env.META_ACCESS_TOKEN) {
    return 'meta';
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return 'twilio';
  }
  return null;
}

/**
 * Check if Neo4j is configured
 */
export function isNeo4jConfigured() {
  return !!(
    process.env.NEO4J_URI &&
    process.env.NEO4J_USER &&
    process.env.NEO4J_PASSWORD
  );
}
