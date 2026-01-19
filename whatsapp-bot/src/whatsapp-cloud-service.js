/**
 * WhatsApp Cloud API Service for Apinlero
 * Handles Meta WhatsApp Business API integration
 *
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Meta Graph API base URL
const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Send a text message via WhatsApp Cloud API
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token for the business
 * @param {string} to - Recipient phone number (without whatsapp: prefix)
 * @param {string} text - Message text
 * @returns {Promise<Object>} API response
 */
export async function sendTextMessage(phoneNumberId, accessToken, to, text) {
  try {
    const cleanPhone = cleanPhoneNumber(to);

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
          preview_url: true,
          body: text
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp Cloud API error:', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send message',
        errorCode: data.error?.code
      };
    }

    console.log(`✅ WhatsApp message sent via Cloud API: ${data.messages?.[0]?.id}`);
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'meta'
    };
  } catch (error) {
    console.error('❌ WhatsApp Cloud API exception:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send an interactive button message
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token
 * @param {string} to - Recipient phone number
 * @param {string} bodyText - Message body
 * @param {Array} buttons - Array of button objects [{id, title}]
 * @param {string} headerText - Optional header text
 * @param {string} footerText - Optional footer text
 */
export async function sendButtonMessage(
  phoneNumberId,
  accessToken,
  to,
  bodyText,
  buttons,
  headerText = null,
  footerText = null
) {
  try {
    const cleanPhone = cleanPhoneNumber(to);

    const interactive = {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((btn, index) => ({
          type: 'reply',
          reply: {
            id: btn.id || `btn_${index}`,
            title: btn.title.substring(0, 20) // Max 20 chars
          }
        }))
      }
    };

    if (headerText) {
      interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactive.footer = { text: footerText };
    }

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
        type: 'interactive',
        interactive
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp button message error:', data);
      return { success: false, error: data.error?.message };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'meta'
    };
  } catch (error) {
    console.error('❌ WhatsApp button message exception:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a list message (for menus/catalogs)
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token
 * @param {string} to - Recipient phone number
 * @param {string} bodyText - Message body
 * @param {string} buttonText - Text on the list button
 * @param {Array} sections - Array of sections [{title, rows: [{id, title, description}]}]
 */
export async function sendListMessage(
  phoneNumberId,
  accessToken,
  to,
  bodyText,
  buttonText,
  sections,
  headerText = null,
  footerText = null
) {
  try {
    const cleanPhone = cleanPhoneNumber(to);

    const interactive = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonText.substring(0, 20),
        sections: sections.map(section => ({
          title: section.title?.substring(0, 24),
          rows: section.rows.slice(0, 10).map(row => ({
            id: row.id,
            title: row.title?.substring(0, 24),
            description: row.description?.substring(0, 72)
          }))
        }))
      }
    };

    if (headerText) {
      interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactive.footer = { text: footerText };
    }

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
        type: 'interactive',
        interactive
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp list message error:', data);
      return { success: false, error: data.error?.message };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'meta'
    };
  } catch (error) {
    console.error('❌ WhatsApp list message exception:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a template message (for notifications, marketing)
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Name of the approved template
 * @param {string} languageCode - Language code (e.g., 'en', 'en_US')
 * @param {Array} components - Template components with parameters
 */
export async function sendTemplateMessage(
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = 'en',
  components = []
) {
  try {
    const cleanPhone = cleanPhoneNumber(to);

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
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp template error:', data);
      return { success: false, error: data.error?.message };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'meta'
    };
  } catch (error) {
    console.error('❌ WhatsApp template exception:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send media message (image, audio, video, document)
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token
 * @param {string} to - Recipient phone number
 * @param {string} mediaType - 'image', 'audio', 'video', or 'document'
 * @param {string} mediaUrl - Public URL of the media
 * @param {string} caption - Optional caption (for image/video/document)
 * @param {string} filename - Optional filename (for document)
 */
export async function sendMediaMessage(
  phoneNumberId,
  accessToken,
  to,
  mediaType,
  mediaUrl,
  caption = null,
  filename = null
) {
  try {
    const cleanPhone = cleanPhoneNumber(to);

    const mediaPayload = { link: mediaUrl };
    if (caption && ['image', 'video', 'document'].includes(mediaType)) {
      mediaPayload.caption = caption;
    }
    if (filename && mediaType === 'document') {
      mediaPayload.filename = filename;
    }

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
        type: mediaType,
        [mediaType]: mediaPayload
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ WhatsApp ${mediaType} error:`, data);
      return { success: false, error: data.error?.message };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'meta'
    };
  } catch (error) {
    console.error(`❌ WhatsApp ${mediaType} exception:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mark message as read
 * @param {string} phoneNumberId - The Meta Phone Number ID
 * @param {string} accessToken - The access token
 * @param {string} messageId - The message ID to mark as read
 */
export async function markMessageAsRead(phoneNumberId, accessToken, messageId) {
  try {
    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('❌ Mark as read error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Download media from WhatsApp (for received images, audio, etc.)
 * @param {string} mediaId - The media ID from the webhook
 * @param {string} accessToken - The access token
 * @returns {Promise<{url: string, mimeType: string} | null>}
 */
export async function getMediaUrl(mediaId, accessToken) {
  try {
    // First, get the media URL
    const response = await fetch(`${GRAPH_API_BASE}/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Get media URL error:', data);
      return null;
    }

    return {
      url: data.url,
      mimeType: data.mime_type,
      sha256: data.sha256,
      fileSize: data.file_size
    };
  } catch (error) {
    console.error('❌ Get media URL exception:', error.message);
    return null;
  }
}

/**
 * Download media binary data
 * @param {string} mediaUrl - The URL from getMediaUrl
 * @param {string} accessToken - The access token
 * @returns {Promise<Buffer | null>}
 */
export async function downloadMedia(mediaUrl, accessToken) {
  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('❌ Download media error:', response.statusText);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('❌ Download media exception:', error.message);
    return null;
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Meta webhook challenge (GET request)
 * @param {Object} query - req.query from Express
 * @param {string} verifyToken - Your verify token stored in DB
 * @returns {string | null} The challenge to return, or null if invalid
 */
export function verifyWebhook(query, verifyToken) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified successfully');
    return challenge;
  }

  console.warn('❌ Webhook verification failed');
  return null;
}

/**
 * Validate webhook signature (for security)
 * @param {string} payload - Raw request body as string
 * @param {string} signature - X-Hub-Signature-256 header
 * @param {string} appSecret - Your Meta App Secret
 * @returns {boolean}
 */
export function validateWebhookSignature(payload, signature, appSecret) {
  if (!signature || !appSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

/**
 * Parse incoming Meta webhook payload
 * @param {Object} body - req.body from Express
 * @returns {Object | null} Parsed message data or null if not a message
 */
export function parseWebhook(body) {
  try {
    // Check if this is a WhatsApp message webhook
    if (body.object !== 'whatsapp_business_account') {
      return null;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return null;

    // Get phone number ID (identifies which business)
    const phoneNumberId = value.metadata?.phone_number_id;
    const displayPhoneNumber = value.metadata?.display_phone_number;

    // Handle status updates (delivery receipts)
    if (value.statuses?.length > 0) {
      const status = value.statuses[0];
      return {
        type: 'status',
        phoneNumberId,
        displayPhoneNumber,
        messageId: status.id,
        recipientId: status.recipient_id,
        status: status.status, // 'sent', 'delivered', 'read', 'failed'
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
        errors: status.errors,
        conversation: status.conversation,
        pricing: status.pricing
      };
    }

    // Handle incoming messages
    if (value.messages?.length > 0) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];

      const parsed = {
        type: 'message',
        phoneNumberId,
        displayPhoneNumber,
        messageId: message.id,
        from: message.from, // Customer's phone number
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        profileName: contact?.profile?.name || null,
        waId: contact?.wa_id,
        messageType: message.type, // 'text', 'image', 'audio', etc.
        // For compatibility with existing bot
        phoneNumber: message.from,
        body: null,
        numMedia: 0
      };

      // Parse message content based on type
      switch (message.type) {
        case 'text':
          parsed.body = message.text?.body;
          break;

        case 'image':
          parsed.image = {
            id: message.image?.id,
            mimeType: message.image?.mime_type,
            sha256: message.image?.sha256,
            caption: message.image?.caption
          };
          parsed.body = message.image?.caption || '[Image]';
          parsed.numMedia = 1;
          break;

        case 'audio':
          parsed.audio = {
            id: message.audio?.id,
            mimeType: message.audio?.mime_type,
            voice: message.audio?.voice // true if voice note
          };
          parsed.body = '[Voice Message]';
          parsed.numMedia = 1;
          break;

        case 'video':
          parsed.video = {
            id: message.video?.id,
            mimeType: message.video?.mime_type,
            sha256: message.video?.sha256,
            caption: message.video?.caption
          };
          parsed.body = message.video?.caption || '[Video]';
          parsed.numMedia = 1;
          break;

        case 'document':
          parsed.document = {
            id: message.document?.id,
            mimeType: message.document?.mime_type,
            sha256: message.document?.sha256,
            filename: message.document?.filename,
            caption: message.document?.caption
          };
          parsed.body = message.document?.caption || `[Document: ${message.document?.filename}]`;
          parsed.numMedia = 1;
          break;

        case 'location':
          parsed.location = {
            latitude: message.location?.latitude,
            longitude: message.location?.longitude,
            name: message.location?.name,
            address: message.location?.address
          };
          parsed.body = `[Location: ${message.location?.name || 'Shared location'}]`;
          break;

        case 'contacts':
          parsed.contacts = message.contacts;
          parsed.body = '[Shared Contacts]';
          break;

        case 'interactive':
          // Button or list reply
          if (message.interactive?.type === 'button_reply') {
            parsed.buttonReply = {
              id: message.interactive.button_reply.id,
              title: message.interactive.button_reply.title
            };
            parsed.body = message.interactive.button_reply.title;
          } else if (message.interactive?.type === 'list_reply') {
            parsed.listReply = {
              id: message.interactive.list_reply.id,
              title: message.interactive.list_reply.title,
              description: message.interactive.list_reply.description
            };
            parsed.body = message.interactive.list_reply.title;
          }
          break;

        case 'button':
          // Quick reply button
          parsed.body = message.button?.text;
          parsed.buttonPayload = message.button?.payload;
          break;

        case 'reaction':
          parsed.reaction = {
            messageId: message.reaction?.message_id,
            emoji: message.reaction?.emoji
          };
          parsed.body = `[Reaction: ${message.reaction?.emoji}]`;
          break;

        default:
          parsed.body = `[${message.type}]`;
      }

      // Add context if this is a reply
      if (message.context) {
        parsed.context = {
          messageId: message.context.id,
          from: message.context.from
        };
      }

      return parsed;
    }

    return null;
  } catch (error) {
    console.error('❌ Error parsing webhook:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clean phone number (remove whatsapp: prefix, +, spaces)
 * @param {string} phone
 * @returns {string}
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone
    .replace('whatsapp:', '')
    .replace(/[\s\-\(\)]/g, '')
    .replace(/^\+/, '');
}

/**
 * Format phone number for display
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneNumber(phone) {
  const clean = cleanPhoneNumber(phone);
  // Nigerian format: +234 XXX XXX XXXX
  if (clean.startsWith('234') && clean.length === 13) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return `+${clean}`;
}

/**
 * Check if within 24-hour messaging window
 * @param {Date} lastMessageTime - Time of last customer message
 * @returns {boolean}
 */
export function isWithinMessagingWindow(lastMessageTime) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Date(lastMessageTime) > twentyFourHoursAgo;
}

// ============================================================================
// UNIFIED MESSAGE SENDER (works with both providers)
// ============================================================================

/**
 * Send message using appropriate provider
 * @param {Object} config - WhatsApp config from database
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @param {Object} twilioService - Imported twilio-service for fallback
 * @returns {Promise<Object>}
 */
export async function sendMessage(config, to, text, twilioService = null) {
  if (config.provider === 'twilio' && twilioService) {
    // Use Twilio
    return twilioService.sendWhatsAppMessage(to, text);
  }

  // Default to Meta Cloud API
  return sendTextMessage(
    config.phone_number_id,
    config.access_token,
    to,
    text
  );
}

export default {
  // Sending messages
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  sendTemplateMessage,
  sendMediaMessage,
  markMessageAsRead,

  // Media handling
  getMediaUrl,
  downloadMedia,

  // Webhook handling
  verifyWebhook,
  validateWebhookSignature,
  parseWebhook,

  // Utilities
  cleanPhoneNumber,
  formatPhoneNumber,
  isWithinMessagingWindow,

  // Unified sender
  sendMessage
};
