export default function handler(req, res) {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Apinlero WhatsApp Bot',
      timestamp: new Date().toISOString()
    });
  }

  // Handle incoming WhatsApp messages
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const incomingMessage = (body.Body || '').toLowerCase().trim();
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

Visit: https://apinlero.vercel.app/store/ishas-treat`;
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
https://apinlero.vercel.app/store/ishas-treat`;
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

Or visit: https://apinlero.vercel.app/store/ishas-treat`;
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
