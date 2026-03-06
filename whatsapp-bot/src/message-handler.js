/**
 * Àpínlẹ̀rọ Message Handler v2.0.0
 *
 * Processes incoming WhatsApp messages and generates responses
 * Manages conversation state and order flow with Supabase persistence
 * Now supports multi-tenant operations with business context
 */

import { parseMessage, matchProduct, getDeliveryZone, isCompleteOrder } from './message-parser.js';
import { penceToPounds } from './currency.js';
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
  getLastOrder,
  uploadMedia,
  logMediaFile
} from './supabase-client.js';
import { getMediaUrl, downloadMedia } from './whatsapp-cloud-service.js';
import { generateResponse } from './response-templates.js';
import { getSuggestedProducts, generateSuggestionMessage } from './smart-suggestions.js';
import {
  sanitizeMessage,
  sanitizeName,
  sanitizeAddress,
  sanitizePostcode,
  sanitizePhone,
  sanitizeNotes,
  sanitizeQuantity,
  escapeHtml
} from './input-sanitizer.js';

// Auto-confirm threshold for returning customers
const AUTO_CONFIRM_THRESHOLD = 30; // £30 for orders below this amount
const MIN_ORDERS_FOR_AUTO_CONFIRM = 2; // Minimum past orders to enable auto-confirm

// ============================================================
// STATE-FIRST ROUTING HELPERS
// Flexible response detection for conversational flow
// ============================================================

/**
 * Check if message is a positive/confirmation response
 * Matches: yes, yeah, yep, sure, ok, 👍, ✅, etc.
 */
function isPositiveResponse(text) {
  return /^(yes|yeah|yep|yup|yh|ye|y|sure|ok|okay|confirm|correct|right|perfect|great|good|go|proceed|done|ready|fine|alright|👍|✅)/i.test(text.trim());
}

/**
 * Check if message is a negative/decline response
 * Matches: no, nope, nah, cancel, ❌, etc.
 */
function isNegativeResponse(text) {
  return /^(no|nope|nah|n|cancel|stop|don't|dont|never|wrong|❌)/i.test(text.trim());
}

/**
 * Check if message indicates cash payment preference
 */
function isCashPayment(text) {
  return /cash|cod|pay.*deliver|on.*delivery|💵/i.test(text);
}

/**
 * Check if message indicates card/online payment preference
 */
function isCardPayment(text) {
  return /card|online|pay.*now|transfer|bank|💳|🏦/i.test(text);
}

// ============================================================
// BUTTON ID RESOLUTION
// Maps WhatsApp button text/IDs to canonical intent strings
// ============================================================

const BUTTON_ID_MAP = {
  '📦 order': 'START_ORDER',
  '📦 place order': 'START_ORDER',
  '📦 new order': 'START_ORDER',
  '📦 order now': 'START_ORDER',
  '📋 see products': 'PRODUCTS_LIST',
  '📋 view catalog': 'PRODUCTS_LIST',
  '📋 view products': 'PRODUCTS_LIST',
  '📋 full catalog': 'PRODUCTS_LIST',
  '📋 products': 'PRODUCTS_LIST',
  '📋 view more': 'PRODUCTS_LIST',
  '📋 view alternatives': 'PRODUCTS_LIST',
  '✅ yes': 'CONFIRM',
  "✅ yes, that's right": 'CONFIRM',
  '✅ yes!': 'CONFIRM',
  '✏️ make changes': 'DECLINE',
  '✏️ change': 'DECLINE',
  '✏️ let me correct it': 'DECLINE',
  '❌ cancel': 'CANCEL',
  '❌ cancel order': 'CANCEL',
  '🔄 reorder': 'REORDER',
  '🔄 start over': 'REORDER',
  '🔄 try again': 'GREETING',
  '💳 pay now': 'PAYMENT_CARD',
  '💳 pay online': 'PAYMENT_CARD',
  '💳 card': 'PAYMENT_CARD',
  '💵 cash': 'PAYMENT_CASH',
  '💵 cash on delivery': 'PAYMENT_CASH',
  '🏦 transfer': 'PAYMENT_TRANSFER',
  '🏦 bank transfer': 'PAYMENT_TRANSFER',
  '💬 help': 'GREETING',
  '💬 contact us': 'GREETING',
  '📍 track order': 'ORDER_STATUS',
};

/**
 * Resolve a WhatsApp button ID/text to a canonical intent string
 * @param {string|null} buttonText - The button text or ID from WhatsApp
 * @returns {string|null} - Resolved intent or null if not a known button
 */
export function resolveButtonId(buttonText) {
  if (!buttonText) return null;
  const normalized = buttonText.trim().toLowerCase();
  return BUTTON_ID_MAP[normalized] || null;
}

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
 * Handle media messages (images, audio, documents)
 * Downloads media from WhatsApp and stores in Supabase
 * @param {Object} params - Media parameters
 * @param {string} params.mediaId - WhatsApp media ID
 * @param {string} params.messageType - Type: 'image', 'audio', 'video', 'document'
 * @param {string} params.from - Customer phone number
 * @param {string} params.accessToken - Meta API access token
 * @param {string|null} params.businessId - Business ID for multi-tenant
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function handleMediaMessage({ mediaId, messageType, from, accessToken, businessId }) {
  if (!mediaId || !accessToken) {
    console.log('⚠️ Missing mediaId or accessToken for media handling');
    return { success: false, error: 'Missing media ID or access token' };
  }

  try {
    console.log(`📸 Processing ${messageType} from ${from}...`);

    // 1. Get media URL from Meta API
    const mediaInfo = await getMediaUrl(mediaId, accessToken);
    if (!mediaInfo) {
      console.error('❌ Failed to get media URL');
      return { success: false, error: 'Could not retrieve media URL' };
    }

    console.log(`📥 Downloading media: ${mediaInfo.mimeType} (${mediaInfo.fileSize || 'unknown'} bytes)`);

    // 2. Download the media binary
    const mediaBuffer = await downloadMedia(mediaInfo.url, accessToken);
    if (!mediaBuffer) {
      console.error('❌ Failed to download media');
      return { success: false, error: 'Could not download media' };
    }

    // 3. Generate filename
    const extension = mediaInfo.mimeType?.split('/')[1] || 'bin';
    const fileName = `${messageType}_${Date.now()}.${extension}`;

    // 4. Upload to Supabase Storage
    const uploadResult = await uploadMedia(mediaBuffer, fileName, mediaInfo.mimeType, from);
    if (!uploadResult.success) {
      console.error('❌ Failed to upload media:', uploadResult.error);
      return { success: false, error: uploadResult.error };
    }

    // 5. Log to database
    await logMediaFile({
      filePath: uploadResult.path,
      fileName: fileName,
      mimeType: mediaInfo.mimeType,
      fileSize: mediaInfo.fileSize || mediaBuffer.length,
      customerPhone: from,
      businessId: businessId
    });

    console.log(`✅ Media stored: ${uploadResult.path}`);
    return {
      success: true,
      url: uploadResult.url,
      path: uploadResult.path,
      mimeType: mediaInfo.mimeType
    };

  } catch (error) {
    console.error('❌ Media handling error:', error);
    return { success: false, error: error.message };
  }
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
 * @param {string} params.accessToken - Meta API access token (for media)
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
  messageType = 'text',
  accessToken = null
}) {
  // SECURITY: Sanitize all user inputs
  const sanitizedFrom = sanitizePhone(from);
  const sanitizedName = sanitizeName(customerName);
  const sanitizedText = sanitizeMessage(text || '');
  const sanitizedButtonId = buttonId ? sanitizeMessage(buttonId) : null;
  const sanitizedListId = listId ? sanitizeMessage(listId) : null;

  // Get conversation with business context
  const conversation = await getConversation(sanitizedFrom, sanitizedName, businessId);

  // Handle media messages (images, audio, video, documents)
  let mediaResult = null;
  if (mediaId && messageType !== 'text' && accessToken) {
    mediaResult = await handleMediaMessage({
      mediaId,
      messageType,
      from,
      accessToken,
      businessId
    });

    // Store media URL in conversation context for order attachments
    if (mediaResult.success) {
      const context = conversation.context || {};
      context.lastMediaUrl = mediaResult.url;
      context.lastMediaPath = mediaResult.path;
      context.lastMediaType = messageType;
      await updateConversation(from, { context }, businessId);
    }
  }

  // If this is a button/list reply, use the ID as the text for intent parsing
  // SECURITY: Use sanitized versions of all inputs
  const messageText = sanitizedButtonId || sanitizedListId || sanitizedText || '';

  // Resolve button ID to intent before parsing
  const resolvedIntent = resolveButtonId(sanitizedButtonId);

  const parsed = await parseMessage(messageText, conversation.state);

  // Override parsed intent if button was resolved
  if (resolvedIntent) {
    parsed.intent = resolvedIntent;
  }

  console.log(`📝 Parsed message:`, {
    intent: parsed.intent,
    items: parsed.items.length,
    state: conversation.state,
    customer: conversation.customerName || sanitizedName,
    businessId: businessId || 'default',
    provider,
    messageType,
    mediaReceived: mediaResult?.success ? '📸 Stored' : (mediaId ? '❌ Failed' : 'None'),
    neo4j: parsed.neo4jEnabled ? '🧠 Active' : '⚠️ Fallback'
  });

  // Log inbound message (with business context)
  // SECURITY: Use sanitized values for logging
  await logMessage(sanitizedFrom, 'inbound', messageText || `[${messageType}]`, parsed.intent, null, businessId);

  // If only media was sent (no text), acknowledge it
  if (mediaResult?.success && !messageText.trim()) {
    const mediaAck = messageType === 'image'
      ? `📸 Got your image! Is this for your order? Let me know what you'd like to do with it.`
      : messageType === 'audio' || messageType === 'voice'
      ? `🎤 Voice note received! For orders, please type your request or send a message.`
      : messageType === 'document'
      ? `📄 Document received and saved. How can I help you?`
      : `📎 File received! How can I help you?`;

    return { text: mediaAck };
  }

  // Handle based on intent and conversation state
  try {
    let response;

    // ============================================================
    // STATE-FIRST ROUTING - Check conversation state before intent
    // This ensures proper flow through ordering stages
    // ============================================================

    // AWAITING_CONFIRMATION: Accept flexible yes/no responses
    if (conversation.state === 'AWAITING_CONFIRMATION' && conversation.pendingOrder) {
      // Compound intent: "yes please add palm oil" — positive + new items
      if (isPositiveResponse(messageText) && parsed.items && parsed.items.length > 0) {
        // Merge new items into pending order, re-show confirmation
        const mergedParsed = {
          ...parsed,
          items: [...(conversation.pendingOrder.items.map(i => ({
            product: i.product_name,
            quantity: i.quantity,
            unit: i.unit
          }))), ...parsed.items],
          address: conversation.pendingOrder.address,
          postcode: conversation.pendingOrder.postcode,
          deliveryZone: conversation.pendingOrder.deliveryZone
        };
        response = await handleNewOrder(from, customerName, mergedParsed, conversation);
        await logMessage(from, 'outbound', response.text, 'NEW_ORDER', conversation.lastOrderId, businessId);
        return response;
      }
      if (isPositiveResponse(messageText) || parsed.intent === 'CONFIRM') {
        response = await handleConfirmation(from, customerName, conversation);
        await logMessage(from, 'outbound', response.text, 'CONFIRM', conversation.lastOrderId, businessId);
        return response;
      }
      if (isNegativeResponse(messageText) || parsed.intent === 'DECLINE') {
        response = handleDecline(conversation);
        await logMessage(from, 'outbound', response.text, 'DECLINE', conversation.lastOrderId, businessId);
        return response;
      }
      if (parsed.intent === 'CANCEL') {
        response = await handleCancel(conversation);
        await logMessage(from, 'outbound', response.text, 'CANCEL', conversation.lastOrderId, businessId);
        return response;
      }
      // If adding more items to existing order
      if (parsed.intent === 'NEW_ORDER' && parsed.items && parsed.items.length > 0) {
        response = await handleNewOrder(from, customerName, parsed, conversation);
        await logMessage(from, 'outbound', response.text, 'NEW_ORDER', conversation.lastOrderId, businessId);
        return response;
      }
      // Re-prompt for confirmation (user said something unclear)
      response = generateResponse('REPROMPT_CONFIRMATION', {
        items: conversation.pendingOrder.items,
        total: conversation.pendingOrder.total
      });
      await logMessage(from, 'outbound', response.text, 'REPROMPT', conversation.lastOrderId, businessId);
      return response;
    }

    // AWAITING_PAYMENT: Accept flexible payment responses
    if (conversation.state === 'AWAITING_PAYMENT') {
      if (isCashPayment(text)) {
        response = await handlePaymentChoice(from, conversation, 'cash');
        await logMessage(from, 'outbound', response.text, 'PAYMENT_CASH', conversation.lastOrderId, businessId);
        return response;
      }
      if (isCardPayment(text)) {
        response = await handlePaymentChoice(from, conversation, 'card');
        await logMessage(from, 'outbound', response.text, 'PAYMENT_CARD', conversation.lastOrderId, businessId);
        return response;
      }
      // Re-prompt for payment method
      response = generateResponse('REPROMPT_PAYMENT', {
        orderId: conversation.lastOrderId?.substring(0, 8).toUpperCase() || 'your order'
      });
      await logMessage(from, 'outbound', response.text, 'REPROMPT', conversation.lastOrderId, businessId);
      return response;
    }

    // AWAITING_ADDRESS: Try to extract address/postcode from any message
    if (conversation.state === 'AWAITING_ADDRESS') {
      const { parseAddress } = await import('./message-parser.js');
      const addressParsed = parseAddress(text);
      if (addressParsed.postcode) {
        // Has postcode - continue with order using existing pending order data
        parsed.postcode = addressParsed.postcode;
        parsed.address = addressParsed.address || text;
        parsed.items = conversation.pendingOrder?.items || parsed.items;
        response = await handleNewOrder(from, customerName, parsed, conversation);
        await logMessage(from, 'outbound', response.text, 'ADDRESS_PROVIDED', conversation.lastOrderId, businessId);
        return response;
      }
      // Re-prompt for address
      response = generateResponse('REPROMPT_ADDRESS', {
        items: conversation.pendingOrder?.items || [],
        subtotal: conversation.pendingOrder?.subtotal || 0
      });
      await logMessage(from, 'outbound', response.text, 'REPROMPT', conversation.lastOrderId, businessId);
      return response;
    }

    // EDITING_ORDER: Handle order modifications
    if (conversation.state === 'EDITING_ORDER' && conversation.pendingOrder) {
      // New items → rebuild order
      if (parsed.intent === 'NEW_ORDER' && parsed.items && parsed.items.length > 0) {
        response = await handleNewOrder(from, customerName, parsed, conversation);
        await logMessage(from, 'outbound', response.text, 'NEW_ORDER', conversation.lastOrderId, businessId);
        return response;
      }
      // Remove item: "remove palm oil", "take out egusi"
      const removeMatch = messageText.match(/(?:remove|take\s*out|drop|delete)\s+(.+)/i);
      if (removeMatch) {
        const removeTarget = removeMatch[1].trim().toLowerCase();
        const filteredItems = conversation.pendingOrder.items.filter(
          item => !item.product_name.toLowerCase().includes(removeTarget)
        );
        if (filteredItems.length === 0) {
          // All items removed — cancel
          response = await handleCancel(conversation);
          await logMessage(from, 'outbound', response.text, 'CANCEL', conversation.lastOrderId, businessId);
          return response;
        }
        if (filteredItems.length < conversation.pendingOrder.items.length) {
          const subtotal = filteredItems.reduce((sum, item) => sum + item.subtotal, 0);
          const deliveryFee = conversation.pendingOrder.deliveryFee;
          const total = subtotal + deliveryFee;
          const updatedOrder = {
            ...conversation.pendingOrder,
            items: filteredItems,
            subtotal,
            total
          };
          await updateConversation(from, {
            state: 'AWAITING_CONFIRMATION',
            pendingOrder: updatedOrder
          }, businessId);
          response = generateResponse('ORDER_CONFIRMATION', {
            items: filteredItems,
            subtotal,
            deliveryFee,
            total,
            address: updatedOrder.address,
            deliveryZone: updatedOrder.deliveryZone
          });
          await logMessage(from, 'outbound', response.text, 'EDIT_REMOVE', conversation.lastOrderId, businessId);
          return response;
        }
      }
      // "start over" → reset to INITIAL
      if (/start\s*over|fresh|new\s*order|from\s*scratch/i.test(messageText)) {
        await updateConversation(from, { state: 'INITIAL', pendingOrder: null }, businessId);
        response = generateResponse('ORDER_CANCELLED');
        await logMessage(from, 'outbound', response.text, 'START_OVER', conversation.lastOrderId, businessId);
        return response;
      }
      // Cancel
      if (parsed.intent === 'CANCEL') {
        response = await handleCancel(conversation);
        await logMessage(from, 'outbound', response.text, 'CANCEL', conversation.lastOrderId, businessId);
        return response;
      }
      // Default: show edit prompt with current items
      response = generateResponse('ORDER_EDIT_PROMPT_WITH_ITEMS', {
        items: conversation.pendingOrder.items,
        total: conversation.pendingOrder.total
      });
      await logMessage(from, 'outbound', response.text, 'EDIT_PROMPT', conversation.lastOrderId, businessId);
      return response;
    }

    // ============================================================
    // INTENT-BASED ROUTING (fallback for other states)
    // ============================================================

    switch (parsed.intent) {
      case 'GREETING':
        response = handleGreeting(customerName, conversation);
        break;

      case 'PRODUCTS_LIST':
        response = await handleProductsList(conversation.businessId);
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
        response = await handlePriceCheck(text, conversation.businessId);
        break;

      case 'AVAILABILITY':
        response = await handleAvailability(text, conversation.businessId);
        break;

      case 'DELIVERY_INQUIRY':
        response = handleDeliveryInquiry(parsed);
        break;

      case 'BUSINESS_HOURS':
        response = handleBusinessHours(parsed.isBusinessHours);
        break;

      case 'ORDER_STATUS':
        response = await handleOrderStatus(from, conversation.businessId);
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

      case 'MODIFY_ORDER':
        response = await handleModifyOrder(from, customerName, parsed, conversation);
        break;

      case 'MEAL_ORDER':
        response = await handleMealOrder(from, customerName, parsed, conversation);
        break;

      case 'BUDGET_ORDER':
        response = await handleBudgetOrder(from, customerName, parsed, conversation);
        break;

      case 'RUNNING_TOTAL':
        response = handleRunningTotal(conversation);
        break;

      case 'ADDRESS_UPDATE':
        response = await handleAddressUpdate(from, parsed, conversation);
        break;

      default:
        response = await handleGeneralInquiry(text, parsed, conversation);
    }

    // Log outbound message
    if (response) {
      await logMessage(from, 'outbound', response.text, parsed.intent, conversation.lastOrderId, businessId);
    }

    return response;

  } catch (error) {
    console.error('Message handling error:', error);
    return generateResponse('ERROR');
  }
}

/**
 * Handle greeting messages with contextual, time-based variations
 */
function handleGreeting(customerName, conversation) {
  updateConversation(conversation.phone, { state: 'GREETED' }, conversation.businessId);

  // Get time of day for contextual greeting
  const now = new Date();
  const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const hour = londonTime.getHours();
  const timeGreeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  // Multiple greeting variations for natural variety
  const greetings = [
    `Good ${timeGreeting}${customerName ? `, ${customerName}` : ''}! 😊 How can I help you today?`,
    `Hey${customerName ? ` ${customerName}` : ''}! Hope you're having a good ${timeGreeting}! What can I get for you?`,
    `Hi${customerName ? ` ${customerName}` : ''}! 👋 What are you looking for today?`,
    `${timeGreeting === 'morning' ? 'Morning' : timeGreeting === 'afternoon' ? 'Afternoon' : 'Evening'}${customerName ? ` ${customerName}` : ''}! 😊 How can I help?`
  ];

  // Randomly select a greeting for variety
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  return {
    text: randomGreeting + "\n\nJust tell me what you need - I'm here to help! 💚",
    buttons: ['📦 Order', '📋 See Products', '🔄 Reorder']
  };
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
  const products = await getProducts(conversation.businessId);
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
        price: penceToPounds(product.price),
        subtotal: penceToPounds(product.price) * item.quantity
      });
    } else {
      notFound.push(item.product);
    }
  }

  if (orderItems.length === 0) {
    return generateResponse('PRODUCTS_NOT_FOUND', { products: notFound });
  }

  // Partial match: some items found, some not — accept found and suggest alternatives
  if (notFound.length > 0 && orderItems.length > 0) {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryFee = deliveryZone.fee;
    const total = subtotal + deliveryFee;

    // Try to find similar products for unfound items
    const similarSuggestions = [];
    for (const missed of notFound) {
      const missedLower = missed.toLowerCase();
      const similar = products.find(p =>
        p.name.toLowerCase().includes(missedLower) ||
        missedLower.includes(p.name.toLowerCase().split(' ')[0])
      );
      if (similar) similarSuggestions.push(similar.name);
    }

    // Store pending order with found items
    const pendingOrder = {
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      address: address || null,
      postcode: postcode || null,
      deliveryZone,
      customerName,
      customerId: conversation.customerId,
      notFoundProducts: notFound
    };

    await updateConversation(phone, {
      state: 'AWAITING_CONFIRMATION',
      pendingOrder
    }, conversation.businessId);

    return generateResponse('PARTIAL_MATCH', {
      items: orderItems,
      notFound,
      subtotal,
      deliveryFee,
      total,
      address: address || null,
      suggestions: similarSuggestions
    });
  }

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = deliveryZone.fee;
  const total = subtotal + deliveryFee;

  // Check if any items were typo-corrected
  const typoItems = orderItems.filter(item => item.typoDetected);
  if (typoItems.length > 0 && orderItems.length > 0) {
    // Ask for confirmation before proceeding
    const typoItem = typoItems[0]; // Focus on first typo

    await updateConversation(phone, {
      state: 'AWAITING_TYPO_CONFIRMATION',
      pendingOrder: {
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        address: address || null,
        postcode: postcode || null,
        deliveryZone,
        customerName,
        customerId: conversation.customerId,
        notFoundProducts: notFound,
        typoItem: typoItem
      }
    }, conversation.businessId);

    return generateResponse('TYPO_CONFIRMATION', {
      items: orderItems,
      originalText: typoItem.originalText,
      correctedText: typoItem.matchedText,
      subtotal,
      deliveryFee,
      total,
      address: address || null
    });
  }

  // Check if customer has saved address (for returning customers)
  let finalAddress = address;
  let finalPostcode = postcode;

  if (!address && !postcode) {
    // Try to get saved address from customer profile
    const customer = await getCustomerByPhone(phone, conversation.businessId);
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
  const customer = await getCustomerByPhone(phone, conversation.businessId);
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

  // Get smart product suggestions for upselling
  const suggestions = getSuggestedProducts(orderItems);
  const suggestionText = generateSuggestionMessage(suggestions);

  // For complete orders, show quick confirmation
  if (isComplete) {
    return generateResponse('QUICK_CONFIRM', {
      items: orderItems,
      subtotal,
      deliveryFee: pendingOrder.deliveryFee,
      total: pendingOrder.total,
      address: finalAddress,
      deliveryZone: pendingOrder.deliveryZone,
      suggestions: suggestionText
    });
  }

  // Send confirmation request with suggestions
  return generateResponse('ORDER_CONFIRMATION', {
    items: orderItems,
    subtotal,
    deliveryFee: pendingOrder.deliveryFee,
    total: pendingOrder.total,
    address: finalAddress,
    deliveryZone: pendingOrder.deliveryZone,
    notFound: notFound.length > 0 ? notFound : null,
    suggestions: suggestionText
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
    }, conversation.businessId);

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
    // Fall back to manual confirmation with clear prompt
    await updateConversation(phone, {
      state: 'AWAITING_CONFIRMATION',
      pendingOrder
    }, conversation.businessId);
    return generateResponse('AUTO_CONFIRM_FALLBACK', {
      items: pendingOrder.items,
      subtotal: pendingOrder.subtotal,
      deliveryFee: pendingOrder.deliveryFee,
      total: pendingOrder.total,
      address: pendingOrder.address
    });
  }
}

/**
 * Handle reorder request (repeat last order)
 */
async function handleReorder(phone, customerName, conversation) {
  try {
    const lastOrder = await getLastOrder(phone, conversation.businessId);

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
  const customer = await getCustomerByPhone(phone, conversation.businessId);
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
  // Handle typo confirmation
  if (conversation.state === 'AWAITING_TYPO_CONFIRMATION' && conversation.pendingOrder) {
    // Customer confirmed the typo correction, proceed with order
    const order = conversation.pendingOrder;

    // Update state to normal confirmation flow
    await updateConversation(phone, {
      state: order.address || order.postcode ? 'AWAITING_CONFIRMATION' : 'AWAITING_ADDRESS',
      pendingOrder: order
    }, conversation.businessId);

    // Check if we need address
    if (!order.address && !order.postcode) {
      return generateResponse('NEED_ADDRESS', {
        items: order.items,
        subtotal: order.subtotal,
        notFound: order.notFoundProducts
      });
    }

    // Get smart suggestions
    const suggestions = getSuggestedProducts(order.items);
    const suggestionText = generateSuggestionMessage(suggestions);

    // Send confirmation with suggestions
    return generateResponse('ORDER_CONFIRMATION', {
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      address: order.address,
      deliveryZone: order.deliveryZone,
      notFound: order.notFoundProducts && order.notFoundProducts.length > 0 ? order.notFoundProducts : null,
      suggestions: suggestionText
    });
  }

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
    }, conversation.businessId);

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
async function handlePriceCheck(text, businessId) {
  const products = await getProducts(businessId);

  // Try Neo4j matching first
  const matched = await matchProduct(text);
  if (matched) {
    const product = products.find(p => p.name.toLowerCase() === matched.name.toLowerCase());
    if (product) {
      console.log(`💰 Price check: "${text}" → ${matched.name} (${matched.language})`);
      return generateResponse('PRICE_INFO', {
        product: product.name,
        price: penceToPounds(product.price),
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
        price: penceToPounds(product.price),
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
async function handleAvailability(text, businessId) {
  const products = await getProducts(businessId);

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
async function handleOrderStatus(phone, businessId) {
  try {
    const orders = await getOrderByPhone(phone, businessId);

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
  const products = await getProducts(conversation.businessId);

  if (!products || products.length === 0) {
    return generateResponse('NO_PRODUCTS');
  }

  // Show top products for quick ordering
  const topProducts = products.slice(0, 8);
  let text = `📦 *Quick Order*\n\nPopular items:\n\n`;

  topProducts.forEach((p, i) => {
    text += `${i + 1}. ${p.name} - £${penceToPounds(p.price).toFixed(2)}\n`;
  });

  text += `\n*To order:* Just type the number or name!\nExample: "1" or "Palm Oil" or "2x Egusi"\n\n💳 Pay online or Cash on Delivery`;

  await updateConversation(conversation.phone, { state: 'AWAITING_ORDER' }, conversation.businessId);

  return { text, buttons: ['📋 Full Catalog', '❌ Cancel'] };
}

/**
 * Handle products list request
 */
async function handleProductsList(businessId) {
  const products = await getProducts(businessId);

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
      text += `• ${item.name} - £${penceToPounds(item.price).toFixed(2)} (${item.unit})\n`;
    }
    text += '\n';
  }

  text += `\nTo order, send:\n"2x Palm Oil (5L), 3x Egusi Seeds"\n\nOr ask about a specific product!`;

  return { text, buttons: ['📦 Place Order', '💬 Help'] };
}

/**
 * Handle general inquiries — context-aware based on conversation state
 */
async function handleGeneralInquiry(text, parsed, conversation) {
  // State-aware re-prompts
  switch (conversation.state) {
    case 'AWAITING_CONFIRMATION':
      if (conversation.pendingOrder) {
        return generateResponse('REPROMPT_CONFIRMATION', {
          items: conversation.pendingOrder.items,
          total: conversation.pendingOrder.total
        });
      }
      break;

    case 'AWAITING_PAYMENT':
      return generateResponse('REPROMPT_PAYMENT', {
        orderId: conversation.lastOrderId?.substring(0, 8).toUpperCase() || 'your order'
      });

    case 'EDITING_ORDER':
      if (conversation.pendingOrder) {
        return generateResponse('EDITING_ORDER_REPROMPT', {
          items: conversation.pendingOrder.items,
          total: conversation.pendingOrder.total
        });
      }
      break;

    case 'AWAITING_ADDRESS':
      return generateResponse('REPROMPT_ADDRESS', {
        items: conversation.pendingOrder?.items || [],
        subtotal: conversation.pendingOrder?.subtotal || 0
      });
  }

  // Try product similarity match before giving up
  if (text && text.trim().length > 2) {
    const products = await getProducts(conversation.businessId);
    const textLower = text.toLowerCase();
    const similar = products.filter(p => {
      const nameLower = p.name.toLowerCase();
      // Check if any word in the query partially matches a product name
      return textLower.split(/\s+/).some(word =>
        word.length > 2 && (nameLower.includes(word) || word.includes(nameLower.split(' ')[0]))
      );
    });

    if (similar.length > 0) {
      return generateResponse('DID_YOU_MEAN', {
        query: text.trim(),
        suggestions: similar.slice(0, 5).map(p => p.name)
      });
    }
  }

  // Last resort — generic help
  return generateResponse('GENERAL_HELP');
}

// ============================================================
// NEW INTENT HANDLERS
// ============================================================

/**
 * Handle order modification requests
 * Parses modification from classifier result and applies to pendingOrder
 */
async function handleModifyOrder(phone, customerName, parsed, conversation) {
  if (!conversation.pendingOrder || !conversation.pendingOrder.items?.length) {
    return generateResponse('NO_PENDING_ORDER');
  }

  const order = conversation.pendingOrder;
  const classifierResult = parsed.classifierResult || {};
  // Support both singular "modification" and plural "modifications" array
  const modifications = classifierResult.modifications ||
    (classifierResult.modification ? [classifierResult.modification] : []);

  if (modifications.length === 0) {
    // No structured modification data — treat as edit prompt
    return generateResponse('ORDER_EDIT_PROMPT');
  }

  const removed = [];
  const added = [];
  const products = await getProducts(conversation.businessId);
  const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]));

  for (const mod of modifications) {
    const action = mod.action;
    const target = (mod.target || '').toLowerCase();

    if (action === 'cancel' || action === 'remove') {
      const idx = order.items.findIndex(i =>
        i.product_name.toLowerCase().includes(target)
      );
      if (idx !== -1) {
        removed.push(order.items[idx].product_name);
        order.items.splice(idx, 1);
      } else {
        return generateResponse('MODIFY_ORDER_NOT_FOUND', { target: mod.target || target });
      }
    } else if (action === 'remove_last') {
      if (order.items.length > 0) {
        const last = order.items.pop();
        removed.push(last.product_name);
      }
    } else if (action === 'add') {
      const productName = (mod.new_value || mod.target || '').toLowerCase();
      const product = productMap.get(productName) ||
        products.find(p => p.name.toLowerCase().includes(productName));
      if (product) {
        const qty = mod.quantity || 1;
        order.items.push({
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          unit: product.unit,
          price: penceToPounds(product.price),
          subtotal: penceToPounds(product.price) * qty
        });
        added.push(product.name);
      }
    } else if (action === 'change_quantity') {
      const item = order.items.find(i =>
        i.product_name.toLowerCase().includes(target)
      );
      if (item) {
        const newQty = mod.new_value || 1;
        item.quantity = newQty;
        item.subtotal = item.price * newQty;
      } else {
        return generateResponse('MODIFY_ORDER_NOT_FOUND', { target: mod.target || target });
      }
    }
  }

  // Check if order is now empty
  if (order.items.length === 0) {
    await updateConversation(phone, { state: 'INITIAL', pendingOrder: null }, conversation.businessId);
    return generateResponse('MODIFY_ORDER_EMPTY');
  }

  // Recalculate totals
  order.subtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
  order.total = order.subtotal + (order.deliveryFee || 0);

  await updateConversation(phone, {
    state: 'AWAITING_CONFIRMATION',
    pendingOrder: order
  }, conversation.businessId);

  return generateResponse('MODIFY_ORDER_APPLIED', {
    items: order.items,
    removed,
    added,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee || 0,
    total: order.total,
    address: order.address
  });
}

/**
 * Meal recipe ingredients mapping
 */
const MEAL_INGREDIENTS = {
  'jollof rice': [
    { product: 'rice', quantity: 2, unit: 'kg' },
    { product: 'palm oil', quantity: 1, unit: null },
    { product: 'scotch bonnet', quantity: 1, unit: null },
    { product: 'maggi', quantity: 1, unit: null }
  ],
  'egusi soup': [
    { product: 'egusi', quantity: 1, unit: null },
    { product: 'palm oil', quantity: 1, unit: null },
    { product: 'stockfish', quantity: 1, unit: null },
    { product: 'crayfish', quantity: 1, unit: null },
    { product: 'scotch bonnet', quantity: 1, unit: null }
  ],
  'pepper soup': [
    { product: 'scotch bonnet', quantity: 1, unit: null },
    { product: 'stockfish', quantity: 1, unit: null },
    { product: 'maggi', quantity: 1, unit: null }
  ],
  'fried rice': [
    { product: 'rice', quantity: 2, unit: 'kg' },
    { product: 'maggi', quantity: 1, unit: null }
  ],
  'efo riro': [
    { product: 'palm oil', quantity: 1, unit: null },
    { product: 'stockfish', quantity: 1, unit: null },
    { product: 'crayfish', quantity: 1, unit: null },
    { product: 'scotch bonnet', quantity: 1, unit: null },
    { product: 'maggi', quantity: 1, unit: null }
  ]
};

/**
 * Handle meal-based ordering — suggest ingredients for a named meal
 */
async function handleMealOrder(phone, customerName, parsed, conversation) {
  const classifierResult = parsed.classifierResult || {};
  const mealName = classifierResult.context_clues?.references_meal ||
    parsed.originalMessage?.replace(/ingredients?|for|i('m| am) (making|cooking|preparing)/gi, '').trim();

  if (!mealName) {
    return generateResponse('MEAL_NOT_FOUND', { meal: 'that meal' });
  }

  // Find meal recipe
  const mealKey = Object.keys(MEAL_INGREDIENTS).find(k =>
    mealName.toLowerCase().includes(k)
  );

  if (!mealKey) {
    return generateResponse('MEAL_NOT_FOUND', { meal: mealName });
  }

  const recipe = MEAL_INGREDIENTS[mealKey];
  const products = await getProducts(conversation.businessId);
  const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]));

  // Match recipe items to real products
  const orderItems = [];
  for (const ingredient of recipe) {
    const product = productMap.get(ingredient.product) ||
      products.find(p => p.name.toLowerCase().includes(ingredient.product));
    if (product) {
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit || product.unit,
        price: penceToPounds(product.price),
        subtotal: penceToPounds(product.price) * ingredient.quantity
      });
    }
  }

  if (orderItems.length === 0) {
    return generateResponse('MEAL_NOT_FOUND', { meal: mealName });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
  const deliveryFee = conversation.pendingOrder?.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  // Store as pending order
  await updateConversation(phone, {
    state: 'AWAITING_CONFIRMATION',
    pendingOrder: {
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      address: conversation.pendingOrder?.address || null,
      postcode: conversation.pendingOrder?.postcode || null,
      deliveryZone: conversation.pendingOrder?.deliveryZone || { fee: 0, estimatedDelivery: 'TBC' },
      customerName,
      customerId: conversation.customerId
    }
  }, conversation.businessId);

  return generateResponse('MEAL_INGREDIENTS', {
    meal: mealKey.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    items: orderItems,
    subtotal,
    deliveryFee,
    total,
    address: conversation.pendingOrder?.address || null
  });
}

/**
 * Handle budget-based ordering — suggest product bundles within budget
 */
async function handleBudgetOrder(phone, customerName, parsed, conversation) {
  const classifierResult = parsed.classifierResult || {};
  const budget = classifierResult.context_clues?.references_budget ||
    parseFloat((parsed.originalMessage || '').match(/£?(\d+(?:\.\d{2})?)/)?.[1]) || 0;

  if (budget <= 0) {
    return {
      text: `How much would you like to spend? Just tell me your budget, like "£30 worth of provisions" 💰`,
      buttons: ['📋 View Products', '💬 Help']
    };
  }

  const products = await getProducts(conversation.businessId);
  if (!products || products.length === 0) {
    return generateResponse('NO_PRODUCTS');
  }

  // Sort by popularity/price and build a bundle within budget
  const sorted = [...products]
    .filter(p => p.is_active)
    .sort((a, b) => a.price - b.price);

  const orderItems = [];
  let runningTotal = 0;

  for (const product of sorted) {
    const priceInPounds = penceToPounds(product.price);
    if (runningTotal + priceInPounds <= budget) {
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit: product.unit,
        price: priceInPounds,
        subtotal: priceInPounds
      });
      runningTotal += priceInPounds;
    }
    if (runningTotal >= budget * 0.9) break; // Stop when we're close to budget
  }

  if (orderItems.length === 0) {
    return {
      text: `£${budget.toFixed(2)} isn't quite enough for any of our products. Our prices start from £${penceToPounds(sorted[0]?.price || 0).toFixed(2)}.\n\nWould you like to adjust your budget?`,
      buttons: ['📋 View Products', '💬 Help']
    };
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

  // Store as pending order
  await updateConversation(phone, {
    state: 'AWAITING_CONFIRMATION',
    pendingOrder: {
      items: orderItems,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      address: null,
      postcode: null,
      deliveryZone: { fee: 0, estimatedDelivery: 'TBC' },
      customerName,
      customerId: conversation.customerId
    }
  }, conversation.businessId);

  return generateResponse('BUDGET_SUGGESTION', {
    budget,
    items: orderItems,
    total: subtotal
  });
}

/**
 * Handle running total request — show current pendingOrder summary
 */
function handleRunningTotal(conversation) {
  if (!conversation.pendingOrder || !conversation.pendingOrder.items?.length) {
    return generateResponse('RUNNING_TOTAL_EMPTY');
  }

  const order = conversation.pendingOrder;
  return generateResponse('RUNNING_TOTAL', {
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee || 0,
    total: order.total,
    address: order.address
  });
}

/**
 * Handle address update — extract address, update customer, recalculate delivery
 */
async function handleAddressUpdate(phone, parsed, conversation) {
  const classifierResult = parsed.classifierResult || {};
  const newAddress = classifierResult.context_clues?.delivery_address ||
    parsed.address || parsed.originalMessage;

  const { parseAddress } = await import('./message-parser.js');
  const addressParsed = parseAddress(newAddress || '');

  if (!addressParsed.postcode) {
    return generateResponse('ADDRESS_INVALID');
  }

  const zone = getDeliveryZone(addressParsed.postcode);
  const fullAddress = addressParsed.address || newAddress;

  // Update customer's default address
  try {
    await updateCustomerAddress(phone, fullAddress, addressParsed.postcode, conversation.businessId);
  } catch (err) {
    console.error('Failed to update customer address:', err);
  }

  // Update pending order if one exists
  if (conversation.pendingOrder) {
    const order = conversation.pendingOrder;
    order.address = fullAddress;
    order.postcode = addressParsed.postcode;
    order.deliveryZone = zone;
    order.deliveryFee = zone.fee;
    order.total = order.subtotal + zone.fee;

    await updateConversation(phone, {
      state: 'AWAITING_CONFIRMATION',
      pendingOrder: order
    }, conversation.businessId);
  }

  return generateResponse('ADDRESS_UPDATED', {
    address: fullAddress,
    postcode: addressParsed.postcode,
    deliveryFee: zone.fee,
    deliveryZone: zone.zone
  });
}
