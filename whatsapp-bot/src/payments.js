/**
 * Stripe payments — card-only, PER-VENDOR keys.
 *
 * Each vendor's own Stripe keys live on their `businesses` row, so money
 * always routes to the correct merchant. We build a Stripe client on demand
 * from the business's secret key rather than one global platform key.
 *
 * Flow:
 *   1. On order confirmation → createCheckoutSession(order) builds a hosted
 *      Stripe Checkout page using THAT vendor's keys and sends the customer
 *      its URL.
 *   2. Customer pays on Stripe's secure page.
 *   3. Stripe calls our webhook → constructWebhookEvent verifies the signature
 *      with that vendor's webhook secret → order flips to paid.
 *
 * Security note: businesses.stripe_secret_key_encrypted currently holds a
 * PLAINTEXT test key in the pilot. Encryption-at-rest is a pre-live task.
 */

import Stripe from 'stripe';
import { getBusinessStripe } from './supabase-client.js';

const BASE = process.env.PUBLIC_BASE_URL || 'https://ishas-treat.apinlero.com';
const SUCCESS_URL = BASE + '/order-complete';
const CANCEL_URL = BASE + '/order-cancelled';

// Small cache so we don't re-query the business row on every call
const clientCache = new Map(); // businessId → { stripe, config }

/**
 * Get a Stripe client + config for a business, or null if not configured.
 */
async function getStripeFor(businessId) {
  if (!businessId) return null;
  if (clientCache.has(businessId)) return clientCache.get(businessId);

  const config = await getBusinessStripe(businessId);
  if (!config || !config.secretKey || !config.secretKey.startsWith('sk_')) {
    return null;
  }
  const entry = { stripe: new Stripe(config.secretKey), config };
  clientCache.set(businessId, entry);
  return entry;
}

/** Clear a cached client (e.g. after the vendor updates their keys). */
export function invalidateStripeCache(businessId) {
  clientCache.delete(businessId);
}

/**
 * Is Stripe configured for this business?
 */
export async function stripeEnabledFor(businessId) {
  return !!(await getStripeFor(businessId));
}
// (typo-safe alias)
async function getStripeForSafe(id) { return getStripeFor(id); }

/**
 * Create a Stripe Checkout Session for an order and return its pay URL.
 * Uses the ORDER's business Stripe keys.
 *
 * @param {Object} order
 * @param {string} order.id            - orders.id (uuid)
 * @param {string|number} order.ref    - human ref
 * @param {Array}  order.items         - [{product_name, quantity, price(£)}]
 * @param {number} order.deliveryFee   - £
 * @param {string} order.businessId
 * @param {string} order.customerPhone
 * @returns {Promise<{url, sessionId, reason}>}
 */
export async function createCheckoutSession(order) {
  const entry = await getStripeFor(order.businessId);
  if (!entry) {
    console.warn('[payments] no Stripe keys for business', order.businessId);
    return { url: null, sessionId: null, reason: 'not_configured' };
  }
  const { stripe, config } = entry;

  const line_items = order.items.map(it => ({
    quantity: Math.max(1, Number(it.quantity) || 1),
    price_data: {
      currency: 'gbp',
      product_data: { name: it.product_name || 'Item' },
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
    const params = {
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
    };

    // If the vendor is on Stripe Connect (has an account id), route the money
    // to their connected account. Otherwise their own keys already do that,
    // and we must NOT pass an options object (Stripe rejects an empty one).
    const session = config.accountId
      ? await stripe.checkout.sessions.create(params, { stripeAccount: config.accountId })
      : await stripe.checkout.sessions.create(params);
    return { url: session.url, sessionId: session.id, reason: null };
  } catch (err) {
    console.error('[payments] createCheckoutSession failed:', err.message);
    return { url: null, sessionId: null, reason: err.message };
  }
}

/**
 * Verify and parse a Stripe webhook using the business's webhook secret.
 * @param {Buffer|string} rawBody
 * @param {string} signature - 'stripe-signature' header
 * @param {string} businessId
 * @returns {Promise<{event, error}>}
 */
export async function constructWebhookEvent(rawBody, signature, businessId) {
  const entry = await getStripeFor(businessId);
  if (!entry) return { event: null, error: 'stripe_not_configured' };
  const whSecret = entry.config.webhookSecret;
  if (!whSecret) return { event: null, error: 'webhook_secret_missing' };
  try {
    const event = entry.stripe.webhooks.constructEvent(rawBody, signature, whSecret);
    return { event, error: null };
  } catch (err) {
    return { event: null, error: err.message };
  }
}

/**
 * Parse a webhook event WITHOUT signature verification, used only to read the
 * business_id from metadata so we can then look up the right webhook secret.
 * We re-verify with constructWebhookEvent before trusting anything.
 */
export function peekEventBusinessId(rawBody) {
  try {
    const parsed = JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
    return parsed?.data?.object?.metadata?.business_id || null;
  } catch {
    return null;
  }
}
