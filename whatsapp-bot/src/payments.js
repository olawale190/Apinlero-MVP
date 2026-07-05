/**
 * Stripe payments — card-only for the Àpínlẹ̀rọ WhatsApp bot.
 *
 * Flow:
 *   1. On order confirmation we create a Stripe Checkout Session and send the
 *      customer its hosted URL (createCheckoutSession).
 *   2. The customer pays on Stripe's secure page.
 *   3. Stripe calls our webhook (server.js → handleStripeWebhook), we verify
 *      the signature, flip the order to `paid`, message the customer, and
 *      alert the vendor.
 *
 * Requires env:
 *   STRIPE_SECRET_KEY          (sk_live_… / sk_test_…)
 *   STRIPE_WEBHOOK_SECRET      (whsec_…) — for signature verification
 *   PUBLIC_BASE_URL            (optional) where success/cancel pages live
 */

import Stripe from 'stripe';

const SECRET = process.env.STRIPE_SECRET_KEY || '';
export const stripe = SECRET ? new Stripe(SECRET) : null;

const SUCCESS_URL = (process.env.PUBLIC_BASE_URL || 'https://ishas-treat.apinlero.com')
  + '/order-complete';
const CANCEL_URL = (process.env.PUBLIC_BASE_URL || 'https://ishas-treat.apinlero.com')
  + '/order-cancelled';

export function stripeEnabled() {
  return !!stripe;
}

/**
 * Create a Stripe Checkout Session for an order and return its pay URL.
 *
 * @param {Object} order
 * @param {string} order.id            - orders.id (uuid)
 * @param {string|number} order.ref    - human ref (order_number or short id)
 * @param {Array}  order.items         - [{product_name, quantity, price(£)}]
 * @param {number} order.deliveryFee   - £
 * @param {string} order.businessId
 * @param {string} order.customerPhone
 * @returns {Promise<{url: string|null, sessionId: string|null}>}
 */
export async function createCheckoutSession(order) {
  if (!stripe) {
    console.warn('[payments] STRIPE_SECRET_KEY not set — cannot create checkout');
    return { url: null, sessionId: null };
  }

  const line_items = order.items.map(it => ({
    quantity: Math.max(1, Number(it.quantity) || 1),
    price_data: {
      currency: 'gbp',
      product_data: { name: it.product_name || 'Item' },
      // Stripe wants the unit amount in pence
      unit_amount: Math.round((Number(it.price) || 0) * 100),
    },
  }));

  if (order.deliveryFee && Number(order.deliveryFee) > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: 'gbp',
        product_data: { name: 'Delivery' },
        unit_amount: Math.round(Number(order.deliveryFee) * 100),
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${SUCCESS_URL}?ref=${encodeURIComponent(order.ref)}`,
      cancel_url: `${CANCEL_URL}?ref=${encodeURIComponent(order.ref)}`,
      metadata: {
        order_id: order.id,
        order_ref: String(order.ref),
        business_id: order.businessId || '',
        customer_phone: order.customerPhone || '',
      },
      // Prefill / collect nothing extra — keep it one-tap
    });
    return { url: session.url, sessionId: session.id };
  } catch (err) {
    console.error('[payments] createCheckoutSession failed:', err.message);
    return { url: null, sessionId: null };
  }
}

/**
 * Verify and parse a Stripe webhook request.
 * @param {Buffer|string} rawBody - the raw request body (unparsed!)
 * @param {string} signature - the 'stripe-signature' header
 * @returns {{event: Object|null, error: string|null}}
 */
export function constructWebhookEvent(rawBody, signature) {
  if (!stripe) return { event: null, error: 'stripe_not_configured' };
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!whSecret) return { event: null, error: 'webhook_secret_missing' };
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
    return { event, error: null };
  } catch (err) {
    return { event: null, error: err.message };
  }
}
