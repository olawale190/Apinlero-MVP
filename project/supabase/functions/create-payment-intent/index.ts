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

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
      .select('stripe_secret_key_encrypted')
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

    // Create payment intent using business's Stripe account
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
