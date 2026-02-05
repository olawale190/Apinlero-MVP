/**
 * Supabase Edge Function: Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment processing.
 * Updates order status in database when payments succeed or fail.
 *
 * Deploy: supabase functions deploy stripe-webhook
 * Set secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * Configure in Stripe Dashboard:
 *   Webhook URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *   Events: payment_intent.succeeded, payment_intent.payment_failed
 */

import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

/**
 * SECURITY: Webhook endpoints should NOT use CORS
 * Webhooks are server-to-server calls from Stripe, not browser requests
 * Removing CORS headers prevents CSRF attacks
 */
const corsHeaders = {
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get secrets
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize clients
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Stripe event received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        console.log(`Payment succeeded for order ${orderId}`);

        if (orderId) {
          // Fetch order details before updating (needed for WhatsApp notification)
          const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('phone_number, customer_name, total, business_id')
            .eq('id', orderId)
            .single();

          if (fetchError) {
            console.error('Error fetching order:', fetchError);
          }

          // Update order status
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'Confirmed',
              payment_status: 'paid',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (orderError) {
            console.error('Error updating order:', orderError);
          }

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              order_id: orderId,
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              status: 'succeeded',
              payment_method: paymentIntent.payment_method_types[0] || 'card',
              created_at: new Date().toISOString(),
            });

          if (paymentError) {
            console.error('Error creating payment record:', paymentError);
          }

          console.log(`Order ${orderId} marked as paid`);

          // Send WhatsApp confirmation (non-blocking)
          if (order && order.phone_number && order.business_id) {
            try {
              // Fetch WhatsApp config for this business
              const { data: whatsappConfig, error: configError } = await supabase
                .from('whatsapp_configs')
                .select('phone_number_id, access_token')
                .eq('business_id', order.business_id)
                .single();

              if (configError || !whatsappConfig) {
                console.warn(`WhatsApp not configured for business ${order.business_id}`);
              } else if (whatsappConfig.phone_number_id && whatsappConfig.access_token) {
                await sendWhatsAppPaymentConfirmation(
                  whatsappConfig.phone_number_id,
                  whatsappConfig.access_token,
                  order.phone_number,
                  orderId,
                  order.total,
                  order.customer_name || 'Customer'
                );
              } else {
                console.warn(`WhatsApp credentials incomplete for business ${order.business_id}`);
              }
            } catch (error) {
              console.error('WhatsApp notification failed:', error);
              // Don't fail the webhook - payment already succeeded
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        console.log(`Payment failed for order ${orderId}`);

        if (orderId) {
          // Update order with failed payment
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              payment_error: paymentIntent.last_payment_error?.message || 'Payment failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) {
            console.error('Error updating order:', error);
          }

          // Create failed payment record
          await supabase
            .from('payments')
            .insert({
              order_id: orderId,
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              status: 'failed',
              error_message: paymentIntent.last_payment_error?.message,
              created_at: new Date().toISOString(),
            });
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        console.log(`Refund processed for payment ${paymentIntentId}`);

        // Find order by payment intent
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_intent_id', paymentIntentId)
          .limit(1);

        if (orders && orders.length > 0) {
          const orderId = orders[0].id;

          await supabase
            .from('orders')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          await supabase
            .from('payments')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
            })
            .eq('payment_intent_id', paymentIntentId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
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

/**
 * Send WhatsApp payment confirmation to customer
 */
async function sendWhatsAppPaymentConfirmation(
  phoneNumberId: string,
  accessToken: string,
  customerPhone: string,
  orderId: string,
  total: number,
  customerName: string
): Promise<void> {
  const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

  // Clean phone number (remove +, spaces, whatsapp: prefix, etc.)
  const cleanPhone = customerPhone.replace(/\D/g, '');

  // Format message
  const message = `✅ Payment Confirmed!\n\nOrder #: ${orderId.substring(0, 8).toUpperCase()}\nAmount: £${total.toFixed(2)} paid by card\nStatus: Confirmed\n\nWe're preparing your order now!\n\nQuestions? Just reply to this message.`;

  try {
    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data.error);
      throw new Error(data.error?.message || 'WhatsApp API failed');
    }

    console.log(`✅ WhatsApp confirmation sent to ${customerName} (${cleanPhone}): ${data.messages?.[0]?.id}`);

  } catch (error) {
    console.error('Failed to send WhatsApp confirmation:', error);
    // Don't throw - we don't want to fail the webhook
  }
}
