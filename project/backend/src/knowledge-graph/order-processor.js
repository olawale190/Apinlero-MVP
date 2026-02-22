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
    if (mediaUrl && (!messageText || messageText.trim() === '')) {
      return TEMPLATES.MEDIA_UNSUPPORTED;
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

  switch (intent) {
    case 'greeting':
      return TEMPLATES.GREETING;

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

      await updateSession(session.id, {
        state: 'ORDERING',
        current_order: found,
      });

      let response = TEMPLATES.RUNNING_TOTAL(found, calcTotal(found));
      if (notFound.length > 0) {
        response += `\n\n\u26A0\uFE0F Couldn't find: ${notFound.join(', ')}`;
      }
      return response;
    }

    case 'reorder': {
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

      let response = TEMPLATES.PRICE_RESPONSE(allResults);
      if (notFoundItems.length > 0) {
        response += `\n\nCouldn't find: ${notFoundItems.join(', ')}`;
      }
      return response;
    }

    case 'general_query':
      // Check specific sub-types before falling through
      if (isIdentityQuery(messageText)) return TEMPLATES.IDENTITY_CONFIRM;
      if (isPaymentQuery(messageText)) return TEMPLATES.PAYMENT_QUERY;
      return TEMPLATES.CANT_UNDERSTAND;

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

  // Check for cancellation
  if (isCancellation(messageText)) {
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
