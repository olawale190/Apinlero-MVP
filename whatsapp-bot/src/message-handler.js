/**
 * Àpínlẹ̀rọ Message Handler v2.0.0
 *
 * Processes incoming WhatsApp messages and generates responses
 * Manages conversation state and order flow with Supabase persistence
 * Now supports multi-tenant operations with business context
 */

import { parseMessage, matchProduct, getDeliveryZone, isCompleteOrder } from './message-parser.js';
import {
  getProducts,
  createOrder,
  getOrderByPhone,
  updateOrderPayment,
  getSession,
  saveSession,
  deleteSession,
  getOrCreateCustomer,
  logMessage,
  getCustomerByPhone,
  updateCustomerAddress,
  getLastOrder
} from './supabase-client.js';
import { generateResponse } from './response-templates.js';

// Auto-confirm threshold for returning customers
const AUTO_CONFIRM_THRESHOLD = 30; // £30 for orders below this amount
const MIN_ORDERS_FOR_AUTO_CONFIRM = 2; // Minimum past orders to enable auto-confirm

// In-memory cache for sessions (backed by Supabase)
// Key format: `${businessId || 'default'}:${phone}`
const sessionCache = new Map();

/**
 * Generate session cache key for multi-tenant support
 * @param {string} phone - Customer phone number
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
function getSessionKey(phone, businessId = null) {
  return businessId ? `${businessId}:${phone}` : `default:${phone}`;
}

/**
 * Get or create conversation state for a customer
 * Uses Supabase for persistence with in-memory cache
 * @param {string} phone - Customer phone number
 * @param {string|null} customerName - Customer name from WhatsApp profile
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
async function getConversation(phone, customerName = null, businessId = null) {
  const cacheKey = getSessionKey(phone, businessId);

  // Check cache first
  let conversation = sessionCache.get(cacheKey);

  if (!conversation) {
    // Try to load from Supabase (pass businessId for tenant-scoped query)
    conversation = await getSession(phone, businessId);
  }

  if (conversation) {
    conversation.lastActivity = Date.now();
    conversation.businessId = businessId; // Ensure businessId is set
    sessionCache.set(cacheKey, conversation);
    return conversation;
  }

  // Get or create customer record (scoped to business if multi-tenant)
  const customer = await getOrCreateCustomer(phone, customerName, businessId);

  // Create new conversation
  conversation = {
    phone,
    businessId,
    state: 'INITIAL',
    pendingOrder: null,
    lastActivity: Date.now(),
    context: {},
    customerId: customer?.id || null,
    customerName: customer?.name || customerName
  };

  sessionCache.set(cacheKey, conversation);
  await saveSession(phone, conversation, businessId);

  return conversation;
}

/**
 * Update conversation state
 * @param {string} phone - Customer phone number
 * @param {Object} updates - Fields to update
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
async function updateConversation(phone, updates, businessId = null) {
  const cacheKey = getSessionKey(phone, businessId);
  const conversation = sessionCache.get(cacheKey) || { phone, businessId };
  Object.assign(conversation, updates, { lastActivity: Date.now() });
  sessionCache.set(cacheKey, conversation);

  // Persist to Supabase
  await saveSession(phone, conversation, businessId);

  return conversation;
}

/**
 * Clear conversation state
 * @param {string} phone - Customer phone number
 * @param {string|null} businessId - Business ID for multi-tenant mode
 */
async function clearConversation(phone, businessId = null) {
  const cacheKey = getSessionKey(phone, businessId);
  sessionCache.delete(cacheKey);
  await deleteSession(phone, businessId);
}

/**
 * Main message handler
 * @param {Object} params - Message parameters
 * @param {string} params.from - Customer phone number
 * @param {string} params.customerName - Customer name from profile
 * @param {string} params.text - Message text
 * @param {string} params.messageId - Unique message ID
 * @param {string} params.provider - 'twilio' or 'meta'
 * @param {string|null} params.businessId - Business ID for multi-tenant mode
 * @param {string} params.buttonId - Button ID if interactive reply
 * @param {string} params.listId - List item ID if interactive reply
 * @param {string} params.mediaId - Media ID if media message
 * @param {string} params.messageType - Message type (text, image, etc.)
 * @returns {Object} - Response {text, buttons}
 */
export async function handleIncomingMessage({
  from,
  customerName,
  text,
  messageId,
  provider = 'twilio',
  businessId = null,
  buttonId = null,
  listId = null,
  mediaId = null,
  messageType = 'text'
}) {
  // Get conversation with business context
  const conversation = await getConversation(from, customerName, businessId);

  // If this is a button/list reply, use the ID as the text for intent parsing
  const messageText = buttonId || listId || text || '';

  const parsed = await parseMessage(messageText);

  console.log(`📝 Parsed message:`, {
    intent: parsed.intent,
    items: parsed.items.length,
    state: conversation.state,
    customer: conversation.customerName || customerName,
    businessId: businessId || 'default',
    provider,
    messageType,
    neo4j: parsed.neo4jEnabled ? '🧠 Active' : '⚠️ Fallback'
  });

  // Log inbound message (with business context)
  await logMessage(from, 'inbound', messageText, parsed.intent, null, businessId);

  // Handle based on intent and conversation state
  try {
    let response;

    switch (parsed.intent) {
      case 'GREETING':
        response = handleGreeting(customerName, conversation);
        break;

      case 'PRODUCTS_LIST':
        response = await handleProductsList();
        break;

      case 'START_ORDER':
        response = await handleStartOrder(conversation);
        break;

      case 'NEW_ORDER':
        response = await handleNewOrder(from, customerName, parsed, conversation);
        break;

      case 'REORDER':
        response = await handleReorder(from, customerName, conversation);
        break;

      case 'QUICK_ORDER':
        response = await handleQuickOrder(from, customerName, text, conversation);
        break;

      case 'CONFIRM':
        response = await handleConfirmation(from, customerName, conversation);
        break;

      case 'DECLINE':
        response = handleDecline(conversation);
        break;

      case 'PRICE_CHECK':
        response = await handlePriceCheck(text);
        break;

      case 'AVAILABILITY':
        response = await handleAvailability(text);
        break;

      case 'DELIVERY_INQUIRY':
        response = handleDeliveryInquiry(parsed);
        break;

      case 'BUSINESS_HOURS':
        response = handleBusinessHours(parsed.isBusinessHours);
        break;

      case 'ORDER_STATUS':
        response = await handleOrderStatus(from);
        break;

      case 'CANCEL':
        response = await handleCancel(conversation);
        break;

      case 'THANKS':
        response = handleThanks(customerName);
        break;

      case 'PAYMENT_CASH':
        response = await handlePaymentChoice(from, conversation, 'cash');
        break;

      case 'PAYMENT_CARD':
        response = await handlePaymentChoice(from, conversation, 'card');
        break;

      case 'PAYMENT_TRANSFER':
        response = await handlePaymentChoice(from, conversation, 'bank_transfer');
        break;

      default:
        response = await handleGeneralInquiry(text, conversation);
    }

    // Log outbound message
    if (response) {
      await logMessage(from, 'outbound', response.text, parsed.intent, conversation.lastOrderId);
    }

    return response;

  } catch (error) {
    console.error('Message handling error:', error);
    return generateResponse('ERROR');
  }
}

/**
 * Handle greeting messages
 */
function handleGreeting(customerName, conversation) {
  updateConversation(conversation.phone, { state: 'GREETED' }, conversation.businessId);
  return generateResponse('GREETING', { customerName });
}

/**
 * Handle new order requests
 * Supports one-message orders with auto-confirm for returning customers
 */
async function handleNewOrder(phone, customerName, parsed, conversation) {
  const { items, address, postcode, deliveryZone } = parsed;

  if (items.length === 0) {
    // Couldn't parse any items
    return generateResponse('ORDER_UNCLEAR');
  }

  // Get product prices from database
  const products = await getProducts();
  const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]));

  // Build order with prices
  const orderItems = [];
  const notFound = [];

  for (const item of items) {
    const product = productMap.get(item.product.toLowerCase()) ||
                    products.find(p => p.name.toLowerCase().includes(item.product.toLowerCase()));

    if (product) {
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit: item.unit,
        price: product.price,
        subtotal: product.price * item.quantity
      });
    } else {
      notFound.push(item.product);
    }
  }

  if (orderItems.length === 0) {
    return generateResponse('PRODUCTS_NOT_FOUND', { products: notFound });
  }

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = deliveryZone.fee;
  const total = subtotal + deliveryFee;

  // Check if customer has saved address (for returning customers)
  let finalAddress = address;
  let finalPostcode = postcode;

  if (!address && !postcode) {
    // Try to get saved address from customer profile
    const customer = await getCustomerByPhone(phone);
    if (customer?.default_address) {
      finalAddress = customer.default_address;
      finalPostcode = customer.default_postcode;
      console.log(`📍 Using saved address for ${customerName}: ${finalAddress}`);
    }
  }

  // Store pending order
  const pendingOrder = {
    items: orderItems,
    subtotal,
    deliveryFee,
    total,
    address: finalAddress,
    postcode: finalPostcode,
    deliveryZone: finalPostcode ? getDeliveryZone(finalPostcode) : deliveryZone,
    customerName,
    customerId: conversation.customerId,
    notFoundProducts: notFound
  };

  // Recalculate with correct delivery zone if we got saved postcode
  if (finalPostcode && !postcode) {
    pendingOrder.deliveryZone = getDeliveryZone(finalPostcode);
    pendingOrder.deliveryFee = pendingOrder.deliveryZone.fee;
    pendingOrder.total = subtotal + pendingOrder.deliveryFee;
  }

  // Check for one-message complete order with auto-confirm
  const isComplete = isCompleteOrder(items, finalPostcode);
  const customer = await getCustomerByPhone(phone);
  const isReturningCustomer = customer && customer.total_orders >= MIN_ORDERS_FOR_AUTO_CONFIRM;
  const canAutoConfirm = isReturningCustomer && pendingOrder.total < AUTO_CONFIRM_THRESHOLD;

  if (isComplete && canAutoConfirm) {
    // Auto-confirm for trusted returning customers with small orders
    console.log(`⚡ Auto-confirming order for returning customer: ${customerName}`);
    return await processAutoConfirmOrder(phone, customerName, pendingOrder, conversation);
  }

  await updateConversation(phone, {
    state: 'AWAITING_CONFIRMATION',
    pendingOrder
  }, conversation.businessId);

  // Check if we need address
  if (!finalAddress && !finalPostcode) {
    await updateConversation(phone, { state: 'AWAITING_ADDRESS' }, conversation.businessId);
    return generateResponse('NEED_ADDRESS', {
      items: orderItems,
      subtotal,
      notFound: notFound.length > 0 ? notFound : null
    });
  }

  // For complete orders, show quick confirmation
  if (isComplete) {
    return generateResponse('QUICK_CONFIRM', {
      items: orderItems,
      subtotal,
      deliveryFee: pendingOrder.deliveryFee,
      total: pendingOrder.total,
      address: finalAddress,
      deliveryZone: pendingOrder.deliveryZone
    });
  }

  // Send confirmation request
  return generateResponse('ORDER_CONFIRMATION', {
    items: orderItems,
    subtotal,
    deliveryFee: pendingOrder.deliveryFee,
    total: pendingOrder.total,
    address: finalAddress,
    deliveryZone: pendingOrder.deliveryZone,
    notFound: notFound.length > 0 ? notFound : null
  });
}

/**
 * Process auto-confirmed order (for returning customers)
 */
async function processAutoConfirmOrder(phone, customerName, pendingOrder, conversation) {
  try {
    const createdOrder = await createOrder({
      customer_name: customerName,
      phone_number: phone,
      items: pendingOrder.items,
      subtotal: pendingOrder.subtotal,
      delivery_fee: pendingOrder.deliveryFee,
      total: pendingOrder.total,
      delivery_address: pendingOrder.address,
      delivery_method: 'delivery',
      channel: 'WhatsApp',
      status: 'Pending',
      payment_method: 'pending',
      notes: `Auto-confirmed | Postcode: ${pendingOrder.postcode || 'Saved'}`,
      customer_id: conversation.customerId
    });

    await updateConversation(phone, {
      state: 'AWAITING_PAYMENT',
      pendingOrder: null,
      lastOrderId: createdOrder.id
    }, conversation.businessId);

    return generateResponse('AUTO_CONFIRMED', {
      orderId: createdOrder.id,
      items: pendingOrder.items,
      total: pendingOrder.total,
      address: pendingOrder.address,
      deliveryEstimate: pendingOrder.deliveryZone.estimatedDelivery
    });

  } catch (error) {
    console.error('Auto-confirm failed:', error);
    // Fall back to manual confirmation
    await updateConversation(phone, {
      state: 'AWAITING_CONFIRMATION',
      pendingOrder
    }, conversation.businessId);
    return generateResponse('ORDER_CONFIRMATION', {
      items: pendingOrder.items,
      subtotal: pendingOrder.subtotal,
      deliveryFee: pendingOrder.deliveryFee,
      total: pendingOrder.total,
      address: pendingOrder.address,
      deliveryZone: pendingOrder.deliveryZone
    });
  }
}

/**
 * Handle reorder request (repeat last order)
 */
async function handleReorder(phone, customerName, conversation) {
  try {
    const lastOrder = await getLastOrder(phone);

    if (!lastOrder) {
      return generateResponse('NO_PREVIOUS_ORDER');
    }

    // Store as pending order
    const pendingOrder = {
      items: lastOrder.items,
      subtotal: lastOrder.subtotal,
      deliveryFee: lastOrder.delivery_fee,
      total: lastOrder.total,
      address: lastOrder.delivery_address,
      postcode: null, // Will be extracted if available
      deliveryZone: { fee: lastOrder.delivery_fee, estimatedDelivery: 'Same day/Next day' },
      customerName,
      customerId: conversation.customerId,
      isReorder: true
    };

    await updateConversation(phone, {
      state: 'AWAITING_CONFIRMATION',
      pendingOrder
    }, conversation.businessId);

    return generateResponse('REORDER_CONFIRM', {
      items: lastOrder.items,
      subtotal: lastOrder.subtotal,
      deliveryFee: lastOrder.delivery_fee,
      total: lastOrder.total,
      address: lastOrder.delivery_address,
      orderDate: lastOrder.created_at
    });

  } catch (error) {
    console.error('Reorder failed:', error);
    return generateResponse('REORDER_ERROR');
  }
}

/**
 * Handle quick order (using saved address)
 */
async function handleQuickOrder(phone, customerName, text, conversation) {
  // Parse the product part (remove "quick" prefix)
  const productText = text.replace(/^quick\s+/i, '');
  const parsed = await parseMessage(productText);

  if (parsed.items.length === 0) {
    return generateResponse('QUICK_ORDER_UNCLEAR');
  }

  // Get customer's saved address
  const customer = await getCustomerByPhone(phone);
  if (!customer?.default_address) {
    // No saved address, fall back to regular order flow
    return handleNewOrder(phone, customerName, parsed, conversation);
  }

  // Use saved address
  parsed.address = customer.default_address;
  parsed.postcode = customer.default_postcode;
  parsed.deliveryZone = getDeliveryZone(customer.default_postcode);

  console.log(`⚡ Quick order with saved address: ${customer.default_address}`);
  return handleNewOrder(phone, customerName, parsed, conversation);
}

/**
 * Handle order confirmation
 */
async function handleConfirmation(phone, customerName, conversation) {
  if (conversation.state === 'AWAITING_ADDRESS') {
    // They confirmed but we still need address
    return generateResponse('STILL_NEED_ADDRESS');
  }

  if (conversation.state !== 'AWAITING_CONFIRMATION' || !conversation.pendingOrder) {
    return generateResponse('NO_PENDING_ORDER');
  }

  const order = conversation.pendingOrder;

  try {
    // Create order in Supabase
    const createdOrder = await createOrder({
      customer_name: customerName,
      phone_number: phone,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      delivery_address: order.address,
      delivery_method: 'delivery',
      channel: 'WhatsApp',
      status: 'Pending',
      payment_method: 'pending',
      notes: `Postcode: ${order.postcode || 'Not provided'}`,
      customer_id: conversation.customerId
    });

    // Update conversation state
    await updateConversation(phone, {
      state: 'AWAITING_PAYMENT',
      pendingOrder: null,
      lastOrderId: createdOrder.id
    }, conversation.businessId);

    return generateResponse('ORDER_CONFIRMED', {
      orderId: createdOrder.id,
      total: order.total,
      address: order.address,
      deliveryEstimate: order.deliveryZone.estimatedDelivery
    });

  } catch (error) {
    console.error('Failed to create order:', error);
    return generateResponse('ORDER_FAILED');
  }
}

/**
 * Handle payment method selection
 */
async function handlePaymentChoice(phone, conversation, method) {
  const orderId = conversation.lastOrderId;

  if (!orderId) {
    return generateResponse('NO_PENDING_ORDER');
  }

  try {
    await updateOrderPayment(orderId, method, method === 'cash' ? 'pending' : 'awaiting');

    await updateConversation(phone, {
      state: 'ORDER_COMPLETED'
    }, conversation.businessId);

    const methodLabels = {
      'cash': 'Cash on Delivery',
      'card': 'Card Payment',
      'bank_transfer': 'Bank Transfer'
    };

    return generateResponse('PAYMENT_CONFIRMED', {
      method: methodLabels[method],
      orderId: orderId.substring(0, 8).toUpperCase()
    });

  } catch (error) {
    console.error('Failed to update payment:', error);
    return generateResponse('ERROR');
  }
}

/**
 * Handle order decline/changes
 */
function handleDecline(conversation) {
  if (conversation.state === 'AWAITING_CONFIRMATION') {
    updateConversation(conversation.phone, {
      state: 'EDITING_ORDER',
      pendingOrder: conversation.pendingOrder
    }, conversation.businessId);
    return generateResponse('ORDER_EDIT_PROMPT');
  }

  updateConversation(conversation.phone, { state: 'INITIAL' }, conversation.businessId);
  return generateResponse('ORDER_CANCELLED');
}

/**
 * Handle price check requests
 */
async function handlePriceCheck(text) {
  const products = await getProducts();

  // Try Neo4j matching first
  const matched = await matchProduct(text);
  if (matched) {
    const product = products.find(p => p.name.toLowerCase() === matched.name.toLowerCase());
    if (product) {
      console.log(`💰 Price check: "${text}" → ${matched.name} (${matched.language})`);
      return generateResponse('PRICE_INFO', {
        product: product.name,
        price: product.price,
        unit: product.unit,
        inStock: product.is_active
      });
    }
  }

  // Fallback to simple name matching
  for (const product of products) {
    if (text.toLowerCase().includes(product.name.toLowerCase())) {
      return generateResponse('PRICE_INFO', {
        product: product.name,
        price: product.price,
        unit: product.unit,
        inStock: product.is_active
      });
    }
  }

  return generateResponse('PRICE_NOT_FOUND');
}

/**
 * Handle availability check
 */
async function handleAvailability(text) {
  const products = await getProducts();

  // Try Neo4j matching first
  const matched = await matchProduct(text);
  if (matched) {
    const product = products.find(p => p.name.toLowerCase() === matched.name.toLowerCase());
    if (product) {
      console.log(`📦 Availability check: "${text}" → ${matched.name} (${matched.language})`);
      return generateResponse('AVAILABILITY_INFO', {
        product: product.name,
        inStock: product.is_active,
        quantity: 'Available'
      });
    }
  }

  // Fallback to simple name matching
  for (const product of products) {
    if (text.toLowerCase().includes(product.name.toLowerCase())) {
      return generateResponse('AVAILABILITY_INFO', {
        product: product.name,
        inStock: product.is_active,
        quantity: 'Available'
      });
    }
  }

  return generateResponse('PRODUCT_NOT_FOUND');
}

/**
 * Handle delivery inquiries
 */
function handleDeliveryInquiry(parsed) {
  if (parsed.postcode) {
    const zone = getDeliveryZone(parsed.postcode);
    return generateResponse('DELIVERY_INFO', {
      postcode: parsed.postcode,
      zone: zone.zone,
      fee: zone.fee,
      estimate: zone.estimatedDelivery
    });
  }

  return generateResponse('DELIVERY_GENERAL');
}

/**
 * Handle business hours inquiry
 */
function handleBusinessHours(isOpen) {
  return generateResponse('BUSINESS_HOURS', { isOpen });
}

/**
 * Handle order status check
 */
async function handleOrderStatus(phone) {
  try {
    const orders = await getOrderByPhone(phone);

    if (!orders || orders.length === 0) {
      return generateResponse('NO_ORDERS_FOUND');
    }

    const latestOrder = orders[0];
    return generateResponse('ORDER_STATUS', {
      orderId: latestOrder.id,
      status: latestOrder.status,
      total: latestOrder.total,
      createdAt: latestOrder.created_at
    });
  } catch (error) {
    console.error('Failed to get order status:', error);
    return generateResponse('ORDER_STATUS_ERROR');
  }
}

/**
 * Handle cancellation request
 */
async function handleCancel(conversation) {
  await clearConversation(conversation.phone, conversation.businessId);
  return generateResponse('CANCELLED');
}

/**
 * Handle thanks messages
 */
function handleThanks(customerName) {
  return generateResponse('THANKS', { customerName });
}

/**
 * Handle start order request (when user clicks "Place Order" button)
 */
async function handleStartOrder(conversation) {
  // Show products with quick order option
  const products = await getProducts();

  if (!products || products.length === 0) {
    return generateResponse('NO_PRODUCTS');
  }

  // Show top products for quick ordering
  const topProducts = products.slice(0, 8);
  let text = `📦 *Quick Order*\n\nPopular items:\n\n`;

  topProducts.forEach((p, i) => {
    text += `${i + 1}. ${p.name} - £${p.price.toFixed(2)}\n`;
  });

  text += `\n*To order:* Just type the number or name!\nExample: "1" or "Palm Oil" or "2x Egusi"\n\n💳 Pay online or Cash on Delivery`;

  await updateConversation(conversation.phone, { state: 'AWAITING_ORDER' }, conversation.businessId);

  return { text, buttons: ['📋 Full Catalog', '❌ Cancel'] };
}

/**
 * Handle products list request
 */
async function handleProductsList() {
  const products = await getProducts();

  if (!products || products.length === 0) {
    return generateResponse('NO_PRODUCTS');
  }

  // Group by category
  const categories = {};
  for (const p of products) {
    const cat = p.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  }

  let text = `📦 *Our Products*\n\n`;

  for (const [category, items] of Object.entries(categories)) {
    text += `*${category}*\n`;
    for (const item of items) {
      text += `• ${item.name} - £${item.price.toFixed(2)} (${item.unit})\n`;
    }
    text += '\n';
  }

  text += `\nTo order, send:\n"2x Palm Oil (5L), 3x Egusi Seeds"\n\nOr ask about a specific product!`;

  return { text, buttons: ['📦 Place Order', '💬 Help'] };
}

/**
 * Handle general inquiries
 */
async function handleGeneralInquiry(text, conversation) {
  // If waiting for address, treat this as address input
  if (conversation.state === 'AWAITING_ADDRESS') {
    const parsed = await parseMessage(text);
    if (parsed.address || parsed.postcode) {
      // Update pending order with address
      const order = conversation.pendingOrder;
      order.address = parsed.address || text;
      order.postcode = parsed.postcode;
      order.deliveryZone = getDeliveryZone(parsed.postcode);
      order.deliveryFee = order.deliveryZone.fee;
      order.total = order.subtotal + order.deliveryFee;

      await updateConversation(conversation.phone, {
        state: 'AWAITING_CONFIRMATION',
        pendingOrder: order
      }, conversation.businessId);

      return generateResponse('ORDER_CONFIRMATION', {
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        address: order.address,
        deliveryZone: order.deliveryZone
      });
    }
  }

  return generateResponse('GENERAL_HELP');
}
