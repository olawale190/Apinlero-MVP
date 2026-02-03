/**
 * Supabase Edge Function: Test Stripe Connection
 *
 * Tests if provided Stripe API keys are valid before saving them.
 * Returns account information if successful.
 *
 * Deploy: supabase functions deploy test-stripe-connection
 */

import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

/**
 * SECURITY: Validate origin and return appropriate CORS headers
 * Only allows requests from apinlero.com subdomains
 */
function getCorsHeaders(req: Request): { headers: Record<string, string>; allowed: boolean } {
  const origin = req.headers.get('origin') || '';

  // Allow apinlero.com subdomains (e.g., app.apinlero.com)
  // Also allow localhost for development
  const isAllowed = /^https:\/\/[\w-]+\.apinlero\.com$/.test(origin) ||
                    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
                    /^https:\/\/apinlero\.com$/.test(origin);

  if (!isAllowed) {
    return {
      headers: {},
      allowed: false
    };
  }

  return {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    allowed: true
  };
}

interface TestRequest {
  publishableKey: string;
  secretKey: string;
}

Deno.serve(async (req: Request) => {
  // SECURITY: Validate CORS origin
  const { headers: corsHeaders, allowed } = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Block requests from unauthorized origins
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Origin not allowed' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const { publishableKey, secretKey }: TestRequest = await req.json();

    // Validate keys are provided
    if (!publishableKey || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing API keys' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate key formats
    if (!publishableKey.startsWith('pk_')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!secretKey.startsWith('sk_')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid secret key format. Must start with sk_test_ or sk_live_',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if keys match (both test or both live)
    const pubIsTest = publishableKey.includes('_test_');
    const secIsTest = secretKey.includes('_test_');

    if (pubIsTest !== secIsTest) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Keys mismatch: One is test mode and one is live mode. Both must match.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Test the connection by retrieving account information
    const account = await stripe.account.retrieve();

    // Return success with account details
    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        accountName: account.business_profile?.name || account.email || 'Unknown',
        country: account.country,
        currency: account.default_currency,
        testMode: pubIsTest,
        message: 'Stripe connection successful!',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error testing Stripe connection:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API keys. Please check your Stripe dashboard.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
