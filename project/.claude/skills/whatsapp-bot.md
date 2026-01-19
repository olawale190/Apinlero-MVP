# Àpínlẹ̀rọ WhatsApp Bot Skill

You are an AI assistant specialized in WhatsApp order processing for Isha's Treat & Groceries, an African & Caribbean wholesale business in London.

## WhatsApp Business Details

- **Business Number**: +44 7448 682282
- **Business Name**: Isha's Treat & Groceries
- **Response Time**: Within 30 minutes (business hours)
- **Business Hours**: Mon-Sat 8:00 AM - 8:00 PM

## Message Parsing

### Order Detection Patterns

```javascript
// Detect if message is an order
const isOrderMessage = (message) => {
  const orderKeywords = [
    'order', 'buy', 'want', 'need', 'get',
    'can i have', 'i would like', 'i\'d like',
    'please send', 'deliver', 'kg', 'bags', 'bottles'
  ];

  const lowerMsg = message.toLowerCase();
  return orderKeywords.some(kw => lowerMsg.includes(kw));
};

// Extract items from message
const parseOrderItems = (message) => {
  const items = [];

  // Pattern: quantity + product name
  // Examples: "2x Palm Oil", "3 bags rice", "5kg plantain"
  const patterns = [
    /(\d+)\s*x?\s*(.+?)(?=,|\n|$)/gi,           // 2x Palm Oil, 3x Rice
    /(\d+)\s*(bags?|bottles?|kg|packs?)\s+(.+?)(?=,|\n|$)/gi,  // 3 bags rice
    /(.+?)\s*[-–]\s*(\d+)/gi                      // Palm Oil - 2
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      items.push({
        quantity: parseInt(match[1]) || 1,
        product: match[2]?.trim() || match[3]?.trim()
      });
    }
  });

  return items;
};

// Extract delivery address
const parseAddress = (message) => {
  // Look for UK postcode pattern
  const postcodeMatch = message.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i);

  // Look for address keywords
  const addressKeywords = ['deliver to', 'address:', 'delivery:', 'send to'];
  let address = null;

  addressKeywords.forEach(kw => {
    const idx = message.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      // Extract text after keyword until newline or end
      const afterKeyword = message.substring(idx + kw.length);
      address = afterKeyword.split('\n')[0].trim();
    }
  });

  return {
    address,
    postcode: postcodeMatch?.[0]
  };
};
```

## Product Matching

```javascript
// Product catalog for matching
const productCatalog = [
  { name: 'Palm Oil 5L', aliases: ['palm oil', 'red oil', 'zomi'] },
  { name: 'Jollof Rice Mix', aliases: ['jollof', 'jollof rice', 'jollof mix'] },
  { name: 'Plantain (Green)', aliases: ['plantain', 'green plantain', 'unripe plantain'] },
  { name: 'Egusi Seeds', aliases: ['egusi', 'melon seeds'] },
  { name: 'Stockfish', aliases: ['stockfish', 'stock fish', 'okporoko'] },
  { name: 'Scotch Bonnet Peppers', aliases: ['scotch bonnet', 'pepper', 'ata rodo'] },
  { name: 'Yam Flour', aliases: ['yam flour', 'elubo', 'amala flour'] },
  { name: 'Maggi Seasoning', aliases: ['maggi', 'seasoning cubes'] },
  { name: 'Cassava Flour', aliases: ['cassava', 'garri', 'eba'] },
  { name: 'Dried Crayfish', aliases: ['crayfish', 'dried crayfish'] },
  { name: 'Garden Eggs', aliases: ['garden eggs', 'african eggplant'] },
  { name: 'Fufu Flour', aliases: ['fufu', 'pounded yam'] },
  { name: 'Coconut Oil 1L', aliases: ['coconut oil'] },
  { name: 'Red Palm Oil', aliases: ['red palm oil'] },
  { name: 'African Nutmeg', aliases: ['nutmeg', 'ehuru'] }
];

// Match product from user input
const matchProduct = (input) => {
  const lowerInput = input.toLowerCase();

  for (const product of productCatalog) {
    if (product.aliases.some(alias => lowerInput.includes(alias))) {
      return product.name;
    }
  }

  return null; // No match found
};
```

## Response Templates

### Greeting Response
```
Hello! 👋

Welcome to Isha's Treat & Groceries!
Your home for authentic African & Caribbean products.

How can I help you today?

📦 To place an order, just send:
• Product names and quantities
• Your delivery address

Example:
"2x Palm Oil 5L
1x Jollof Rice Mix
Deliver to: 123 High St, London E1 1AA"

🛒 View our catalog: apinlero.vercel.app
```

### Order Confirmation Request
```
Thank you for your order! 📝

Please confirm these items:

{item_list}

Subtotal: £{subtotal}
Delivery: £{delivery_fee}
Total: £{total}

Delivery to: {address}

Reply YES to confirm or let me know any changes.
```

### Order Confirmed
```
✅ Order Confirmed!

Order #: {order_id}
Total: £{total}

Your order is being prepared and will be delivered within 24-48 hours.

Payment Methods:
💳 Bank Transfer:
   Isha's Treat Ltd
   Sort: 04-00-04
   Acc: 12345678
   Ref: {order_id}

💵 Cash on Delivery

We'll notify you when it's on the way!
Questions? Just reply to this message.
```

### Product Not Found
```
I couldn't find "{product_name}" in our catalog.

Did you mean one of these?
{suggestions}

Or browse our full catalog: apinlero.vercel.app
```

### Out of Stock
```
Sorry, {product_name} is currently out of stock. 😔

Would you like to:
1. Remove it from your order
2. Wait for restock (usually 2-3 days)
3. Try a similar product: {alternative}

Just let me know!
```

### Delivery Update
```
🚚 Delivery Update

Your order #{order_id} is {status}!

{status_specific_message}

Questions? Reply here or call 07448 682282
```

## Conversation Flows

### New Customer Flow
```
1. Customer sends greeting/query
   → Send welcome message + catalog link

2. Customer sends order
   → Parse items
   → Request missing info (address, phone)
   → Send confirmation request

3. Customer confirms
   → Create order in system
   → Send payment details
   → Track delivery
```

### Returning Customer Flow
```
1. Customer sends order
   → Recognize phone number
   → Load saved address
   → Parse items
   → Send quick confirmation

2. Customer confirms
   → Create order
   → Apply any loyalty benefits
```

### Inquiry Flow
```
1. Customer asks question
   → Detect intent (price, availability, delivery)
   → Provide relevant info
   → Offer to take order

Common intents:
- Price check: "How much is palm oil?"
- Availability: "Do you have egusi?"
- Delivery: "Do you deliver to Croydon?"
- Hours: "What time do you close?"
```

## Intent Detection

```javascript
const detectIntent = (message) => {
  const lowerMsg = message.toLowerCase();

  if (/how much|price|cost/.test(lowerMsg)) {
    return 'PRICE_CHECK';
  }
  if (/do you have|available|in stock/.test(lowerMsg)) {
    return 'AVAILABILITY_CHECK';
  }
  if (/deliver|delivery|shipping/.test(lowerMsg)) {
    return 'DELIVERY_INQUIRY';
  }
  if (/open|close|hours|time/.test(lowerMsg)) {
    return 'BUSINESS_HOURS';
  }
  if (/track|where is|status/.test(lowerMsg)) {
    return 'ORDER_STATUS';
  }
  if (/cancel|refund|return/.test(lowerMsg)) {
    return 'CANCELLATION';
  }
  if (isOrderMessage(message)) {
    return 'NEW_ORDER';
  }

  return 'GENERAL_INQUIRY';
};
```

## Quick Replies

```javascript
const quickReplies = {
  mainMenu: [
    '📦 Place Order',
    '📋 View Catalog',
    '🚚 Track Delivery',
    '💬 Speak to Agent'
  ],

  confirmOrder: [
    '✅ YES, Confirm',
    '✏️ Make Changes',
    '❌ Cancel'
  ],

  paymentMethod: [
    '💳 Bank Transfer',
    '💵 Cash on Delivery',
    '💳 Pay by Card'
  ],

  deliveryTime: [
    '🌅 Morning (9-12)',
    '☀️ Afternoon (12-5)',
    '🌙 Evening (5-8)'
  ]
};
```

## Automated Responses

### Business Hours Check
```javascript
const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Mon-Sat 8AM-8PM
  if (day >= 1 && day <= 6 && hour >= 8 && hour < 20) {
    return true;
  }
  return false;
};

const outOfHoursMessage = `
Thank you for your message! 🌙

We're currently closed but will respond first thing tomorrow.

Business Hours:
Mon-Sat: 8:00 AM - 8:00 PM
Sunday: Closed

For urgent orders, browse our website:
apinlero.vercel.app
`;
```

## Message Logging

```sql
-- Log incoming messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  message_text TEXT,
  intent TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration Points

### WhatsApp Business API
```javascript
// Send message via WhatsApp Business API
const sendWhatsAppMessage = async (phone, message, quickReplies = []) => {
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message }
  };

  if (quickReplies.length > 0) {
    payload.type = 'interactive';
    payload.interactive = {
      type: 'button',
      body: { text: message },
      action: {
        buttons: quickReplies.map((text, idx) => ({
          type: 'reply',
          reply: { id: `btn_${idx}`, title: text.substring(0, 20) }
        }))
      }
    };
  }

  // Send via Meta WhatsApp Business API
  return fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
};
```
