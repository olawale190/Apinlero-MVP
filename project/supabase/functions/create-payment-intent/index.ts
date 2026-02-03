/**
 * Supabase Edge Function: Create Payment Intent (Per-Business Accounts)
 *
 * Creates a Stripe Payment Intent using the business's own Stripe account.
 * Supports Option A: Per-Business Stripe Accounts architecture.
 *
 * This runs server-side to keep Stripe secret keys secure.
 *
 * Deploy: supabase functions deploy create-payment-intent
 * Note: No STRIPE_SECRET_KEY env var needed - uses per-business keys from database
 */

import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * SECURITY: Validate origin and return appropriate CORS headers
 * Only allows requests from apinlero.com subdomains
 */
function getCorsHeaders(req: Request): { headers: Record<string, string>; allowed: boolean } {
  const origin = req.headers.get('origin') || '';

  // Allow apinlero.com subdomains (e.g., ishas-treat.apinlero.com, app.apinlero.com)
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

interface PaymentIntentRequest {
  businessId: string;  // NEW: Which business's Stripe account to use
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
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
      JSON.stringify({ error: 'Origin not allowed' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const {
      businessId,
      amount,
      currency = 'gbp',
      orderId,
      customerEmail,
      customerName,
      description,
    }: PaymentIntentRequest = await req.json();

    // Validate businessId
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'businessId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch business's Stripe secret key from database
    const { data: business, error: dbError } = await supabase
      .from('businesses')
      .select('stripe_secret_key_encrypted, owner_email')
      .eq('id', businessId)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // SECURITY: Verify the authenticated user owns this business
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user owns this business
    if (user.email !== business.owner_email) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - You do not own this business' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!business?.stripe_secret_key_encrypted) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured for this business' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Decrypt the secret key if you implement encryption
    // For now, we're storing it directly (INSECURE - implement encryption!)
    const stripeSecretKey = business.stripe_secret_key_encrypted;

    // Validate Stripe key format
    if (!stripeSecretKey.startsWith('sk_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Stripe key configuration' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Stripe with business's secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Minimum charge validation (Stripe minimum is 30p for GBP)
    const minimumCharge = 30; // pence
    const amountInPence = Math.round(amount * 100);

    if (amountInPence < minimumCharge) {
      return new Response(
        JSON.stringify({ error: 'Minimum payment amount is £0.30' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // SECURITY: Maximum charge validation to prevent abuse
    const maximumCharge = 10000 * 100; // £10,000 in pence
    if (amountInPence > maximumCharge) {
      return new Response(
        JSON.stringify({ error: 'Payment exceeds maximum allowed amount of £10,000' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create payment intent using business's Stripe account
    // Use orderId as idempotency key to prevent duplicate charges
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      metadata: {
        businessId,     // Track which business this payment is for
        orderId,
        customerName: customerName || '',
        source: 'apinlero',
      },
      description: description || `Order ${orderId}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      idempotencyKey: `payment_intent_${orderId}`, // Prevent duplicate payment intents
    });

    console.log(`Payment intent created: ${paymentIntent.id} for business ${businessId}, order ${orderId}`);

    // Return client secret
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          type: error.type,
          code: error.code,
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
