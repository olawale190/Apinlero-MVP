/**
 * Environment Variable Validation
 *
 * Validates required environment variables at application startup.
 * Call this function early in app initialization to catch misconfigurations.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    if (!supabaseUrl.includes('supabase.co')) {
      warnings.push(`VITE_SUPABASE_URL may be incorrect: ${supabaseUrl}`);
    }

    // Check we're using the correct project
    const expectedProject = '***REMOVED***';
    if (!supabaseUrl.includes(expectedProject)) {
      errors.push(
        `Supabase project mismatch! Expected ${expectedProject} but got ${supabaseUrl}`
      );
    }
  }

  // Validate anon key format (should be a JWT starting with eyJ)
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.startsWith('eyJ')) {
    warnings.push('VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT');
  }

  // Check for optional but recommended variables
  const optional = ['VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_N8N_WEBHOOK_URL'];
  const missingOptional = optional.filter((key) => !import.meta.env[key]);

  if (missingOptional.length > 0) {
    warnings.push(
      `Optional environment variables not set: ${missingOptional.join(', ')}`
    );
  }

  // Log results
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors);
  }
  if (warnings.length > 0) {
    console.warn('Environment validation warnings:', warnings);
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Environment validation passed');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Strict validation that throws on missing required variables
 * Use this for production builds
 */
export function validateEnvironmentStrict(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    throw new Error(
      `Environment validation failed:\n${result.errors.join('\n')}`
    );
  }
}

/**
 * Check if we're in demo mode (no real Supabase connection)
 */
export function isDemoMode(): boolean {
  return (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('apinlero_demo_mode') === 'true'
  );
}
