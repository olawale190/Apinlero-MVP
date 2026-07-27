/**
 * Tenant resolver — maps an incoming WhatsApp message to the vendor it was sent
 * to. Routing is by the business's own number (the Twilio webhook `To` field).
 *
 * Mirrors the per-business Stripe client cache in payments.js: this file owns the
 * cache + phone normalization; the actual DB lookups live in supabase-client.js
 * (getBusinessByTwilioNumber / getBusinessIdentity).
 *
 * On a miss, callers fall back to DEFAULT_BUSINESS_ID so a single-vendor (or
 * not-yet-seeded) deployment keeps working.
 */

import { getBusinessByTwilioNumber, getBusinessIdentity } from './supabase-client.js';

// Cache: normalized number → { entry, ts }. Short TTL so a newly onboarded
// vendor (or an edited row) is picked up without a redeploy.
const cache = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

const STOREFRONT_BASE_HOST = process.env.STOREFRONT_BASE_HOST || 'apinlero.com';

/**
 * Normalize any WhatsApp number to canonical bare E.164: "+447935238972".
 * Strips a "whatsapp:" prefix and whitespace; ensures a leading +.
 */
export function normalizeNumber(num) {
  if (!num) return null;
  let n = String(num).trim();
  if (n.startsWith('whatsapp:')) n = n.slice('whatsapp:'.length).trim();
  n = n.replace(/\s/g, '');
  if (!n) return null;
  return n.startsWith('+') ? n : `+${n}`;
}

function buildStorefrontUrl(slug) {
  return slug ? `https://${slug}.${STOREFRONT_BASE_HOST}` : null;
}

/**
 * Resolve the vendor for an incoming `To` number.
 * @param {string} toNumber - the business's number (webhook To field), any format
 * @returns {Promise<{businessId, businessName, storefrontUrl, twilioNumber}|null>}
 */
export async function resolveBusinessByTwilioNumber(toNumber) {
  const key = normalizeNumber(toNumber);
  if (!key) return null;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.entry;
  }

  const config = await getBusinessByTwilioNumber(key);
  if (!config || !config.businessId) {
    console.warn(`[tenant-resolver] no business for To=${key}`);
    // Cache the miss briefly too, to avoid hammering the DB on every message
    // to an unknown number. Store null entry with a timestamp.
    cache.set(key, { entry: null, ts: Date.now() });
    return null;
  }

  // Enrich with storefront slug for branding.
  const identity = await getBusinessIdentity(config.businessId);
  const entry = {
    businessId: config.businessId,
    businessName: config.businessName || identity?.businessName || null,
    storefrontUrl: buildStorefrontUrl(identity?.slug),
    twilioNumber: key,
  };
  cache.set(key, { entry, ts: Date.now() });
  return entry;
}

/**
 * Same identity object but keyed by businessId — for code paths (templates,
 * classifier, vendor notifications) that already have a businessId but not the
 * `To` number.
 * @returns {Promise<{businessId, businessName, storefrontUrl, twilioNumber}|null>}
 */
export async function getBusinessConfig(businessId) {
  if (!businessId) return null;
  const identity = await getBusinessIdentity(businessId);
  if (!identity) return null;
  return {
    businessId: identity.businessId,
    businessName: identity.businessName,
    storefrontUrl: buildStorefrontUrl(identity.slug),
    twilioNumber: null, // not known from this direction; sender uses default/from
  };
}

/** Clear a cached tenant (e.g. after the vendor edits their number). */
export function invalidateTenantCache(toNumber) {
  const key = normalizeNumber(toNumber);
  if (key) cache.delete(key);
}
