/**
 * Supabase Edge Function: add-business-claims
 *
 * Purpose: Add business_id to JWT access token claims
 * Triggered: On user sign-in/token refresh (auth.users.identity_token hook)
 *
 * This function is called automatically by Supabase Auth to customize JWT tokens
 * with the user's business_id, enabling secure multi-tenant authorization.
 *
 * Setup Instructions:
 * 1. Deploy: supabase functions deploy add-business-claims
 * 2. Set secrets: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
 * 3. Enable hook in Supabase Dashboard:
 *    - Go to Database > Hooks
 *    - Create hook for: auth.users table
 *    - Event: INSERT, UPDATE
 *    - Function: add-business-claims
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    email: string;
    [key: string]: any;
  };
  schema: string;
  old_record: any;
}

interface JWTClaims {
  business_id?: string;
  business_ids?: string[];
  role?: string;
  [key: string]: any;
}

serve(async (req) => {
  try {
    // CORS headers for Edge Function
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', payload.type, payload.table);

    // Validate it's a user event
    if (payload.table !== 'users' || !payload.record?.id) {
      console.warn('Invalid payload - not a user event');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = payload.record.id;
    console.log('Processing user:', userId);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to get user's business_id
    const { data: businessId, error: businessError } = await supabase
      .rpc('get_user_business_id', { user_uuid: userId });

    if (businessError) {
      console.error('Error fetching business_id:', businessError);
    }

    // Call the database function to get all business_ids
    const { data: businessIds, error: businessIdsError } = await supabase
      .rpc('get_user_business_ids', { user_uuid: userId });

    if (businessIdsError) {
      console.error('Error fetching business_ids:', businessIdsError);
    }

    // Build custom claims
    const claims: JWTClaims = {};

    if (businessId) {
      claims.business_id = businessId;
      console.log('✅ Added business_id to claims:', businessId);
    } else {
      console.warn('⚠️ User has no associated business');
    }

    if (businessIds && businessIds.length > 0) {
      claims.business_ids = businessIds;
      claims.business_count = businessIds.length;
      console.log('✅ Added business_ids to claims:', businessIds.length, 'businesses');
    }

    // Get user's role from user_businesses (for the primary business)
    if (businessId) {
      const { data: userBusiness, error: roleError } = await supabase
        .from('user_businesses')
        .select('role')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single();

      if (!roleError && userBusiness) {
        claims.business_role = userBusiness.role;
        console.log('✅ Added business_role to claims:', userBusiness.role);
      }
    }

    // Return the custom claims
    // Supabase will merge these into the JWT token
    return new Response(
      JSON.stringify({
        claims,
        user_id: userId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * TESTING THIS FUNCTION:
 *
 * 1. Test locally with Supabase CLI:
 *    supabase functions serve add-business-claims
 *
 * 2. Send test request:
 *    curl -i --location --request POST 'http://localhost:54321/functions/v1/add-business-claims' \
 *      --header 'Authorization: Bearer YOUR_ANON_KEY' \
 *      --header 'Content-Type: application/json' \
 *      --data '{"type":"INSERT","table":"users","record":{"id":"test-user-id","email":"test@example.com"}}'
 *
 * 3. Deploy to production:
 *    supabase functions deploy add-business-claims
 *
 * 4. Verify JWT contains business_id:
 *    - Sign in to your app
 *    - Decode the access_token JWT at jwt.io
 *    - Check for business_id in the claims
 */
