/**
 * Àpínlẹ̀rọ Response Templates
 *
 * Pre-defined response templates for WhatsApp bot
 */

const TEMPLATES = {
  // Warm, friendly greeting
  GREETING: ({ customerName }) => ({
    text: `Hey${customerName ? ` ${customerName}` : ''}! 😊 How are you doing?

I can help you with your order today! Just tell me what you need - like "I need 2 bottles of palm oil" or "do you have egusi?"

No rush, I'm here to help! 🙌`,
    buttons: ['📦 Order', '📋 See Products', '🔄 Reorder']
  }),

  ORDER_CONFIRMATION: ({ items, subtotal, deliveryFee, total, address, deliveryZone, notFound, suggestions }) => {
    let itemList = items.map(item =>
      `• ${item.quantity}x ${item.product_name} - £${item.subtotal.toFixed(2)}`
    ).join('\n');

    let notFoundText = notFound && notFound.length > 0
      ? `\n\n⚠️ I couldn't find: ${notFound.join(', ')} - would you like something else instead?`
      : '';

    let suggestionText = suggestions ? suggestions : '';

    return {
      text: `Perfect! Let me get that sorted for you 😊

${itemList}

Delivery to ${address || 'your address'}: £${deliveryFee.toFixed(2)}
Total: £${total.toFixed(2)}${suggestionText}${notFoundText}

Everything look good? Just say "yes" and I'll get it ready!`,
      buttons: ['✅ Yes', '✏️ Make Changes', '❌ Cancel']
    };
  },

  ORDER_CONFIRMED: ({ orderId, total, address, deliveryEstimate }) => ({
    text: `✅ Perfect! Your order's confirmed!

Order #: ${orderId.substring(0, 8).toUpperCase()}
Total: £${total.toFixed(2)}

You can pay:
• 💳 Online: https://ishas-treat.apinlero.com/checkout?order=${orderId.substring(0, 8)}
• 💵 Cash when it arrives
• 🏦 Bank transfer:
  Isha's Treat Ltd
  Sort: 04-00-04
  Acc: 12345678
  Ref: ${orderId.substring(0, 8).toUpperCase()}

Delivery: ${deliveryEstimate}
I'll let you know when it's on the way! 📦`,
    buttons: ['💳 Pay Now', '💵 Cash on Delivery']
  }),

  NEED_ADDRESS: ({ items, subtotal, notFound }) => {
    const itemList = items.map(item =>
      `• ${item.quantity}x ${item.product_name} - £${item.subtotal.toFixed(2)}`
    ).join('\n');

    return {
      text: `Great! So that's:

${itemList}
Subtotal: £${subtotal.toFixed(2)}

📍 Send me your postcode and I'll calculate delivery for you!`,
      buttons: []
    };
  },

  STILL_NEED_ADDRESS: () => ({
    text: `I still need your delivery address to complete the order.

Please send your full address with postcode.

Example: "45 High Street, London E1 4AA"`,
    buttons: []
  }),

  ORDER_UNCLEAR: () => ({
    text: `Hey! I'm not quite sure what you're looking for there 😅

Could you tell me what you need? You can say it however you like - like:
• "I need 2 palm oil"
• "Can I get some egusi and rice"
• "Do you have plantain?"

I'll understand! Or you can browse everything here: ishas-treat.apinlero.com`,
    buttons: ['📋 View Catalog', '💬 Help']
  }),

  PRODUCTS_NOT_FOUND: ({ products }) => ({
    text: `Hmm, I couldn't find these in our catalog:
${products.map(p => `• ${p}`).join('\n')}

Did you mean something like:
• Palm Oil 5L
• Jollof Rice Mix
• Plantain (Green)
• Egusi Seeds
• Stockfish

Or browse everything: ishas-treat.apinlero.com`,
    buttons: ['📋 View Catalog', '💬 Help']
  }),

  NO_PENDING_ORDER: () => ({
    text: `You don't have a pending order to confirm.

Would you like to place a new order?

Just send:
• Product names and quantities
• Your delivery address`,
    buttons: ['📦 Place Order', '📋 View Catalog']
  }),

  ORDER_EDIT_PROMPT: () => ({
    text: `No problem! What would you like to change?

You can:
• Add more items
• Remove items
• Change quantities
• Update delivery address

Just tell me what you'd like to change.`,
    buttons: ['🔄 Start Over', '❌ Cancel Order']
  }),

  ORDER_CANCELLED: () => ({
    text: `No worries, I've cancelled that for you! 👍

Feel free to place a new order whenever you're ready.

Browse our products: ishas-treat.apinlero.com`,
    buttons: ['📦 New Order', '📋 View Catalog']
  }),

  PRICE_INFO: ({ product, price, unit, inStock }) => ({
    text: `💰 ${product}

Price: £${price.toFixed(2)} per ${unit || 'item'}
${inStock ? '✅ In Stock' : '❌ Currently out of stock'}

Would you like to order this item?`,
    buttons: inStock ? ['📦 Order Now', '📋 View More'] : ['📋 View Alternatives']
  }),

  PRICE_NOT_FOUND: () => ({
    text: `I couldn't find that product.

Please check our catalog for available products:
ishas-treat.apinlero.com

Or ask about a specific product like:
"How much is palm oil?"`,
    buttons: ['📋 View Catalog']
  }),

  AVAILABILITY_INFO: ({ product, inStock, quantity }) => ({
    text: `📦 ${product}

${inStock
  ? `✅ In Stock (${quantity} available)`
  : '❌ Currently out of stock'}

${inStock ? 'Would you like to place an order?' : 'Check back soon or try an alternative.'}`,
    buttons: inStock ? ['📦 Order Now'] : ['📋 View Alternatives']
  }),

  PRODUCT_NOT_FOUND: () => ({
    text: `I couldn't find that product in our catalog.

Browse all products: ishas-treat.apinlero.com`,
    buttons: ['📋 View Catalog']
  }),

  DELIVERY_INFO: ({ postcode, zone, fee, estimate }) => ({
    text: `🚚 Delivery to ${postcode}

Zone: ${zone}
Delivery Fee: £${fee.toFixed(2)}
Estimated Time: ${estimate}

Ready to place an order?`,
    buttons: ['📦 Place Order', '📋 View Catalog']
  }),

  DELIVERY_GENERAL: () => ({
    text: `🚚 Delivery Information

We deliver across London:

Zone 1-2 (E, N): £5.00 - Same day
Zone 3 (SE): £5.00 - Next day
Zone 4-6 (SW, W, NW): £7.00 - Next day
Outer London: £10.00 - 2-3 days

Free delivery on orders over £50!

Send your postcode for exact pricing.`,
    buttons: ['📦 Place Order', '💬 Contact Us']
  }),

  BUSINESS_HOURS: ({ isOpen }) => ({
    text: `🕐 Business Hours

Monday - Saturday: 8:00 AM - 8:00 PM
Sunday: Closed

${isOpen
  ? '✅ We are currently OPEN'
  : '😴 We are currently CLOSED'}

${isOpen
  ? 'How can I help you today?'
  : 'Leave a message and we\'ll respond first thing tomorrow!'}`,
    buttons: isOpen ? ['📦 Place Order'] : ['📋 View Catalog']
  }),

  ORDER_STATUS: ({ orderId, status, total, createdAt }) => {
    const date = new Date(createdAt).toLocaleDateString('en-GB');
    const statusEmoji = {
      'Pending': '⏳',
      'Confirmed': '✅',
      'Out for Delivery': '🚚',
      'Delivered': '📦',
      'Cancelled': '❌'
    };

    return {
      text: `📋 Order Status

Order #: ${orderId.substring(0, 8).toUpperCase()}
Status: ${statusEmoji[status] || '📋'} ${status}
Total: £${total.toFixed(2)}
Date: ${date}

Questions about your order? Just reply here.`,
      buttons: ['💬 Contact Us']
    };
  },

  NO_ORDERS_FOUND: () => ({
    text: `I couldn't find any orders for your phone number.

Would you like to place a new order?`,
    buttons: ['📦 Place Order', '📋 View Catalog']
  }),

  ORDER_STATUS_ERROR: () => ({
    text: `Sorry, I couldn't retrieve your order status right now.

Please try again later or contact us directly:
📞 07448 682282`,
    buttons: ['💬 Contact Us']
  }),

  ORDER_FAILED: () => ({
    text: `Sorry, there was an error processing your order. 😔

Please try again or contact us directly:
📞 07448 682282
📧 WhatsApp this number

We apologize for the inconvenience.`,
    buttons: ['🔄 Try Again', '💬 Contact Us']
  }),

  CANCELLED: () => ({
    text: `Okay, I've cancelled that for you.

Is there anything else I can help with?`,
    buttons: ['📦 Place Order', '📋 View Catalog']
  }),

  THANKS: ({ customerName }) => ({
    text: `You're welcome${customerName ? `, ${customerName}` : ''}! 😊

Thank you for choosing Isha's Treat & Groceries.

Is there anything else I can help with?`,
    buttons: ['📦 Place Order', '📋 View Catalog']
  }),

  GENERAL_HELP: () => ({
    text: `Hey! 😊 I'm here to help you order from Isha's Treat!

You can:
• Tell me what you need - "I need palm oil and egusi"
• Ask about prices - "how much is the plantain?"
• Check delivery - "can you deliver to SE15?"
• Browse products - just ask!

Just chat with me like normal, I'll understand! 💬

Need to speak to someone? Call 07448 682282

Or browse everything: ishas-treat.apinlero.com`,
    buttons: ['📋 View Products', '📦 Place Order', '💬 Contact Us']
  }),

  ERROR: () => ({
    text: `Sorry, something went wrong. 😔

Please try again or contact us:
📞 07448 682282

We apologize for the inconvenience.`,
    buttons: ['🔄 Try Again', '💬 Contact Us']
  }),

  OUT_OF_HOURS: () => ({
    text: `Hey there! 😊

We've finished for the day but I've got your message! We'll get back to you first thing in the morning.

We're open:
Mon-Sat: 8:00 AM - 8:00 PM
Sunday: Closed

If you want to browse what we have, check out: ishas-treat.apinlero.com

Speak soon! 💚`,
    buttons: ['📋 View Catalog']
  }),

  PAYMENT_CONFIRMED: ({ method, orderId }) => ({
    text: `✅ Payment Method Confirmed!

Order #: ${orderId}
Payment: ${method}

${method === 'Cash on Delivery'
  ? `💵 Please have the exact amount ready when your order arrives.`
  : method === 'Bank Transfer'
    ? `🏦 Please transfer to:
  Isha's Treat Ltd
  Sort: 04-00-04
  Acc: 12345678
  Ref: ${orderId}

Once transferred, we'll confirm receipt and dispatch your order.`
    : `💳 You can pay securely at:
https://ishas-treat.apinlero.com/checkout?order=${orderId}`
}

We'll notify you when your order is ready for delivery.

Thank you for your order! 🙏`,
    buttons: ['📍 Track Order', '💬 Contact Us']
  }),

  NO_PRODUCTS: () => ({
    text: `Sorry, we couldn't load our product catalog right now. 😔

Please try again in a moment or browse our website:
ishas-treat.apinlero.com

Or contact us directly:
📞 07448 682282`,
    buttons: ['🔄 Try Again', '💬 Contact Us']
  }),

  // Quick confirmation for complete one-message orders
  QUICK_CONFIRM: ({ items, subtotal, deliveryFee, total, address, deliveryZone }) => {
    const itemList = items.map(item =>
      `${item.quantity}x ${item.product_name} £${item.subtotal.toFixed(2)}`
    ).join('\n');

    return {
      text: `📦 *Order Summary*

${itemList}

Delivery: £${deliveryFee.toFixed(2)}
*Total: £${total.toFixed(2)}*
📍 ${address}

Reply YES to confirm`,
      buttons: ['✅ YES', '❌ Cancel']
    };
  },

  // Auto-confirmed order (for returning customers)
  AUTO_CONFIRMED: ({ orderId, items, total, address, deliveryEstimate }) => {
    const itemList = items.map(item =>
      `${item.quantity}x ${item.product_name}`
    ).join(', ');

    return {
      text: `✅ *Order Confirmed!*

#${orderId.substring(0, 8).toUpperCase()}
${itemList}
Total: £${total.toFixed(2)}
📍 ${address}

💳 Pay: bank transfer or cash
Delivery: ${deliveryEstimate}`,
      buttons: ['💵 Cash', '🏦 Bank Transfer']
    };
  },

  // Reorder confirmation
  REORDER_CONFIRM: ({ items, subtotal, deliveryFee, total, address, orderDate }) => {
    const itemList = items.map(item =>
      `${item.quantity}x ${item.product_name}`
    ).join('\n');
    const date = new Date(orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return {
      text: `🔄 *Repeat your ${date} order?*

${itemList}

Total: £${total.toFixed(2)}
📍 ${address}

Reply YES to confirm`,
      buttons: ['✅ YES', '✏️ Change', '❌ Cancel']
    };
  },

  // No previous order found
  NO_PREVIOUS_ORDER: () => ({
    text: `No previous orders found.

Tell me what you'd like:
"2x palm oil to SE15 4AA"`,
    buttons: ['📋 Products', '💬 Help']
  }),

  // Reorder error
  REORDER_ERROR: () => ({
    text: `Couldn't load your last order.

Please place a new order:
"2x palm oil to SE15 4AA"`,
    buttons: ['📦 New Order', '💬 Help']
  }),

  // Quick order unclear
  QUICK_ORDER_UNCLEAR: () => ({
    text: `What would you like to order?

Example: "quick palm oil" or "quick 2x egusi"`,
    buttons: ['📋 Products']
  }),

  // NEW: Typo confirmation
  TYPO_CONFIRMATION: ({ items, originalText, correctedText, subtotal, deliveryFee, total, address }) => ({
    text: `Just checking - did you mean *${correctedText}* (not "${originalText}")? 😊

So that's:
${items.map(item => `• ${item.quantity}x ${item.product_name} - £${item.subtotal.toFixed(2)}`).join('\n')}

${address ? `Delivery to ${address}: £${deliveryFee.toFixed(2)}` : 'Send your postcode for delivery'}
Total: £${total.toFixed(2)}

Say "yes" if that's right, or tell me what you actually need!`,
    buttons: ['✅ Yes, that\'s right', '✏️ Let me correct it']
  }),

  // Re-prompt templates for state-based conversations
  REPROMPT_CONFIRMATION: ({ items, total }) => ({
    text: `Sorry, I didn't quite catch that! 😅

Just to confirm your order:
${items.map(item => `• ${item.quantity}x ${item.product_name}`).join('\n')}
Total: £${total.toFixed(2)}

Reply "yes" to confirm, "no" to cancel, or tell me what you'd like to change.`,
    buttons: ['✅ Yes', '❌ No', '✏️ Make Changes']
  }),

  REPROMPT_PAYMENT: ({ orderId }) => ({
    text: `How would you like to pay for order #${orderId}? 💳

Just reply with:
• "cash" - pay when it arrives
• "card" - pay online now
• "transfer" - bank transfer

Or tap one of the buttons below!`,
    buttons: ['💵 Cash', '💳 Card', '🏦 Transfer']
  }),

  REPROMPT_ADDRESS: ({ items, subtotal }) => ({
    text: `I still need your delivery address to complete the order! 📍

Your order so far:
${items.map(item => `• ${item.quantity}x ${item.product_name}`).join('\n')}
Subtotal: £${subtotal.toFixed(2)}

Please send your full address with postcode, like:
"45 High Street, London E1 4AA"`,
    buttons: []
  })
};

/**
 * Generate a response from template
 * @param {string} templateName - Name of the template
 * @param {Object} params - Parameters for the template
 * @returns {Object} - {text, buttons}
 */
export function generateResponse(templateName, params = {}) {
  const template = TEMPLATES[templateName];

  if (!template) {
    console.error(`Template not found: ${templateName}`);
    return TEMPLATES.ERROR();
  }

  if (typeof template === 'function') {
    return template(params);
  }

  return template;
}
