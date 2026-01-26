/**
 * Webhook Mock Generator
 *
 * Generates mock webhook payloads for Twilio and Meta WhatsApp Cloud API
 * to enable offline testing without live webhooks.
 */

import crypto from 'crypto';

/**
 * Generate Twilio WhatsApp webhook payload
 *
 * @param {Object} options
 * @param {string} options.message - Message text
 * @param {string} options.phone - Customer phone number (will be prefixed with whatsapp:+)
 * @param {string} options.businessPhone - Business WhatsApp number (default: +14155238886)
 * @param {string} options.messageId - Unique message ID (auto-generated if not provided)
 * @returns {Object} Twilio webhook payload
 */
function generateTwilioWebhook({
  message = 'Hi',
  phone = '447448682282',
  businessPhone = '+14155238886',
  messageId = null
}) {
  // Ensure phone has + prefix
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const normalizedBusinessPhone = businessPhone.startsWith('+') ? businessPhone : `+${businessPhone}`;

  // Generate message ID if not provided
  const msgId = messageId || `SM${crypto.randomBytes(16).toString('hex')}`;

  return {
    MessageSid: msgId,
    AccountSid: 'AC' + crypto.randomBytes(16).toString('hex'),
    MessagingServiceSid: 'MG' + crypto.randomBytes(16).toString('hex'),
    From: `whatsapp:${normalizedPhone}`,
    To: `whatsapp:${normalizedBusinessPhone}`,
    Body: message,
    NumMedia: '0',
    NumSegments: '1',
    SmsStatus: 'received',
    ApiVersion: '2010-04-01',
    // Twilio-specific fields
    ProfileName: 'Test Customer',
    WaId: normalizedPhone.replace('+', ''),
  };
}

/**
 * Generate Meta WhatsApp Cloud API webhook payload
 *
 * @param {Object} options
 * @param {string} options.message - Message text
 * @param {string} options.phone - Customer phone number (without + prefix)
 * @param {string} options.businessPhone - Business WhatsApp phone ID
 * @param {string} options.messageId - Unique message ID (auto-generated if not provided)
 * @param {string} options.timestamp - Message timestamp (auto-generated if not provided)
 * @returns {Object} Meta webhook payload
 */
function generateMetaWebhook({
  message = 'Hi',
  phone = '447448682282',
  businessPhone = '123456789',
  messageId = null,
  timestamp = null
}) {
  // Remove + prefix if present
  const normalizedPhone = phone.replace('+', '');

  // Generate IDs if not provided
  const msgId = messageId || `wamid.${crypto.randomBytes(16).toString('hex')}`;
  const ts = timestamp || Math.floor(Date.now() / 1000).toString();

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: crypto.randomBytes(8).toString('hex'),
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: businessPhone,
                phone_number_id: businessPhone,
              },
              contacts: [
                {
                  profile: {
                    name: 'Test Customer',
                  },
                  wa_id: normalizedPhone,
                },
              ],
              messages: [
                {
                  from: normalizedPhone,
                  id: msgId,
                  timestamp: ts,
                  text: {
                    body: message,
                  },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

/**
 * Generate mock webhook with business context
 *
 * @param {Object} options
 * @param {string} options.provider - 'twilio' or 'meta'
 * @param {string} options.businessId - Business ID for multi-tenant context
 * @param {string} options.message - Message text
 * @param {string} options.phone - Customer phone number
 * @returns {Object} Webhook payload with business context
 */
function generateWebhookWithContext({
  provider = 'twilio',
  businessId = 'test-business-001',
  message = 'Hi',
  phone = '447448682282',
}) {
  let webhook;

  if (provider === 'twilio') {
    webhook = generateTwilioWebhook({ message, phone });
  } else if (provider === 'meta') {
    webhook = generateMetaWebhook({ message, phone });
  } else {
    throw new Error(`Unknown provider: ${provider}. Must be 'twilio' or 'meta'.`);
  }

  // Add business context (will be extracted by webhook handler)
  return {
    webhook,
    context: {
      businessId,
      provider,
    },
  };
}

/**
 * Generate webhook with media (image, video, document)
 *
 * @param {Object} options
 * @param {string} options.provider - 'twilio' or 'meta'
 * @param {string} options.mediaType - 'image', 'video', 'audio', 'document'
 * @param {string} options.mediaUrl - Media URL
 * @param {string} options.phone - Customer phone number
 * @returns {Object} Webhook payload with media
 */
function generateMediaWebhook({
  provider = 'twilio',
  mediaType = 'image',
  mediaUrl = 'https://example.com/image.jpg',
  phone = '447448682282',
}) {
  if (provider === 'twilio') {
    const webhook = generateTwilioWebhook({ message: '', phone });
    webhook.NumMedia = '1';
    webhook.MediaContentType0 = `${mediaType}/jpeg`;
    webhook.MediaUrl0 = mediaUrl;
    return webhook;
  } else if (provider === 'meta') {
    const webhook = generateMetaWebhook({ message: '', phone });
    const message = webhook.entry[0].changes[0].value.messages[0];

    // Replace text with media
    delete message.text;
    message.type = mediaType;
    message[mediaType] = {
      id: crypto.randomBytes(16).toString('hex'),
      mime_type: `${mediaType}/jpeg`,
      sha256: crypto.randomBytes(32).toString('hex'),
      url: mediaUrl,
    };

    return webhook;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Generate malformed webhook for error testing
 *
 * @param {string} scenario - 'missing-from', 'missing-body', 'invalid-format', 'empty-payload'
 * @returns {Object} Malformed webhook payload
 */
function generateMalformedWebhook(scenario = 'missing-from') {
  const webhook = generateTwilioWebhook({ message: 'Test' });

  switch (scenario) {
    case 'missing-from':
      delete webhook.From;
      break;
    case 'missing-body':
      delete webhook.Body;
      break;
    case 'invalid-format':
      webhook.From = 'invalid-phone-format';
      break;
    case 'empty-payload':
      return {};
    case 'missing-message-id':
      delete webhook.MessageSid;
      break;
    default:
      throw new Error(`Unknown malformed scenario: ${scenario}`);
  }

  return webhook;
}

export {
  generateTwilioWebhook,
  generateMetaWebhook,
  generateWebhookWithContext,
  generateMediaWebhook,
  generateMalformedWebhook,
};
