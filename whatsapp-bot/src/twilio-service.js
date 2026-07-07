import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client = null;

// Only initialize if credentials exist (allows for local testing without Twilio)
if (accountSid && authToken && twilioWhatsAppNumber) {
  client = twilio(accountSid, authToken);
  console.log('✅ Twilio client initialized successfully');
} else {
  console.warn('⚠️ Twilio credentials not configured - WhatsApp sending disabled');
  console.warn('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER');
}

/**
 * Normalize a phone number to Twilio WhatsApp channel format: "whatsapp:+1234567890".
 * Accepts bare E.164 (+44...), no-plus (44...), or an already-prefixed value.
 * @param {string} num
 * @returns {string}
 */
export function toWhatsAppAddress(num) {
  if (!num) return num;
  let n = String(num).trim();
  if (n.startsWith('whatsapp:')) n = n.slice('whatsapp:'.length).trim();
  n = n.replace(/\s/g, '');
  if (!n.startsWith('+')) n = `+${n}`;
  return `whatsapp:${n}`;
}

// Per-account client cache — only needed if a vendor's number lives in a Twilio
// subaccount with its own auth token (ISV embedded signup). Mirrors the
// per-business Stripe client cache in payments.js.
const accountClientCache = new Map(); // `${accountSid}` → twilio client

function getClientFor(sender) {
  // sender may be a bare string (uses the default account client) or an object
  // { number, accountSid, authToken } for a subaccount-scoped sender.
  if (sender && typeof sender === 'object' && sender.accountSid && sender.authToken) {
    const key = sender.accountSid;
    if (!accountClientCache.has(key)) {
      accountClientCache.set(key, twilio(sender.accountSid, sender.authToken));
    }
    return accountClientCache.get(key);
  }
  return client;
}

/** Clear a cached subaccount client (e.g. after the vendor rotates credentials). */
export function invalidateTwilioClientCache(accountSid) {
  accountClientCache.delete(accountSid);
}

/**
 * Send WhatsApp message via Twilio.
 * @param {string} to - Recipient WhatsApp number (any format; normalized here)
 * @param {string} body - Message text
 * @param {string|Object} [from] - Sender. Either a number string (the vendor's
 *   WhatsApp number) or `{ number, accountSid?, authToken? }` for a subaccount
 *   sender. Defaults to the global TWILIO_WHATSAPP_NUMBER (backward compatible).
 * @returns {Promise<Object>} Twilio message response
 */
export async function sendWhatsAppMessage(to, body, from = twilioWhatsAppNumber) {
  const fromNumber = (from && typeof from === 'object') ? from.number : from;
  const sendingClient = getClientFor(from);

  if (!sendingClient || !fromNumber) {
    console.warn('⚠️ Twilio not configured - message not sent');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const formattedTo = toWhatsAppAddress(to);
    const formattedFrom = toWhatsAppAddress(fromNumber);

    const message = await sendingClient.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: body
    });

    console.log(`✅ WhatsApp message sent via Twilio: ${message.sid}`);
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message via Twilio:', error.message);
    throw error;
  }
}

/**
 * Parse incoming Twilio webhook request
 * @param {Object} body - Express req.body from Twilio webhook
 * @returns {Object} Parsed message data
 */
export function parseTwilioWebhook(body) {
  // Extract phone number from From field (format: "whatsapp:+1234567890")
  const rawFrom = body.From || '';
  const phoneNumber = rawFrom.replace('whatsapp:', '').replace(/\s/g, '').trim();

  // Normalize the business's own number (To) to canonical bare E.164 for tenant
  // lookup — strip the "whatsapp:" prefix and spaces, keep the leading +.
  const rawTo = body.To || '';
  const toNormalized = rawTo
    ? (() => {
        const t = rawTo.replace('whatsapp:', '').replace(/\s/g, '').trim();
        return t.startsWith('+') ? t : `+${t}`;
      })()
    : null;

  return {
    from: body.From, // Format: whatsapp:+1234567890
    to: body.To,     // Format: whatsapp:+14155238886
    toNormalized,    // Bare E.164 (+44...) — canonical key for tenant resolution
    body: body.Body, // Message text
    messageId: body.MessageSid,
    numMedia: parseInt(body.NumMedia || '0'),
    profileName: body.ProfileName || null, // WhatsApp profile name
    // Clean phone number (keep + prefix, just remove 'whatsapp:')
    phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\s/g, '')}`,
    timestamp: new Date().toISOString()
  };
}

export const twilioClient = client;
