/**
 * Supabase Edge Function: Save Stripe Configuration
 *
 * SECURITY: Handles Stripe key encryption server-side
 * - Encrypts secret keys with AES-256-GCM before storage
 * - Validates user owns the business before saving
 * - Never exposes decrypted keys to the client
 *
 * Deploy: supabase functions deploy save-stripe-config
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { encryptStripeKey } from '../_shared/crypto.ts';

/**
 * SECURITY: Validate origin and return appropriate CORS headers
 */
function getCorsHeaders(req: Request): { headers: Record<string, string>; allowed: boolean } {
  const origin = req.headers.get('origin') || '';

  const isAllowed = /^https:\/\/[\w-]+\.apinlero\.com$/.test(origin) ||
                    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
                    /^https:\/\/apinlero\.com$/.test(origin);

  if (!isAllowed) {
    return { headers: {}, allowed: false };
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

interface SaveConfigRequest {
  businessId: string;
  publishableKey?: string;
  secretKey?: string;
  accountId?: string | null;
  webhookSecret?: string | null;
  disconnect?: boolean;
}

Deno.serve(async (req: Request) => {
  const { headers: corsHeaders, allowed } = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const {
      businessId,
      publishableKey,
      secretKey,
      accountId,
      webhookSecret,
      disconnect
    }: SaveConfigRequest = await req.json();

    if (!businessId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Business ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify the authenticated user owns this business
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch business to verify ownership
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, owner_email')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return new Response(
        JSON.stringify({ success: false, error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this business
    if (user.email !== business.owner_email) {
      console.warn(`Unauthorized Stripe config attempt: ${user.email} tried to modify ${businessId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'You do not have permission to modify this business' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle disconnect request
    if (disconnect) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          stripe_publishable_key: null,
          stripe_secret_key_encrypted: null,
          stripe_account_id: null,
          stripe_webhook_secret: null,
          stripe_connected_at: null,
        })
        .eq('id', businessId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Stripe disconnected for business ${businessId} by ${user.email}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Stripe disconnected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate publishable key
    if (publishableKey && !publishableKey.startsWith('pk_')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid publishable key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      stripe_connected_at: new Date().toISOString(),
    };

    if (publishableKey) {
      updateData.stripe_publishable_key = publishableKey;
    }

    if (accountId !== undefined) {
      updateData.stripe_account_id = accountId;
    }

    if (webhookSecret !== undefined) {
      updateData.stripe_webhook_secret = webhookSecret;
    }

    // SECURITY: Encrypt secret key before storing
    if (secretKey) {
      if (!secretKey.startsWith('sk_')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid secret key format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const encryptedKey = await encryptStripeKey(secretKey);
        updateData.stripe_secret_key_encrypted = encryptedKey;
        console.log(`Stripe secret key encrypted for business ${businessId}`);
      } catch (encryptError) {
        console.error('Encryption failed:', encryptError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to secure Stripe key. Contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update the business record
    const { error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId);

    if (updateError) {
      console.error('Database update failed:', updateError);
      throw updateError;
    }

    console.log(`Stripe config saved for business ${businessId} by ${user.email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Stripe configuration saved securely' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error saving Stripe config:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
