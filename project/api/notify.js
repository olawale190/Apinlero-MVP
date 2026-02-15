/**
 * Order Notification API - Sends Email + WhatsApp confirmations
 *
 * POST /api/notify
 * Headers: Authorization: Bearer <supabase-jwt>
 * Body: { orderId, customerName, customerPhone, customerEmail, total, items, deliveryMethod }
 *
 * Security:
 * - Requires valid Supabase JWT token
 * - CORS restricted to allowed origins
 * - Input validation on all fields
 * - Rate limited per IP
 */

import { createClient } from '@supabase/supabase-js';

// Allowed origins (must match backend CORS config)
const ALLOWED_ORIGINS = [
  'https://project-apinlero.vercel.app',
  'https://apinlero.vercel.app',
  'https://app.apinlero.com',
  'https://ishas-treat.apinlero.com',
  'https://apinlero.com',
  'https://www.apinlero.com',
];

// Rate limiting store (in-memory, resets on cold start)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 notifications per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `notify:${ip}`;
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  return entry.count <= RATE_LIMIT_MAX;
}

function setCorsHeaders(res, origin) {
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    (origin && origin.endsWith('.apinlero.com')) ||
    process.env.NODE_ENV === 'development';

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Validate and sanitize input
function validateInput(body) {
  const errors = [];

  if (!body.orderId || typeof body.orderId !== 'string') {
    errors.push('orderId is required');
  } else if (!/^[0-9a-f-]{36}$/i.test(body.orderId)) {
    errors.push('orderId must be a valid UUID');
  }

  if (!body.customerName || typeof body.customerName !== 'string') {
    errors.push('customerName is required');
  } else if (body.customerName.length < 2 || body.customerName.length > 100) {
    errors.push('customerName must be 2-100 characters');
  }

  if (body.customerEmail && typeof body.customerEmail === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail) || body.customerEmail.length > 255) {
      errors.push('Invalid email format');
    }
  }

  if (body.customerPhone && typeof body.customerPhone === 'string') {
    const cleaned = body.customerPhone.replace(/\s/g, '');
    if (!/^\+?44\d{10}$|^0\d{10}$/.test(cleaned)) {
      errors.push('Invalid UK phone number');
    }
  }

  if (body.total !== undefined && body.total !== null) {
    if (typeof body.total !== 'number' || body.total < 0 || body.total > 100000) {
      errors.push('total must be a number between 0 and 100000');
    }
  }

  if (body.items && Array.isArray(body.items) && body.items.length > 50) {
    errors.push('Maximum 50 items per order');
  }

  return errors;
}

// Sanitize string to prevent XSS in email HTML
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  // Authenticate: verify Supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Validate input
    const inputErrors = validateInput(req.body);
    if (inputErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', messages: inputErrors });
    }

    const {
      orderId,
      customerName,
      customerPhone,
      customerEmail,
      total,
      items,
      deliveryMethod,
      deliveryAddress
    } = req.body;

    const results = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Format items for message (sanitized)
    const itemsList = items?.map(item =>
      `• ${sanitize(item.product_name)} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}`
    ).join('\n') || 'No items';

    // 1. Send Email (if email provided and Resend API key configured)
    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        const safeCustomerName = sanitize(customerName);
        const safeOrderId = sanitize(orderId.slice(0, 8).toUpperCase());
        const safeDeliveryAddress = sanitize(deliveryAddress || 'Delivery');

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Confirmed!</h1>
            </div>

            <div style="padding: 20px; background: #f9fafb;">
              <p>Hi ${safeCustomerName},</p>
              <p>Thank you for your order from <strong>Isha's Treat</strong>!</p>

              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e3a5f;">Order #${safeOrderId}</h3>

                <p><strong>Items:</strong></p>
                <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-line;">${itemsList}</div>

                <p style="margin-top: 16px;"><strong>Total:</strong> £${total?.toFixed(2) || '0.00'}</p>
                <p><strong>Delivery:</strong> ${deliveryMethod === 'collection' ? 'Collection' : safeDeliveryAddress}</p>
              </div>

              <p>We'll notify you when your order is ready${deliveryMethod === 'delivery' ? ' for delivery' : ' for collection'}.</p>

              <p style="color: #6b7280; font-size: 14px;">
                Questions? Reply to this email or WhatsApp us at 07448682282
              </p>
            </div>

            <div style="background: #1e3a5f; color: white; padding: 16px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Isha's Treat & Groceries</p>
            </div>
          </div>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Isha\'s Treat <orders@apinlero.co.uk>',
            to: customerEmail,
            subject: `Order Confirmed - #${orderId.slice(0, 8).toUpperCase()}`,
            html: emailHtml
          })
        });

        if (emailResponse.ok) {
          results.email.sent = true;
        } else {
          const errorData = await emailResponse.json();
          results.email.error = errorData.message || 'Failed to send email';
        }
      } catch (emailError) {
        results.email.error = emailError.message;
      }
    } else if (customerEmail && !process.env.RESEND_API_KEY) {
      results.email.error = 'Email service not configured';
    }

    // 2. Send WhatsApp (if phone provided and Twilio configured)
    if (customerPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const whatsappMessage = `✅ *Order Confirmed!*

Hi ${customerName}, thank you for your order from Isha's Treat!

📦 *Order #${orderId.slice(0, 8).toUpperCase()}*

${itemsList}

💰 *Total:* £${total?.toFixed(2) || '0.00'}
🚚 *${deliveryMethod === 'collection' ? 'Collection' : 'Delivery to: ' + (deliveryAddress || 'TBC')}*

We'll message you when your order is ready!

Questions? Just reply to this message.`;

        // Format phone for WhatsApp
        let formattedPhone = customerPhone.replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+44' + formattedPhone.slice(1);
        }
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

        const whatsappResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
            To: `whatsapp:${formattedPhone}`,
            Body: whatsappMessage
          })
        });

        if (whatsappResponse.ok) {
          results.whatsapp.sent = true;
        } else {
          const errorData = await whatsappResponse.json();
          results.whatsapp.error = errorData.message || 'Failed to send WhatsApp';
        }
      } catch (whatsappError) {
        results.whatsapp.error = whatsappError.message;
      }
    } else if (customerPhone && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)) {
      results.whatsapp.error = 'WhatsApp service not configured';
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({
      error: 'Failed to send notifications'
    });
  }
}
