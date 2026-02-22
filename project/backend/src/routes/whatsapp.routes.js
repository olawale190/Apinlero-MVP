/**
 * WhatsApp Webhook Routes — Knowledge Graph Integration
 *
 * Receives incoming Twilio WhatsApp messages, routes them through
 * the Knowledge Graph order-processor, and sends responses back via Twilio.
 *
 * POST /api/whatsapp/webhook  — Twilio webhook endpoint
 * GET  /api/whatsapp/webhook  — Twilio webhook verification
 */

import { Router } from 'express';
import twilio from 'twilio';
import { processMessage } from '../knowledge-graph/order-processor.js';
import { rateLimiter } from '../middleware/security.js';

/**
 * Factory function — receives env config from index.js
 */
export default function createWhatsAppRoutes() {
  const router = Router();

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  // Lazy-init Twilio client (only if credentials are present)
  let twilioClient = null;
  function getTwilioClient() {
    if (!twilioClient && accountSid && authToken) {
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  }

  // ── POST /api/whatsapp/webhook ─────────────────────────────────────────
  router.post(
    '/api/whatsapp/webhook',
    rateLimiter(60),
    async (req, res) => {
      const startTime = Date.now();
      console.log('\u{1F4E8} [WhatsApp KG] Twilio webhook received');

      try {
        // Extract fields from Twilio form-encoded payload
        const from = req.body.From;         // "whatsapp:+447700000001"
        const body = req.body.Body;         // The message text
        const profileName = req.body.ProfileName || null;

        if (!from || !body) {
          return res.status(400).json({ error: 'Missing From or Body' });
        }

        // Normalise phone: strip "whatsapp:" prefix
        const phone = from.replace('whatsapp:', '');

        console.log(`\u{1F4E9} [WhatsApp KG] From: ${phone} | Name: ${profileName} | Message: ${body}`);

        // Process through Knowledge Graph order processor
        const response = await processMessage(phone, body);

        console.log(`\u{1F4E4} [WhatsApp KG] Response (${Date.now() - startTime}ms): ${response.substring(0, 100)}...`);

        // Send response back via Twilio
        const client = getTwilioClient();
        if (client && twilioNumber) {
          await client.messages.create({
            from: twilioNumber,
            to: from,
            body: response,
          });
          console.log(`\u2705 [WhatsApp KG] Response sent to ${phone}`);
        } else {
          console.warn('\u26A0\uFE0F [WhatsApp KG] Twilio not configured — response not sent');
        }

        // Twilio expects 200 with TwiML or empty body
        res.status(200).send('<Response></Response>');
      } catch (error) {
        console.error('\u274C [WhatsApp KG] Webhook error:', error);

        // Try to send error message to customer
        try {
          const from = req.body.From;
          const client = getTwilioClient();
          if (client && from && twilioNumber) {
            await client.messages.create({
              from: twilioNumber,
              to: from,
              body: "Sorry, there was an error processing your message. Please try again.",
            });
          }
        } catch (e) {
          // Ignore send errors
        }

        res.status(200).send('<Response></Response>');
      }
    }
  );

  // ── GET /api/whatsapp/webhook — verification ──────────────────────────
  router.get('/api/whatsapp/webhook', (req, res) => {
    console.log('\u{1F50F} [WhatsApp KG] Webhook verification request');
    res.status(200).json({ status: 'ok', service: 'WhatsApp Knowledge Graph webhook' });
  });

  return router;
}
