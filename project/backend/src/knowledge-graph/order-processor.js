/**
 * Apinlero Knowledge Graph - Order Processor
 *
 * THE MAIN ORCHESTRATOR. This is the brain.
 *
 * processMessage(phone, messageText, mediaUrl?) drives the full conversation state machine:
 *   IDLE -> ORDERING -> CONFIRMING -> MODIFYING
 *
 * Edge cases handled:
 *   E1:  "Cancel the rice, add beans instead" -> compound modifications
 *   E2:  "How much is everything so far?" -> running total (ORDERING) or nudge (IDLE)
 *   E3:  "Remove the last item" -> pop last from cart
 *   E4:  "I meant 2kg not 20kg" -> find & fix quantity
 *   E5:  "My address changed, deliver to 14 Market Street" -> store address in session
 *   E6:  "Ricee" (misspelled) -> handled by fuzzy matcher end-to-end
 *   E7:  "rice 2" (emoji + number) -> preprocessed in intent-classifier
 *   E8:  "Is this still Isha's?" -> identity confirmation
 *   E9:  "Can I pay tomorrow?" -> general query with helpful nudge
 *   E10: Voice note / media URL -> polite decline
 *
 * Error handling:
 *   - Neo4j down -> friendly retry message
 *   - Claude API fails -> regex fallback in intent-classifier
 *   - Product search returns nothing -> helpful "couldn't find" message
 *   - processMessage wrapped in try/catch -> ALWAYS returns a response
 *
 * Integrates:
 *   - intent-classifier.js  -- Claude-powered message classification (with emoji preprocessing + regex fallback)
 *   - product-search.js     -- Multi-strategy fuzzy product matching
 *   - context-resolver.js   -- "The usual", meals, budget, family resolvers
 *   - session-manager.js    -- Supabase conversation state
 *   - order-saver.js        -- Neo4j order persistence + preference updates
 */

import { classifyMessage } from './intent-classifier.js';
import { searchProduct } from './product-search.js';
import { resolveContext } from './context-resolver.js';
import { getOrCreateSession, updateSession, clearSession } from './session-manager.js';
import { saveOrderToGraph, updateCustomerPreferences } from './order-saver.js';

// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================

const TEMPLATES = {
  GREETING: "Hello! Welcome to Isha's Treat & Groceries \u{1F6D2}\nJust tell me what you'd like to order!",

  RUNNING_TOTAL: (items, total) => {
    const lines = items.map(i => `  ${i.quantity}x ${i.name} \u2014 \u00A3${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return `\u{1F4CB} Your order so far:\n${lines}\n\n\u{1F4B0} Running total: \u00A3${total.toFixed(2)}\n\nKeep adding or say 'done' to confirm.`;
  },

  ORDER_SUMMARY: (items, total) => {
    const lines = items.map(i => `  ${i.quantity}x ${i.name} \u2014 \u00A3${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return `\u{1F4CB} Order summary:\n${lines}\n\n\u{1F4B0} Total: \u00A3${total.toFixed(2)}\n\nReply YES to confirm or tell me what to change.`;
  },

  CONFIRMED: (orderId) =>
    `\u2705 Order #${orderId} confirmed! We'll have it ready for you.`,

  CANCELLED: "\u274C Order cancelled. Send a message anytime to start a new order!",

  CANT_FIND: (query) =>
    `I couldn't find '${query}' in our catalogue. Could you check the spelling?`,

  CANT_UNDERSTAND: "Sorry, I didn't quite catch that. You can say things like:\n\u2022 '2kg rice and 3 plantains'\n\u2022 'The usual'\n\u2022 'How much is palm oil?'",

  PRICE_RESPONSE: (results) => {
    if (results.length === 1) {
      const r = results[0];
      return `\u{1F4B7} ${r.product}: \u00A3${Number(r.price).toFixed(2)}`;
    }
    const lines = results.map(r => `  ${r.product} \u2014 \u00A3${Number(r.price).toFixed(2)}`).join('\n');
    return `\u{1F4B7} Prices:\n${lines}`;
  },

  CONTEXT_SUMMARY: (explanation, items, total) => {
    const lines = items.map(i => `  ${i.quantity}x ${i.name} \u2014 \u00A3${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return `\u{1F4CB} ${explanation}:\n${lines}\n\n\u{1F4B0} Total: \u00A3${total.toFixed(2)}\n\nReply YES to confirm or tell me what to change.`;
  },

  // ---- New templates for edge cases ----

  NO_ORDER_YET: "You haven't started an order yet! Just tell me what you'd like to order.",

  EMPTY_CART: "Your cart is empty. Tell me what you'd like to order!",

  MEDIA_UNSUPPORTED: "I can't listen to voice notes or view images yet \u{1F605} \u2014 could you type your order instead?",

  IDENTITY_CONFIRM: "Yes! This is Isha's Treat & Groceries. How can I help you today? \u{1F6D2}",

  ADDRESS_SAVED: (address) =>
    `\u{1F4CD} Got it! Delivery address saved: ${address}`,

  PAYMENT_QUERY: "I'll note that request. Would you like to place an order? Just tell me what you need!",

  SERVICE_ERROR: "We're having a small issue right now. Please try again in a moment \u{1F64F}",

  QUANTITY_UPDATED: (itemName, oldQty, newQty) =>
    `\u2705 Updated: ${itemName} changed from ${oldQty} to ${newQty}`,

  // ---- Business info ----
  BUSINESS_HOURS: `\u{1F55C} Isha's Treat & Groceries\n\nMon\u2013Fri: 9am \u2013 7pm\nSaturday: 9am \u2013 6pm\nSunday: 10am \u2013 4pm\n\n\u{1F4CD} East London\n\u{1F69A} We deliver! Just add your postcode to your order.\n\nAnything you'd like to order?`,

  // ---- Order tracking ----
  ORDER_TRACKING: (ref) =>
    ref
      ? `\u{1F4E6} Let me check on order ${ref} for you. I'm passing this to Isha \u2014 she'll update you shortly!`
      : `\u{1F4E6} Let me find your most recent order. I'm passing this to Isha \u2014 she'll update you shortly!`,

  // ---- Complaint / feedback ----
  COMPLAINT_ACK: (product, feedback) =>
    product
      ? `I'm sorry to hear about the ${product}. I've noted your feedback${feedback ? ` ("${feedback}")` : ''} and flagged this for Isha. She'll sort this out for you \u{1F64F}`
      : `I'm sorry about that. I've flagged this for Isha and she'll get back to you to sort it out \u{1F64F}`,

  COMPLAINT_WITH_MEDIA: "I can see you've sent a photo \u2014 thanks for that. I've flagged this for Isha along with your message. She'll review it and get back to you shortly \u{1F64F}",

  PREFERENCE_UPDATED: (prev, next) =>
    `\u2705 Noted! I've updated your preference from ${prev} to ${next}. We'll remember this for future orders.`,

  // ---- Collection delegate ----
  COLLECTION_DELEGATE: (collector, relationship) =>
    collector
      ? `\u2705 No problem! I've noted that ${collector}${relationship ? ` (your ${relationship})` : ''} will be collecting. We'll let them know when it's ready.`
      : `\u2705 Got it! I've noted someone else will be collecting. Just let us know their name so we can hand it over smoothly.`,

  // ---- Cancel order (IDLE state) ----
  NO_ACTIVE_ORDER: "You don't have an active order to cancel. Want to start a new order? Just tell me what you need!",

  // ---- Graceful escalation for unsupported features ----
  ESCALATE_RECURRING: "Weekly/recurring deliveries aren't set up in the system yet \u2014 but Isha can arrange this for you! I'll let her know you're interested. In the meantime, just message us each week and we'll have it ready \u{1F44D}",

  ESCALATE_SPLIT_PAYMENT: "I can't split payments automatically yet, but Isha can arrange this for you. I'll flag your request \u2014 she'll sort it out \u{1F64F}",

  ESCALATE_PRICE_MATCH: "I'm not able to match prices from other shops, but I can tell you our prices! Would you like me to look up anything?",

  ESCALATE_RECOMMENDATION: "I don't have a record of that specific recommendation, but I can help you find it! Could you describe the product? e.g. 'goat meat' or 'spice mix'",

  CLARIFY_LAST_DISCUSSED: (product) =>
    `Did you mean ${product}? If so, how many would you like?`,

  ESCALATE_RECURRING_WITH_ORDER: (items, total) => {
    const lines = items.map(i => `  ${i.quantity}x ${i.name} \u2014 \u00A3${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return `Weekly deliveries aren't automated yet, but I can help! Here's what you usually order:\n${lines}\n\n\u{1F4B0} Total: \u00A3${total.toFixed(2)}\n\nWant me to place this order for Friday? Isha will set up the weekly schedule for you \u{1F44D}`;
  },

  ESCALATE_SPLIT_WITH_BREAKDOWN: (total, splitCount) => {
    const perPerson = Math.round(total / splitCount * 100) / 100;
    return `I can't split payments automatically, but here's the breakdown:\n  Your order total: \u00A3${total.toFixed(2)}\n  ${splitCount}-way split: \u00A3${perPerson.toFixed(2)} each\n\nI've flagged this for Isha \u2014 she'll arrange the split payment for you \u{1F64F}`;
  },

  ESCALATE_PRICE_MATCH_WITH_PRODUCT: (productName, price) =>
    `I can't match other shops' prices, but our prices are very competitive!\n\n\u{1F4B7} ${productName}: \u00A3${Number(price).toFixed(2)}\n\nWould you like to add it to your order?`,

  ESCALATE_PRICE_MATCH_ASK: "I can't match other shops' prices, but our prices are very competitive!\nWhat product are you looking for? I'll show you our price so you can compare.",
};

// ============================================================================
// HELPERS
// ============================================================================

function calcTotal(items) {
  return items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
}

/** Check if message is a "done" / "that's all" / "finish" signal */
function isDoneSignal(text) {
  const lower = text.toLowerCase().trim();
  return /^(done|that'?s?\s*all|finish|finished|checkout|check\s*out|place\s*order)$/i.test(lower);
}

/** Check if message is a confirmation */
function isConfirmation(text) {
  const lower = text.toLowerCase().trim();
  return /^(yes|yeah|yep|yea|confirm|ok|okay|sure|go\s*ahead|proceed|\u{1F44D}|\u2705)$/iu.test(lower);
}

/** Check if message is a rejection / change request */
function isRejection(text) {
  const lower = text.toLowerCase().trim();
  return /^(no|nope|nah|cancel|change|wait|hold\s*on|stop|\u274C)$/iu.test(lower);
}

/** Check if message is a cancellation */
function isCancellation(text) {
  const lower = text.toLowerCase().trim();
  return /^(cancel|cancel\s*order|cancel\s*everything|never\s*mind|forget\s*it)$/i.test(lower);
}

/** Detect recurring/subscription requests */
function isRecurringRequest(text) {
  const lower = text.toLowerCase().trim();
  return /weekly\s*(delivery|order)|every\s*(week|friday|monday|saturday)|recurring|subscription|set\s*up.*regular/i.test(lower);
}

/** Detect split payment requests */
function isSplitPayment(text) {
  const lower = text.toLowerCase().trim();
  return /split.*(bill|payment|pay)|half.*half|share.*cost/i.test(lower);
}

/** Detect price match requests */
function isPriceMatch(text) {
  const lower = text.toLowerCase().trim();
  return /price\s*match|match.*(price|their)|other\s*shop.*price|competitor/i.test(lower);
}

/** Detect if the message is about identity/wrong number */
function isIdentityQuery(text) {
  const lower = text.toLowerCase().trim();
  return /is this.*(isha|shop|store|right number|correct number)|wrong number|who is this/i.test(lower);
}

/** Detect payment-related queries */
function isPaymentQuery(text) {
  const lower = text.toLowerCase().trim();
  return /can i pay.*(later|tomorrow|next|card|transfer)|pay on delivery|payment plan|how.*pay/i.test(lower);
}

// ============================================================================
// PRODUCT SEARCH + CART HELPERS
// ============================================================================

/**
 * Search for products from classified items and return cart entries.
 * Returns { found: [...], notFound: [...] }
 */
async function resolveItems(classifiedItems) {
  const found = [];
  const notFound = [];

  for (const item of classifiedItems) {
    try {
      const results = await searchProduct(item.product);
      if (results.length > 0) {
        const best = results[0];
        found.push({
          name: best.product,
          quantity: item.quantity || 1,
          unit: item.unit || null,
          price: Number(best.price) || 0,
        });
      } else {
        notFound.push(item.product);
      }
    } catch (err) {
      console.error(`[order-processor] Product search failed for "${item.product}":`, err.message);
      notFound.push(item.product);
    }
  }

  return { found, notFound };
}

/**
 * Apply a single modification to the current cart.
 * Actions: cancel/remove, add, change_quantity, remove_last
 */
async function applySingleModification(cart, mod) {
  if (!mod) return cart;

  const action = mod.action;
  const target = (mod.target || '').toLowerCase();

  if (action === 'cancel' || action === 'remove') {
    return cart.filter(item => !item.name.toLowerCase().includes(target));
  }

  if (action === 'remove_last') {
    return cart.slice(0, -1);
  }

  if (action === 'add' && mod.new_value) {
    try {
      const results = await searchProduct(mod.new_value);
      if (results.length > 0) {
        const best = results[0];
        cart.push({
          name: best.product,
          quantity: mod.quantity || 1,
          unit: mod.unit || null,
          price: Number(best.price) || 0,
        });
      }
    } catch (err) {
      console.error(`[order-processor] Product search failed during add:`, err.message);
    }
  }

  if (action === 'change_quantity') {
    // E4: "I meant 2kg not 20kg" -- find by target name or by original_quantity
    const newQty = typeof mod.new_value === 'number' ? mod.new_value : parseInt(mod.new_value) || 1;

    let matched = false;
    for (const item of cart) {
      // Match by target name
      if (target && item.name.toLowerCase().includes(target)) {
        item.quantity = newQty;
        if (mod.unit) item.unit = mod.unit;
        matched = true;
        break;
      }
      // Match by original quantity (e.g., "I meant 2 not 20" -- find item with qty 20)
      if (mod.original_quantity && item.quantity === mod.original_quantity) {
        item.quantity = newQty;
        if (mod.unit) item.unit = mod.unit;
        matched = true;
        break;
      }
    }

    // If no target specified but we have original_quantity, search by that
    if (!matched && !target && mod.original_quantity) {
      for (const item of cart) {
        if (item.quantity === mod.original_quantity) {
          item.quantity = newQty;
          if (mod.unit) item.unit = mod.unit;
          break;
        }
      }
    }
  }

  return cart;
}

/**
 * Apply a modification to the current cart.
 * Supports both single modification and compound modifications (E1).
 */
async function applyModification(cart, classification) {
  // E1: Compound modifications -- "modifications" array
  if (classification.modifications && Array.isArray(classification.modifications)) {
    for (const mod of classification.modifications) {
      cart = await applySingleModification([...cart], mod);
    }
    return cart;
  }

  // Single modification
  if (classification.modification) {
    return applySingleModification(cart, classification.modification);
  }

  return cart;
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

/**
 * Process an incoming WhatsApp message and return a response string.
 *
 * @param {string} phone - Customer phone number (E.164 format)
 * @param {string} messageText - Raw message text
 * @param {string|null} mediaUrl - Optional media URL (e.g., Twilio voice note URL)
 * @returns {Promise<string>} - Response to send back via WhatsApp
 */
export async function processMessage(phone, messageText, mediaUrl = null) {
  try {
    // E10: Media message detection (voice notes, images)
    if (mediaUrl) {
      // If there's a text message with the media, treat as complaint with photo evidence
      if (messageText && messageText.trim() !== '') {
        // Process the text but note that media was attached (for complaint escalation)
        const hasComplaintSignal = /missing|wrong|damaged|broken|bad|problem|issue|not right|messed up/i.test(messageText);
        if (hasComplaintSignal) {
          return TEMPLATES.COMPLAINT_WITH_MEDIA;
        }
        // Otherwise process the text normally (media ignored)
      } else {
        // Media only, no text
        return TEMPLATES.MEDIA_UNSUPPORTED;
      }
    }

    // Guard against empty messages
    if (!messageText || messageText.trim() === '') {
      return TEMPLATES.CANT_UNDERSTAND;
    }

    // 1. Get or create conversation session
    let session;
    try {
      session = await getOrCreateSession(phone);
    } catch (err) {
      console.error('[order-processor] Session error:', err.message);
      return TEMPLATES.SERVICE_ERROR;
    }

    const state = session.state;
    const cart = session.current_order || [];

    // 2. Classify the message
    let classification;
    try {
      classification = await classifyMessage(messageText);
    } catch (err) {
      console.error('[order-processor] Classification error:', err.message);
      // Even if classification fails completely, we can handle simple cases
      classification = {
        intent: 'general_query',
        items: [],
        context_clues: {},
        modification: null,
        confidence: 0,
      };
    }

    const intent = classification.intent;
    const clues = classification.context_clues || {};

    console.log(`[order-processor] Phone: ${phone} | State: ${state} | Intent: ${intent}`);

    // 3. Route based on state + intent
    switch (state) {
      case 'IDLE':
        return await handleIdle(session, phone, messageText, intent, classification, clues);

      case 'ORDERING':
        return await handleOrdering(session, phone, messageText, intent, classification, cart);

      case 'CONFIRMING':
        return await handleConfirming(session, phone, messageText, intent, classification, cart);

      case 'MODIFYING':
        return await handleModifying(session, phone, messageText, intent, classification, cart);

      case 'AWAITING_CLARIFICATION':
        return await handleIdle(session, phone, messageText, intent, classification, clues);

      default:
        return TEMPLATES.CANT_UNDERSTAND;
    }
  } catch (err) {
    console.error('[order-processor] Unhandled error:', err);
    return TEMPLATES.SERVICE_ERROR;
  }
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

async function handleIdle(session, phone, messageText, intent, classification, clues) {
  // E8: Identity query -- "Is this still Isha's?"
  if (isIdentityQuery(messageText)) {
    return TEMPLATES.IDENTITY_CONFIRM;
  }

  // E9: Payment query -- "Can I pay tomorrow?"
  if (isPaymentQuery(messageText)) {
    return TEMPLATES.PAYMENT_QUERY;
  }

  // Graceful escalation checks (before intent switch)
  if (isRecurringRequest(messageText)) {
    return TEMPLATES.ESCALATE_RECURRING;
  }
  if (isSplitPayment(messageText)) {
    // If there's a recent order in context, show breakdown
    if (cart.length > 0) {
      const total = calcTotal(cart);
      const waysMatch = messageText.match(/(\d+)\s*ways?/i);
      const splitCount = waysMatch ? parseInt(waysMatch[1]) : 2;
      return TEMPLATES.ESCALATE_SPLIT_WITH_BREAKDOWN(total, splitCount);
    }
    return TEMPLATES.ESCALATE_SPLIT_PAYMENT;
  }
  if (isPriceMatch(messageText)) {
    // Try to extract a product from the message and show our price
    const pmMatch = messageText.match(/price.*(?:for|on|of)\s+(.+?)[\?\.]?\s*$/i) ||
                     messageText.match(/match.*price.*(?:for|on|of)\s+(.+?)[\?\.]?\s*$/i);
    if (pmMatch) {
      try {
        const results = await searchProduct(pmMatch[1].trim());
        if (results.length > 0) {
          return TEMPLATES.ESCALATE_PRICE_MATCH_WITH_PRODUCT(results[0].product, results[0].price);
        }
      } catch (err) {
        console.error('[order-processor] Price match search failed:', err.message);
      }
    }
    return TEMPLATES.ESCALATE_PRICE_MATCH_ASK;
  }

  switch (intent) {
    case 'greeting':
      return TEMPLATES.GREETING;

    // Cancel in IDLE = no active order
    case 'cancel_order':
      return TEMPLATES.NO_ACTIVE_ORDER;

    // Business info -- shop hours, location, delivery
    case 'business_info':
      return TEMPLATES.BUSINESS_HOURS;

    // Order tracking -- escalate to Isha
    case 'order_tracking':
      return TEMPLATES.ORDER_TRACKING(clues.order_reference || null);

    // Complaint / feedback
    case 'complaint': {
      const product = clues.feedback_product || null;
      const feedback = clues.feedback_text || null;

      // Try to update preferences in the KG if we have product + feedback
      if (product && feedback) {
        try {
          const result = await resolveContext(phone, {
            feedback: feedback,
            product: product,
          });
          if (result.updated) {
            return TEMPLATES.PREFERENCE_UPDATED(result.previous.name, result.current.name);
          }
        } catch (err) {
          console.error('[order-processor] Preference update failed:', err.message);
        }
      }

      return TEMPLATES.COMPLAINT_ACK(product, feedback);
    }

    // Collection delegate
    case 'collection_delegate': {
      const collector = clues.collector_name || null;
      const relationship = clues.references_person || null;
      return TEMPLATES.COLLECTION_DELEGATE(collector, relationship);
    }

    // E2: Running total in IDLE state
    case 'running_total':
      return TEMPLATES.NO_ORDER_YET;

    // E5: Address update in IDLE state
    case 'address_update': {
      const address = clues.delivery_address;
      if (address) {
        await updateSession(session.id, {
          context: { ...(session.context || {}), delivery_address: address },
        });
        return TEMPLATES.ADDRESS_SAVED(address) + "\n\nWhat would you like to order?";
      }
      return "What's your delivery address?";
    }

    case 'new_order': {
      const { found, notFound } = await resolveItems(classification.items || []);
      if (found.length === 0 && notFound.length > 0) {
        return TEMPLATES.CANT_FIND(notFound[0]);
      }
      if (found.length === 0) {
        return TEMPLATES.CANT_UNDERSTAND;
      }

      // Save delivery address if provided alongside the order
      const orderAddress = clues.delivery_address;
      const sessionContext = { ...(session.context || {}) };
      if (orderAddress) {
        sessionContext.delivery_address = orderAddress;
      }

      await updateSession(session.id, {
        state: 'ORDERING',
        current_order: found,
        context: sessionContext,
      });

      let response = TEMPLATES.RUNNING_TOTAL(found, calcTotal(found));
      if (orderAddress) {
        response += `\n\n\u{1F4CD} Delivering to: ${orderAddress}`;
      }
      if (notFound.length > 0) {
        response += `\n\n\u26A0\uFE0F Couldn't find: ${notFound.join(', ')}`;
      }
      return response;
    }

    case 'reorder': {
      // Check for vague references that should use last discussed product
      const vaguePattern = /\b(the thing|that one|that thing|you know|the one)\b/i;
      if (vaguePattern.test(messageText) && session.context?.last_discussed_product) {
        return TEMPLATES.CLARIFY_LAST_DISCUSSED(session.context.last_discussed_product);
      }

      try {
        const result = await resolveContext(phone, clues);
        if (result.items.length === 0) {
          return "I don't have any previous orders on file for you yet. Just tell me what you'd like!";
        }

        await updateSession(session.id, {
          state: 'CONFIRMING',
          current_order: result.items,
          context: { source: result.source, explanation: result.explanation },
        });

        return TEMPLATES.CONTEXT_SUMMARY(result.explanation, result.items, calcTotal(result.items));
      } catch (err) {
        console.error('[order-processor] Context resolve failed:', err.message);
        return TEMPLATES.SERVICE_ERROR;
      }
    }

    // Compound reorder + modify: "Same as last week but add palm oil"
    case 'reorder_modify': {
      try {
        const result = await resolveContext(phone, clues);
        if (result.items.length === 0) {
          return "I don't have any previous orders on file for you yet. Just tell me what you'd like!";
        }

        // Apply modifications to the reordered items
        let cart = result.items.map(i => ({ ...i }));
        cart = await applyModification(cart, classification);

        // Also add any new items from classification
        const newItems = classification.items || [];
        if (newItems.length > 0) {
          const { found } = await resolveItems(newItems);
          cart = [...cart, ...found];
        }

        await updateSession(session.id, {
          state: 'CONFIRMING',
          current_order: cart,
          context: { source: result.source, explanation: result.explanation + ' (with changes)' },
        });

        return TEMPLATES.CONTEXT_SUMMARY(
          result.explanation + ' with your changes',
          cart,
          calcTotal(cart)
        );
      } catch (err) {
        console.error('[order-processor] Reorder+modify failed:', err.message);
        return TEMPLATES.SERVICE_ERROR;
      }
    }

    case 'meal_order': {
      try {
        const result = await resolveContext(phone, clues);
        if (result.items.length === 0) {
          return `Sorry, I couldn't find a recipe for "${clues.references_meal || messageText}". Try something like "Jollof rice ingredients for 10".`;
        }

        await updateSession(session.id, {
          state: 'CONFIRMING',
          current_order: result.items,
          context: { source: result.source, explanation: result.explanation },
        });

        return TEMPLATES.CONTEXT_SUMMARY(result.explanation, result.items, calcTotal(result.items));
      } catch (err) {
        console.error('[order-processor] Meal resolve failed:', err.message);
        return TEMPLATES.SERVICE_ERROR;
      }
    }

    case 'budget_order': {
      try {
        const result = await resolveContext(phone, clues);
        if (result.items.length === 0) {
          return "I couldn't build a cart within that budget. Do you have any order history with us?";
        }

        await updateSession(session.id, {
          state: 'CONFIRMING',
          current_order: result.items,
          context: { source: result.source, explanation: result.explanation },
        });

        return TEMPLATES.CONTEXT_SUMMARY(result.explanation, result.items, calcTotal(result.items));
      } catch (err) {
        console.error('[order-processor] Budget resolve failed:', err.message);
        return TEMPLATES.SERVICE_ERROR;
      }
    }

    case 'price_enquiry': {
      const items = classification.items || [];
      if (items.length === 0) {
        const cleaned = messageText.replace(/^(and|also|what about|how much is|how much are|how much for|price of|price for)\s+/i, '').replace(/\?+$/, '').trim();
        try {
          const directSearch = await searchProduct(cleaned);
          if (directSearch.length > 0) {
            return TEMPLATES.PRICE_RESPONSE(directSearch);
          }
        } catch (err) {
          console.error('[order-processor] Price search failed:', err.message);
          return TEMPLATES.SERVICE_ERROR;
        }
        return "What product would you like the price for?";
      }

      const allResults = [];
      const notFoundItems = [];
      for (const item of items) {
        try {
          const results = await searchProduct(item.product);
          if (results.length > 0) {
            allResults.push(results[0]);
          } else {
            notFoundItems.push(item.product);
          }
        } catch (err) {
          console.error(`[order-processor] Price search failed for "${item.product}":`, err.message);
          notFoundItems.push(item.product);
        }
      }

      if (allResults.length === 0 && notFoundItems.length > 0) {
        return TEMPLATES.CANT_FIND(notFoundItems[0]);
      }

      // Save last discussed product for vague follow-up references
      if (allResults.length > 0) {
        await updateSession(session.id, {
          context: { ...(session.context || {}), last_discussed_product: allResults[0].product },
        });
      }

      let response = TEMPLATES.PRICE_RESPONSE(allResults);
      if (notFoundItems.length > 0) {
        response += `\n\nCouldn't find: ${notFoundItems.join(', ')}`;
      }
      return response;
    }

    case 'general_query': {
      // Check specific sub-types before falling through
      if (isIdentityQuery(messageText)) return TEMPLATES.IDENTITY_CONFIRM;
      if (isPaymentQuery(messageText)) return TEMPLATES.PAYMENT_QUERY;

      // Enhanced recurring request: show usual order alongside escalation
      if (isRecurringRequest(messageText)) {
        try {
          const usualResult = await resolveContext(phone, { references_previous: true });
          if (usualResult.items.length > 0) {
            return TEMPLATES.ESCALATE_RECURRING_WITH_ORDER(usualResult.items, calcTotal(usualResult.items));
          }
        } catch (err) {
          console.error('[order-processor] Usual order lookup for recurring failed:', err.message);
        }
        return TEMPLATES.ESCALATE_RECURRING;
      }

      // Enhanced split payment: show breakdown if there's an active order context
      if (isSplitPayment(messageText)) return TEMPLATES.ESCALATE_SPLIT_PAYMENT;

      // Enhanced price match: ask for or show product price
      if (isPriceMatch(messageText)) {
        // Try to extract a product from the message
        const pmMatch = messageText.match(/price.*(?:for|on|of)\s+(.+?)[\?\.]?\s*$/i) ||
                         messageText.match(/match.*price.*(?:for|on|of)\s+(.+?)[\?\.]?\s*$/i);
        if (pmMatch) {
          try {
            const results = await searchProduct(pmMatch[1].trim());
            if (results.length > 0) {
              return TEMPLATES.ESCALATE_PRICE_MATCH_WITH_PRODUCT(results[0].product, results[0].price);
            }
          } catch (err) {
            console.error('[order-processor] Price match search failed:', err.message);
          }
        }
        return TEMPLATES.ESCALATE_PRICE_MATCH_ASK;
      }

      // Vague reference with last discussed product
      const vaguePatternGQ = /\b(the thing|that one|that thing|you know|the one)\b/i;
      if (vaguePatternGQ.test(messageText) && session.context?.last_discussed_product) {
        return TEMPLATES.CLARIFY_LAST_DISCUSSED(session.context.last_discussed_product);
      }

      return TEMPLATES.CANT_UNDERSTAND;
    }

    default:
      return TEMPLATES.CANT_UNDERSTAND;
  }
}

async function handleOrdering(session, phone, messageText, intent, classification, cart) {
  // Check for "done" signal first
  if (isDoneSignal(messageText)) {
    if (cart.length === 0) {
      return TEMPLATES.EMPTY_CART;
    }

    await updateSession(session.id, {
      state: 'CONFIRMING',
    });

    return TEMPLATES.ORDER_SUMMARY(cart, calcTotal(cart));
  }

  // Check for cancellation (both regex and intent)
  if (isCancellation(messageText) || intent === 'cancel_order') {
    await clearSession(phone);
    return TEMPLATES.CANCELLED;
  }

  // E8: Identity query mid-order
  if (isIdentityQuery(messageText)) {
    return TEMPLATES.IDENTITY_CONFIRM + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  // E9: Payment query mid-order
  if (isPaymentQuery(messageText)) {
    return TEMPLATES.PAYMENT_QUERY + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  // Business info mid-order
  if (intent === 'business_info') {
    return TEMPLATES.BUSINESS_HOURS + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  // Order tracking mid-order
  if (intent === 'order_tracking') {
    const clues = classification.context_clues || {};
    return TEMPLATES.ORDER_TRACKING(clues.order_reference || null) + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  // Complaint mid-order
  if (intent === 'complaint') {
    const clues = classification.context_clues || {};
    return TEMPLATES.COMPLAINT_ACK(clues.feedback_product || null, clues.feedback_text || null) + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  // Collection delegate mid-order
  if (intent === 'collection_delegate') {
    const clues = classification.context_clues || {};
    await updateSession(session.id, {
      context: { ...(session.context || {}), collector: clues.collector_name, collector_relationship: clues.references_person },
    });
    return TEMPLATES.COLLECTION_DELEGATE(clues.collector_name || null, clues.references_person || null) + `\n\n\u{1F4CB} You still have ${cart.length} item(s) in your cart.`;
  }

  switch (intent) {
    // E2: Running total while ordering
    case 'running_total': {
      if (cart.length === 0) {
        return TEMPLATES.EMPTY_CART;
      }
      return TEMPLATES.RUNNING_TOTAL(cart, calcTotal(cart));
    }

    // E5: Address update while ordering
    case 'address_update': {
      const address = (classification.context_clues || {}).delivery_address;
      if (address) {
        await updateSession(session.id, {
          context: { ...(session.context || {}), delivery_address: address },
        });
        return TEMPLATES.ADDRESS_SAVED(address) + `\n\n\u{1F4CB} Your cart still has ${cart.length} item(s). Keep adding or say 'done'.`;
      }
      return "What's your delivery address?";
    }

    case 'new_order': {
      const { found, notFound } = await resolveItems(classification.items || []);
      const updatedCart = [...cart, ...found];

      await updateSession(session.id, {
        current_order: updatedCart,
      });

      let response = TEMPLATES.RUNNING_TOTAL(updatedCart, calcTotal(updatedCart));
      if (notFound.length > 0) {
        response += `\n\n\u26A0\uFE0F Couldn't find: ${notFound.join(', ')}`;
      }
      return response;
    }

    // E1, E3, E4: Modifications (single, compound, remove_last, quantity correction)
    case 'modify_order': {
      let updatedCart = await applyModification([...cart], classification);

      // Also add any new items from the classification (e.g. "and 3 plantains")
      const newItems = classification.items || [];
      if (newItems.length > 0) {
        const { found } = await resolveItems(newItems);
        updatedCart = [...updatedCart, ...found];
      }

      await updateSession(session.id, {
        current_order: updatedCart,
      });

      if (updatedCart.length === 0) {
        return "Your cart is now empty. Add some items or say 'cancel' to stop.";
      }

      return TEMPLATES.RUNNING_TOTAL(updatedCart, calcTotal(updatedCart));
    }

    case 'price_enquiry': {
      const items = classification.items || [];
      if (items.length === 0) {
        const cleaned = messageText.replace(/^(and|also|what about|how much is|how much are|how much for|price of|price for)\s+/i, '').replace(/\?+$/, '').trim();
        try {
          const directSearch = await searchProduct(cleaned);
          if (directSearch.length > 0) {
            return TEMPLATES.PRICE_RESPONSE(directSearch) + `\n\n\u{1F4CB} Your cart still has ${cart.length} item(s).`;
          }
        } catch (err) {
          console.error('[order-processor] Price search failed:', err.message);
        }
        return "What product would you like the price for?";
      }

      const results = [];
      for (const item of items) {
        try {
          const found = await searchProduct(item.product);
          if (found.length > 0) results.push(found[0]);
        } catch (err) {
          console.error(`[order-processor] Price search failed for "${item.product}":`, err.message);
        }
      }

      if (results.length === 0) return TEMPLATES.CANT_FIND(items[0].product);
      return TEMPLATES.PRICE_RESPONSE(results) + `\n\n\u{1F4CB} Your cart still has ${cart.length} item(s).`;
    }

    default:
      return TEMPLATES.RUNNING_TOTAL(cart, calcTotal(cart));
  }
}

async function handleConfirming(session, phone, messageText, intent, classification, cart) {
  if (isConfirmation(messageText)) {
    try {
      // Save to Neo4j
      const { orderId } = await saveOrderToGraph(phone, cart);

      // Update preferences in background (don't await to avoid delay)
      updateCustomerPreferences(phone, cart).catch(err =>
        console.error('[order-processor] Preference update failed:', err.message)
      );

      // Clear session
      await clearSession(phone);

      return TEMPLATES.CONFIRMED(orderId);
    } catch (err) {
      console.error('[order-processor] Order save failed:', err.message);
      return TEMPLATES.SERVICE_ERROR;
    }
  }

  if (isRejection(messageText) || isCancellation(messageText)) {
    if (isCancellation(messageText)) {
      await clearSession(phone);
      return TEMPLATES.CANCELLED;
    }

    // Move to modifying state
    await updateSession(session.id, {
      state: 'MODIFYING',
    });

    return "No problem! Tell me what you'd like to change.";
  }

  // Split payment in CONFIRMING state: show order breakdown with split
  if (isSplitPayment(messageText)) {
    const total = calcTotal(cart);
    // Try to extract split count from message (e.g. "three ways", "3 ways", "half" = 2)
    const waysMatch = messageText.match(/(\d+)\s*ways?/i);
    const splitCount = waysMatch ? parseInt(waysMatch[1]) : 2; // default to 2 (half-half)
    return TEMPLATES.ESCALATE_SPLIT_WITH_BREAKDOWN(total, splitCount);
  }

  // E5: Address update during confirmation
  if (intent === 'address_update') {
    const address = (classification.context_clues || {}).delivery_address;
    if (address) {
      await updateSession(session.id, {
        context: { ...(session.context || {}), delivery_address: address },
      });
      return TEMPLATES.ADDRESS_SAVED(address) + '\n\n' + TEMPLATES.ORDER_SUMMARY(cart, calcTotal(cart));
    }
  }

  // E2: Running total during confirmation (just re-show the summary)
  if (intent === 'running_total') {
    return TEMPLATES.ORDER_SUMMARY(cart, calcTotal(cart));
  }

  // Treat as a modification attempt (E1, E3, E4)
  if (intent === 'modify_order') {
    const updatedCart = await applyModification([...cart], classification);

    // Also add any new items
    let finalCart = updatedCart;
    const newItems = classification.items || [];
    if (newItems.length > 0) {
      const { found } = await resolveItems(newItems);
      finalCart = [...updatedCart, ...found];
    }

    await updateSession(session.id, {
      state: 'CONFIRMING',
      current_order: finalCart,
    });

    if (finalCart.length === 0) {
      await clearSession(phone);
      return TEMPLATES.CANCELLED;
    }

    return TEMPLATES.ORDER_SUMMARY(finalCart, calcTotal(finalCart));
  }

  return TEMPLATES.ORDER_SUMMARY(cart, calcTotal(cart));
}

async function handleModifying(session, phone, messageText, intent, classification, cart) {
  // Check for "done" signal
  if (isDoneSignal(messageText)) {
    if (cart.length === 0) {
      await clearSession(phone);
      return "Your cart was empty, so I've cleared the order. Send a message anytime to start fresh!";
    }

    await updateSession(session.id, {
      state: 'CONFIRMING',
    });

    return TEMPLATES.ORDER_SUMMARY(cart, calcTotal(cart));
  }

  if (isCancellation(messageText)) {
    await clearSession(phone);
    return TEMPLATES.CANCELLED;
  }

  // E2: Running total while modifying
  if (intent === 'running_total') {
    if (cart.length === 0) {
      return "Your cart is currently empty. Add some items or say 'cancel'.";
    }
    return TEMPLATES.RUNNING_TOTAL(cart, calcTotal(cart));
  }

  // E5: Address update while modifying
  if (intent === 'address_update') {
    const address = (classification.context_clues || {}).delivery_address;
    if (address) {
      await updateSession(session.id, {
        context: { ...(session.context || {}), delivery_address: address },
      });
      return TEMPLATES.ADDRESS_SAVED(address) + "\n\nAnything else to change? Say 'done' when ready.";
    }
  }

  // E1, E3, E4: Apply modifications
  if (intent === 'modify_order') {
    const updatedCart = await applyModification([...cart], classification);

    // Also add any new items
    let finalCart = updatedCart;
    const newItems = classification.items || [];
    if (newItems.length > 0) {
      const { found } = await resolveItems(newItems);
      finalCart = [...updatedCart, ...found];
    }

    await updateSession(session.id, {
      state: 'CONFIRMING',
      current_order: finalCart,
    });

    if (finalCart.length === 0) {
      await clearSession(phone);
      return "All items removed. Order cancelled. Send a message anytime to start a new order!";
    }

    return TEMPLATES.ORDER_SUMMARY(finalCart, calcTotal(finalCart));
  }

  // If they say a new product, try adding it
  if (intent === 'new_order') {
    const { found, notFound } = await resolveItems(classification.items || []);
    const updatedCart = [...cart, ...found];

    await updateSession(session.id, {
      state: 'CONFIRMING',
      current_order: updatedCart,
    });

    let response = TEMPLATES.ORDER_SUMMARY(updatedCart, calcTotal(updatedCart));
    if (notFound.length > 0) {
      response += `\n\n\u26A0\uFE0F Couldn't find: ${notFound.join(', ')}`;
    }
    return response;
  }

  return "Tell me what to change, or say 'done' to confirm your order.";
}
