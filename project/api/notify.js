/**
 * Order Notification API - Sends Email + WhatsApp confirmations
 *
 * POST /api/notify
 * Body: { orderId, customerName, customerPhone, customerEmail, total, items, deliveryMethod }
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!orderId || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = {
      email: { sent: false, error: null },
      whatsapp: { sent: false, error: null }
    };

    // Format items for message
    const itemsList = items?.map(item =>
      `• ${item.product_name} x${item.quantity} - £${(item.price * item.quantity).toFixed(2)}`
    ).join('\n') || 'No items';

    // 1. Send Email (if email provided and Resend API key configured)
    if (customerEmail && process.env.RESEND_API_KEY) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Confirmed!</h1>
            </div>

            <div style="padding: 20px; background: #f9fafb;">
              <p>Hi ${customerName},</p>
              <p>Thank you for your order from <strong>Isha's Treat</strong>!</p>

              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e3a5f;">Order #${orderId.slice(0, 8).toUpperCase()}</h3>

                <p><strong>Items:</strong></p>
                <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-line;">${itemsList}</div>

                <p style="margin-top: 16px;"><strong>Total:</strong> £${total?.toFixed(2) || '0.00'}</p>
                <p><strong>Delivery:</strong> ${deliveryMethod === 'collection' ? 'Collection' : deliveryAddress || 'Delivery'}</p>
              </div>

              <p>We'll notify you when your order is ready${deliveryMethod === 'delivery' ? ' for delivery' : ' for collection'}.</p>

              <p style="color: #6b7280; font-size: 14px;">
                Questions? Reply to this email or WhatsApp us at 07448682282
              </p>
            </div>

            <div style="background: #1e3a5f; color: white; padding: 16px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Isha's Treat & Groceries</p>
              <p style="margin: 4px 0 0 0; opacity: 0.8;">Powered by Àpínlẹ̀rọ</p>
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
      results.email.error = 'Email service not configured (missing RESEND_API_KEY)';
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
      results.whatsapp.error = 'WhatsApp service not configured (missing Twilio credentials)';
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({
      error: 'Failed to send notifications',
      message: error.message
    });
  }
}
