/**
 * Àpínlẹ̀rọ WhatsApp Bot Server v3.0.0
 *
 * Multi-tenant webhook server for WhatsApp
 * Supports both Twilio and Meta WhatsApp Cloud API
 */

import express from 'express';
import dotenv from 'dotenv';
import { sendWhatsAppMessage, parseTwilioWebhook } from './twilio-service.js';
import {
  sendTextMessage,
  sendButtonMessage,
  parseWebhook,
  verifyWebhook,
  cleanPhoneNumber
} from './whatsapp-cloud-service.js';
import { handleIncomingMessage } from './message-handler.js';

dotenv.config();

const app = express();

// Parse URL-encoded bodies (Twilio sends form data)
app.use(express.urlencoded({ extended: false }));
// Parse JSON for Meta and n8n webhooks
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Àpínlẹ̀rọ WhatsApp Bot',
    version: '3.0.0 (Multi-Tenant)',
    providers: ['Meta WhatsApp Cloud API', 'Twilio'],
    features: [
      'Multi-tenant support',
      'Meta WhatsApp Cloud API',
      'Twilio fallback',
      'Full message handler',
      'Natural language order parsing',
      'Product alias matching (Yoruba + English)',
      'Session persistence (Supabase)',
      'Customer tracking',
      'Payment flow'
    ],
    endpoints: {
      health: 'GET /',
      twilio: 'POST /webhook/twilio',
      meta: 'POST /webhook/meta',
      metaVerify: 'GET /webhook/meta',
      n8nRouter: 'POST /webhook/n8n'
    }
  });
});

// ============================================================================
// TWILIO WEBHOOK (Original - Single Tenant)
// ============================================================================

app.post('/webhook/twilio', async (req, res) => {
  console.log('📨 Twilio webhook received');

  try {
    const incomingMessage = parseTwilioWebhook(req.body);
    console.log(`📩 [Twilio] Message from ${incomingMessage.phoneNumber}: ${incomingMessage.body}`);

    // Process message through the full handler (no tenant context for legacy Twilio)
    const response = await handleIncomingMessage({
      from: incomingMessage.phoneNumber,
      customerName: incomingMessage.profileName || null,
      text: incomingMessage.body,
      messageId: incomingMessage.messageId,
      provider: 'twilio',
      businessId: null // Single tenant mode
    });

    // Send response via Twilio
    if (response && response.text) {
      await sendWhatsAppMessage(incomingMessage.from, response.text);
      console.log(`✅ [Twilio] Response sent to ${incomingMessage.phoneNumber}`);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ [Twilio] Webhook error:', error);

    try {
      const incomingMessage = parseTwilioWebhook(req.body);
      await sendWhatsAppMessage(
        incomingMessage.from,
        "Sorry, there was an error processing your message. Please try again or contact us directly."
      );
    } catch (e) {
      // Ignore send errors
    }

    res.status(500).send('Error processing message');
  }
});

// ============================================================================
// META WHATSAPP CLOUD API WEBHOOK (Multi-Tenant via n8n)
// ============================================================================

/**
 * Webhook endpoint called by n8n after routing
 * Receives enriched payload with business context
 */
app.post('/webhook/meta', async (req, res) => {
  const startTime = Date.now();
  console.log('📨 Meta webhook received (via n8n router)');

  try {
    const {
      businessId,
      businessName,
      phoneNumberId,
      accessToken,
      provider,
      messageId,
      from,
      profileName,
      messageType,
      content,
      timestamp,
      mediaId,
      buttonId,
      listId
    } = req.body;

    // Validate required fields
    if (!businessId || !from || !content) {
      console.warn('⚠️ [Meta] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`📩 [Meta] Business: ${businessName} | From: ${from} | Type: ${messageType}`);
    console.log(`📩 [Meta] Content: ${content}`);

    // Process message through handler with tenant context
    const response = await handleIncomingMessage({
      from: cleanPhoneNumber(from),
      customerName: profileName || null,
      text: content,
      messageId,
      provider: provider || 'meta',
      businessId,
      // Additional context for interactive messages
      buttonId,
      listId,
      mediaId,
      messageType,
      // Pass accessToken for media downloads
      accessToken
    });

    // Send response via Meta Cloud API
    if (response && response.text) {
      const sendResult = await sendTextMessage(
        phoneNumberId,
        accessToken,
        from,
        response.text
      );

      if (sendResult.success) {
        console.log(`✅ [Meta] Response sent to ${from} (${Date.now() - startTime}ms)`);
      } else {
        console.error(`❌ [Meta] Failed to send response: ${sendResult.error}`);
      }

      // If response has buttons, send interactive message
      if (response.buttons && response.buttons.length > 0) {
        await sendButtonMessage(
          phoneNumberId,
          accessToken,
          from,
          response.text,
          response.buttons.map((btn, i) => ({
            id: `btn_${i}`,
            title: btn.substring(0, 20) // Max 20 chars
          }))
        );
      }
    }

    res.status(200).json({
      success: true,
      responseTime: Date.now() - startTime,
      messageId: response?.messageId
    });

  } catch (error) {
    console.error('❌ [Meta] Webhook error:', error);
    res.status(500).json({ error: 'Error processing message' });
  }
});

/**
 * Direct Meta webhook verification (for testing without n8n)
 * In production, n8n handles this
 */
app.get('/webhook/meta', (req, res) => {
  console.log('🔐 Meta webhook verification request');

  // For direct testing, use env variable
  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (!verifyToken) {
    console.log('⚠️ META_VERIFY_TOKEN not set - verification handled by n8n');
    return res.sendStatus(403);
  }

  const challenge = verifyWebhook(req.query, verifyToken);

  if (challenge) {
    console.log('✅ Meta webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Meta webhook verification failed');
    res.sendStatus(403);
  }
});

// ============================================================================
// N8N ROUTER WEBHOOK (Receives routed messages from n8n)
// ============================================================================

/**
 * Alternative endpoint for n8n to route messages
 * Supports both Twilio and Meta format
 */
app.post('/webhook/n8n', async (req, res) => {
  const startTime = Date.now();
  console.log('📨 n8n router webhook received');

  try {
    const {
      // Business context (from n8n lookup)
      businessId,
      businessName,
      provider,
      // Message details
      from,
      profileName,
      content,
      messageId,
      messageType,
      // Provider-specific credentials
      phoneNumberId,
      accessToken,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      // Optional context
      buttonId,
      listId,
      mediaId
    } = req.body;

    if (!from || !content) {
      return res.status(400).json({ error: 'Missing from or content' });
    }

    console.log(`📩 [n8n] Provider: ${provider} | Business: ${businessName || 'default'}`);
    console.log(`📩 [n8n] From: ${from} | Content: ${content}`);

    // Process message
    const response = await handleIncomingMessage({
      from: cleanPhoneNumber(from),
      customerName: profileName || null,
      text: content,
      messageId,
      provider: provider || 'meta',
      businessId: businessId || null,
      buttonId,
      listId,
      mediaId,
      messageType,
      // Pass accessToken for media downloads
      accessToken
    });

    // Send response based on provider
    let sendResult = { success: false };

    if (response && response.text) {
      if (provider === 'twilio' && twilioPhoneNumber) {
        // Use Twilio
        sendResult = await sendWhatsAppMessage(
          from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
          response.text
        );
      } else if (phoneNumberId && accessToken) {
        // Use Meta Cloud API
        sendResult = await sendTextMessage(
          phoneNumberId,
          accessToken,
          from,
          response.text
        );
      } else {
        console.warn('⚠️ [n8n] No valid provider credentials');
      }

      if (sendResult.success) {
        console.log(`✅ [n8n] Response sent (${Date.now() - startTime}ms)`);
      }
    }

    res.status(200).json({
      success: true,
      responseTime: Date.now() - startTime,
      sent: sendResult.success
    });

  } catch (error) {
    console.error('❌ [n8n] Webhook error:', error);
    res.status(500).json({ error: 'Error processing message' });
  }
});

// ============================================================================
// LEGACY ENDPOINTS (Backward compatibility)
// ============================================================================

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔐 Legacy webhook verification (Meta)');

  if (mode === 'subscribe' && token) {
    console.log('✅ Webhook verified (legacy)');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook received (legacy endpoint)');

  // Check if this is a Twilio request (has From field with whatsapp: prefix)
  if (req.body.From && req.body.From.startsWith('whatsapp:')) {
    console.log('📱 Detected Twilio format - forwarding to Twilio handler');

    try {
      const incomingMessage = parseTwilioWebhook(req.body);
      console.log(`📩 [Twilio] Message from ${incomingMessage.phoneNumber}: ${incomingMessage.body}`);

      // Process message through the full handler
      const response = await handleIncomingMessage({
        from: incomingMessage.phoneNumber,
        customerName: incomingMessage.profileName || null,
        text: incomingMessage.body,
        messageId: incomingMessage.messageId,
        provider: 'twilio',
        businessId: null
      });

      // Send response via Twilio
      if (response && response.text) {
        await sendWhatsAppMessage(incomingMessage.from, response.text);
        console.log(`✅ [Twilio] Response sent to ${incomingMessage.phoneNumber}`);
      }

      return res.status(200).send('OK');

    } catch (error) {
      console.error('❌ [Twilio] Webhook error:', error);
      return res.status(200).send('OK'); // Always return 200 to Twilio
    }
  }

  // Otherwise treat as Meta webhook
  console.log('⚠️ Received message on legacy Meta webhook');
  const parsed = parseWebhook(req.body);
  if (parsed && parsed.type === 'message') {
    console.log(`📩 [Legacy Meta] From: ${parsed.from} | Content: ${parsed.body}`);
  }
  res.sendStatus(200);
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Àpínlẹ̀rọ WhatsApp Bot v3.0.0 (Multi-Tenant) running on port ${PORT}

Providers:
✓ Meta WhatsApp Cloud API (via n8n router)
✓ Twilio WhatsApp (legacy/fallback)

Features:
✓ Multi-tenant support (per-business WhatsApp)
✓ n8n webhook routing
✓ Full message handler integration
✓ Natural language order parsing
✓ Product alias matching (Yoruba + English)
✓ Session persistence (Supabase)
✓ Customer tracking
✓ Payment flow

Endpoints:
- GET  /               Health check
- POST /webhook/twilio Twilio webhook (single tenant)
- GET  /webhook/meta   Meta verification
- POST /webhook/meta   Meta messages (via n8n)
- POST /webhook/n8n    n8n router endpoint
- GET  /webhook        Legacy Meta verification
- POST /webhook        Legacy Meta messages

Configure n8n to forward to: POST /webhook/meta or /webhook/n8n
  `);
});

export default app;
