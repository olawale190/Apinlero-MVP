/**
 * Supabase Edge Function: Verify Order Total
 *
 * SECURITY: Server-side price verification to prevent client-side manipulation
 * Recalculates order total from product prices in database before payment
 *
 * Deploy: supabase functions deploy verify-order-total
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * SECURITY: Validate origin and return appropriate CORS headers
 * Only allows requests from apinlero.com subdomains
 */
function getCorsHeaders(req: Request): { headers: Record<string, string>; allowed: boolean } {
  const origin = req.headers.get('origin') || '';

  // Allow apinlero.com subdomains and localhost for development
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

interface OrderItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface VerifyRequest {
  businessId: string;
  items: OrderItem[];
  deliveryFee: number;
  clientTotal: number;
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
      items,
      deliveryFee,
      clientTotal,
    }: VerifyRequest = await req.json();

    // Validate required fields
    if (!businessId || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // SECURITY: Fetch actual prices from database
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      // Look up product by name and business_id
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, price, is_active')
        .eq('business_id', businessId)
        .eq('name', item.product_name)
        .eq('is_active', true)
        .single();

      if (error || !product) {
        return new Response(
          JSON.stringify({
            error: `Product not found or inactive: ${item.product_name}`,
            valid: false,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // SECURITY: Use database price, NOT client-provided price
      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        item_total: itemTotal,
      });
    }

    // Calculate server-side total
    const serverTotal = calculatedSubtotal + deliveryFee;

    // SECURITY: Verify totals match (allow 0.01 difference for rounding)
    const totalDifference = Math.abs(serverTotal - clientTotal);
    if (totalDifference > 0.01) {
      return new Response(
        JSON.stringify({
          error: 'Price mismatch detected',
          valid: false,
          clientTotal,
          serverTotal,
          difference: totalDifference,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return verified total
    return new Response(
      JSON.stringify({
        valid: true,
        verifiedTotal: serverTotal,
        subtotal: calculatedSubtotal,
        deliveryFee,
        items: verifiedItems,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying order total:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        valid: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
