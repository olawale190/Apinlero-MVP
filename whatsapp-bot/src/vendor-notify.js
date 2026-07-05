/**
 * Vendor notifications.
 *
 * Sends WhatsApp messages to the business owner (Isha) — low-stock alerts now,
 * and new-order alerts / status prompts in Phase 3c. Kept separate so the
 * vendor experience can grow here without touching customer flow.
 */

import { supabase } from './supabase-client.js';
import { sendWhatsAppMessage } from './twilio-service.js';

/**
 * Look up the business owner's WhatsApp number.
 * Returns E.164-ish string (e.g. +44...) or null.
 */
export async function getBusinessOwnerPhone(businessId) {
  if (!businessId) return null;
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('phone')
      .eq('id', businessId)
      .single();
    if (error || !data?.phone) return null;
    return normalizePhone(data.phone);
  } catch (err) {
    console.warn('[vendor-notify] owner phone lookup failed:', err.message);
    return null;
  }
}

function normalizePhone(raw) {
  let p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return null;
  // UK local numbers → +44
  if (p.startsWith('0')) p = '+44' + p.slice(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

/**
 * Send a plain WhatsApp message to the vendor. Safe no-op if no phone.
 */
export async function sendVendorMessage(businessId, text) {
  const phone = await getBusinessOwnerPhone(businessId);
  if (!phone) {
    console.warn('[vendor-notify] no owner phone for business', businessId, '- skipping vendor message');
    return { success: false, reason: 'no_phone' };
  }
  try {
    await sendWhatsAppMessage(`whatsapp:${phone}`, text);
    return { success: true };
  } catch (err) {
    console.warn('[vendor-notify] send failed:', err.message);
    return { success: false, reason: err.message };
  }
}
