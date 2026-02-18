/**
 * WhatsApp Webhook API - Handles incoming Twilio WhatsApp messages
 *
 * GET  /api/whatsapp — Health check (requires API key)
 * POST /api/whatsapp — Twilio webhook (validated via Twilio signature)
 *
 * Security:
 * - POST: Twilio request signature validation (X-Twilio-Signature)
 * - GET: Requires X-API-Key header matching WHATSAPP_HEALTH_API_KEY env var
 * - Input validation on message body
 * - Rate limited per IP
 */

import crypto from 'crypto';

// Rate limiting store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60; // 60 requests per minute (Twilio can send bursts)

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `whatsapp:${ip}`;
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  return entry.count <= RATE_LIMIT_MAX;
}

/**
 * Validate Twilio request signature
 * See: https://www.twilio.com/docs/usage/security#validating-requests
 */
function validateTwilioSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.warn('TWILIO_AUTH_TOKEN not set, skipping signature validation');
    return process.env.NODE_ENV === 'development';
  }

  const twilioSignature = req.headers['x-twilio-signature'];
  if (!twilioSignature) {
    return false;
  }

  // Build the URL that Twilio used to call us
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const url = `${protocol}://${host}${req.url}`;

  // Sort POST params and concatenate key+value pairs
  const params = req.body || {};
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.reduce((acc, key) => acc + key + params[key], '');

  // Compute HMAC-SHA1 signature
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(url + paramString)
    .digest('base64');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(twilioSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Sanitize input to prevent injection in TwiML responses
function sanitizeMessage(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 500); // Limit message length
}

export default function handler(req, res) {
  // Rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Health check (authenticated)
  if (req.method === 'GET') {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.WHATSAPP_HEALTH_API_KEY;

    // If no API key is configured, disable health check in production
    if (!expectedKey && process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    // In development, allow without key; in production, require it
    if (expectedKey && apiKey !== expectedKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({
      status: 'ok',
      service: 'Apinlero WhatsApp Bot',
      timestamp: new Date().toISOString()
    });
  }

  // Handle incoming WhatsApp messages (Twilio webhook)
  if (req.method === 'POST') {
    // Validate Twilio signature
    if (!validateTwilioSignature(req)) {
      console.warn('Invalid Twilio signature from IP:', clientIP);
      return res.status(403).json({ error: 'Forbidden: Invalid signature' });
    }

    try {
      const body = req.body || {};
      const incomingMessage = sanitizeMessage(body.Body || '').toLowerCase().trim();
      let responseMessage = '';

      // Bot responses
      if (incomingMessage === 'hi' || incomingMessage === 'hello' || incomingMessage === 'hey') {
        responseMessage = `Welcome to Isha's Treat! 🛒

We offer authentic African & Caribbean groceries.

Commands:
• MENU - Browse our products
• ORDER - How to place an order
• HOURS - Our opening hours
• DELIVERY - Delivery information
• HELP - Get assistance

Visit: https://ishas-treat.apinlero.com`;
      }
      else if (incomingMessage === 'menu') {
        responseMessage = `📦 Our Product Categories:

• Rice & Grains
• Beans & Lentils
• Spices & Seasonings
• Palm Oil & Cooking Oils
• Snacks & Drinks
• Frozen Foods

Browse our full catalog:
https://ishas-treat.apinlero.com`;
      }
      else if (incomingMessage === 'order') {
        responseMessage = `🛍️ How to Order:

1. Visit our online store:
   https://apinlero.vercel.app/store/ishas-treat

2. Add items to your cart

3. Checkout with your details

4. We'll confirm your order via WhatsApp

Minimum order: £20
Free delivery over £50!`;
      }
      else if (incomingMessage === 'hours') {
        responseMessage = `🕐 Opening Hours:

Monday - Friday: 9am - 6pm
Saturday: 10am - 4pm
Sunday: Closed

Order online anytime!`;
      }
      else if (incomingMessage === 'delivery') {
        responseMessage = `🚚 Delivery Information:

• Local delivery (5 miles): £3.99
• Free delivery on orders over £50
• Same-day delivery available for orders before 2pm

Collection also available!`;
      }
      else if (incomingMessage === 'help') {
        responseMessage = `Need help? Here's what I can do:

• MENU - View products
• ORDER - How to order
• HOURS - Opening times
• DELIVERY - Delivery info

Or contact us directly:
📧 Email: hello@ishastreat.com`;
      }
      else {
        responseMessage = `Thanks for your message!

I can help you with:
• MENU - Browse products
• ORDER - Place an order
• HOURS - Opening hours
• DELIVERY - Delivery info
• HELP - Get assistance

Or visit: https://ishas-treat.apinlero.com`;
      }

      // Return TwiML response (Twilio's XML format)
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(responseMessage)}</Message>
</Response>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml);

    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Escape special XML characters
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
