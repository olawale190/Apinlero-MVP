/**
 * Knowledge-Graph Pre-Processor
 *
 * Injects the KG pipeline (intent classifier + context resolver) into the
 * existing WhatsApp bot message handler.
 *
 * This module is an ADDITION — if any KG dependency is unavailable (Claude API,
 * Neo4j, missing env vars), it silently falls through to the legacy handler.
 *
 * Advanced intents routed through KG:
 *   reorder              → resolveContext
 *   meal_order            → resolveMealOrder
 *   budget_order          → resolveBudgetOrder
 *   quantity_estimate     → resolveMealOrder (scaled)
 *   preference_update     → resolvePreferenceUpdate (non-order response)
 *   relationship_order    → resolveContext with relationship clues
 *   recommendation_recall → resolveContext with recommendation flag
 *   time_based_order      → resolveContext with time window
 */

import { classifyMessage } from './intent-classifier.js';
import { penceToPounds } from './currency.js';

// Lazy-loaded KG modules — resolved on first use so the bot can start
// even if the KG source files are missing.
let contextResolver = null;
let productSearch = null;
let kgLoadAttempted = false;
let kgAvailable = false;

// Intents that the KG pipeline can handle better than the legacy flow
const KG_INTENTS = new Set([
  'reorder',
  'meal_order',
  'budget_order',
  'quantity_estimate',
  'preference_update',
  'relationship_order',
  'recommendation_recall',
  'time_based_order',
]);

// ============================================================================
// INITIALISATION
// ============================================================================

/**
 * Check whether all required env vars for the KG pipeline are present.
 * Returns { available: boolean, missing: string[] }
 */
export function checkKGDependencies() {
  const required = ['ANTHROPIC_API_KEY', 'NEO4J_URI', 'NEO4J_PASSWORD'];
  const missing = required.filter(k => !process.env[k]);
  return { available: missing.length === 0, missing };
}

/**
 * Attempt to load the KG context-resolver and product-search modules.
 * Only tries once — if it fails, kgAvailable stays false forever.
 */
async function ensureKGModules() {
  if (kgLoadAttempted) return kgAvailable;
  kgLoadAttempted = true;

  const { available, missing } = checkKGDependencies();
  if (!available) {
    console.log(`[kg-preprocessor] Disabled — missing env vars: ${missing.join(', ')}`);
    return false;
  }

  try {
    const kgBasePath = '../../project/knowledge-graph/src';
    contextResolver = await import(`${kgBasePath}/context-resolver.js`);
    productSearch = await import(`${kgBasePath}/product-search.js`);
    kgAvailable = true;
    console.log('[kg-preprocessor] KG modules loaded successfully');
  } catch (err) {
    console.warn('[kg-preprocessor] Could not load KG modules:', err.message);
    kgAvailable = false;
  }

  return kgAvailable;
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Format a KG context-resolver result into a WhatsApp-friendly response
 * that matches the style of response-templates.js.
 */
function formatKGResponse(intent, result, customerName) {
  if (!result || !result.items || result.items.length === 0) {
    return null; // Signal: fall through to legacy handler
  }

  const name = customerName ? ` ${customerName}` : '';
  const items = result.items;
  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  let header = '';
  let itemLines = '';

  switch (intent) {
    case 'reorder':
      header = `🔄 Got it${name}! Here's what I found:\n_${result.explanation}_\n`;
      break;
    case 'meal_order':
      header = `🍲 ${result.explanation}\n\nHere's what you'll need:\n`;
      break;
    case 'budget_order':
      header = `💰 Budget order${name}!\n_${result.explanation}_\n`;
      break;
    case 'quantity_estimate':
      header = `📊 Here's an estimate${name}:\n_${result.explanation}_\n`;
      break;
    case 'relationship_order':
      header = `👨‍👩‍👧 Got it${name}! Order for collection:\n_${result.explanation}_\n`;
      break;
    case 'recommendation_recall':
      header = `💡 Here's what was recommended${name}:\n_${result.explanation}_\n`;
      break;
    case 'time_based_order':
      header = `📅 Here's what you ordered${name}:\n_${result.explanation}_\n`;
      break;
    default:
      header = `Here's what I found${name}:\n`;
  }

  itemLines = items.map((item, i) => {
    const price = typeof item.price === 'number' ? `£${item.price.toFixed(2)}` : '';
    const qty = item.quantity || 1;
    const unit = item.unit ? ` ${item.unit}` : '';
    const notes = item.notes ? ` _(${item.notes})_` : '';
    return `${i + 1}. ${item.name} × ${qty}${unit} ${price}${notes}`;
  }).join('\n');

  const totalLine = total > 0
    ? `\n\n*Estimated total: £${total.toFixed(2)}*`
    : '';

  const cta = '\n\nWould you like to order these? Reply *yes* to confirm, or tell me any changes.';

  return {
    text: header + itemLines + totalLine + cta,
    buttons: ['✅ Yes', '✏️ Make changes', '❌ Cancel'],
    _kgResult: result, // Attach raw result for downstream state management
  };
}

/**
 * Format a preference-update result (not an order).
 */
function formatPreferenceResponse(result) {
  if (!result || !result.updated) {
    const explanation = result?.explanation || "I couldn't update that preference.";
    return { text: `ℹ️ ${explanation}` };
  }

  return {
    text: `✅ Noted! I've updated your preference:\n`
      + `  _${result.previous.name}_ → *${result.current.name}*\n`
      + `  (${result.explanation})\n\n`
      + `I'll remember this for next time! 💚`,
  };
}

// ============================================================================
// MAIN PRE-PROCESSOR
// ============================================================================

/**
 * Try to handle the message via the KG pipeline.
 *
 * @param {string} phone       - Customer phone (E.164)
 * @param {string} messageText - Sanitized message text
 * @param {string} customerName - Customer name (may be null)
 * @param {Object} conversation - Current conversation state from message-handler
 * @returns {Object|null}
 *   - Object { text, buttons?, _kgHandled: true } if KG handled the message
 *   - null if the legacy handler should take over
 */
export async function tryKGPreprocess(phone, messageText, customerName, conversation) {
  // Only attempt for states where KG makes sense (not mid-confirmation etc.)
  const eligibleStates = new Set(['INITIAL', 'GREETED', undefined, null]);
  if (!eligibleStates.has(conversation?.state)) {
    return null;
  }

  // Ensure KG modules are loaded
  const ready = await ensureKGModules();
  if (!ready) return null;

  // Run the Claude AI classifier (already exists in the bot)
  const classification = await classifyMessage(messageText);

  // Only intercept if it's an advanced KG intent
  if (!classification || !KG_INTENTS.has(classification.intent)) {
    return null;
  }

  // If the classifier fell back to regex, don't trust it for KG intents
  if (classification._fallback) {
    return null;
  }

  console.log(`[kg-preprocessor] KG intent detected: ${classification.intent} (confidence: ${classification.confidence})`);

  const clues = classification.context_clues || {};

  // Route to the appropriate KG resolver
  let result;

  switch (classification.intent) {
    case 'reorder': {
      // Build clues for the context resolver
      const resolverClues = {
        references_previous: clues.references_previous !== false,
      };
      if (clues.references_time) resolverClues.references_time = clues.references_time;
      if (clues.references_person) resolverClues.references_person = clues.references_person;

      result = await contextResolver.resolveContext(phone, resolverClues);
      break;
    }

    case 'meal_order': {
      if (!clues.references_meal) return null;
      const servings = clues.serving_size || 4;
      result = await contextResolver.resolveMealOrder(clues.references_meal, servings);
      break;
    }

    case 'budget_order': {
      if (!clues.references_budget) return null;
      result = await contextResolver.resolveBudgetOrder(phone, clues.references_budget);
      break;
    }

    case 'quantity_estimate': {
      // "enough for 20 people" — treat as meal_order if meal referenced, else fall through
      if (clues.references_meal && clues.serving_size) {
        result = await contextResolver.resolveMealOrder(clues.references_meal, clues.serving_size);
      } else {
        return null; // Fall through — can't estimate without meal context
      }
      break;
    }

    case 'preference_update': {
      if (!clues.product || !clues.feedback) return null;
      result = await contextResolver.resolvePreferenceUpdate(phone, clues.product, clues.feedback);
      const response = formatPreferenceResponse(result);
      response._kgHandled = true;
      return response;
    }

    case 'relationship_order': {
      const resolverClues = {
        references_previous: true,
        references_person: clues.references_person || null,
        relationship_collect: true,
      };
      result = await contextResolver.resolveContext(phone, resolverClues);
      break;
    }

    case 'recommendation_recall': {
      const resolverClues = {
        references_previous: true,
        references_recommendation: true,
      };
      result = await contextResolver.resolveContext(phone, resolverClues);
      break;
    }

    case 'time_based_order': {
      const resolverClues = {
        references_previous: true,
        references_time: clues.references_time || null,
      };
      result = await contextResolver.resolveContext(phone, resolverClues);
      break;
    }

    default:
      return null;
  }

  // Format the resolver result into a WhatsApp message
  if (!result || result.confidence === 0 || !result.items || result.items.length === 0) {
    console.log(`[kg-preprocessor] KG resolver returned no results for ${classification.intent}, falling through`);
    return null;
  }

  const response = formatKGResponse(classification.intent, result, customerName);
  if (!response) return null;

  response._kgHandled = true;
  response._kgIntent = classification.intent;
  return response;
}
