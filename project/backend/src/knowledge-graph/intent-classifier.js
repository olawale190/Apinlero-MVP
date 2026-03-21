import Anthropic from '@anthropic-ai/sdk';
import { Langfuse } from 'langfuse';
import 'dotenv/config';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
  flushAt: 1,
});

// ============================================================================
// EMOJI PRE-PROCESSING
// ============================================================================

const EMOJI_PRODUCT_MAP = {
  '\u{1F35A}': 'rice',       // 🍚
  '\u{1F357}': 'chicken',    // 🍗
  '\u{1FAD2}': 'palm oil',   // 🫒
  '\u{1F9C5}': 'onion',      // 🧅
  '\u{1F95A}': 'egg',        // 🥚
  '\u{1F34C}': 'plantain',   // 🍌
  '\u{1F41F}': 'fish',       // 🐟
  '\u{1F336}\uFE0F': 'pepper', // 🌶️
  '\u{1F336}': 'pepper',     // 🌶
  '\u{1F345}': 'tomato',     // 🍅
};

/**
 * Pre-process message: resolve emoji+number patterns like "🍚 2" → "2 rice"
 * Returns { processed: string, hadEmoji: boolean }
 */
export function preprocessMessage(messageText) {
  if (!messageText) return { processed: '', hadEmoji: false };

  let text = messageText.trim();
  let hadEmoji = false;

  // Pattern: emoji followed by optional space and a number (e.g., "🍚 2" or "🍚2")
  for (const [emoji, product] of Object.entries(EMOJI_PRODUCT_MAP)) {
    const emojiPattern = new RegExp(
      emoji.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*(\\d+)',
      'g'
    );
    if (emojiPattern.test(text)) {
      hadEmoji = true;
      text = text.replace(new RegExp(
        emoji.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*(\\d+)',
        'g'
      ), (_, qty) => `${qty} ${product}`);
    }
  }

  // Pattern: number followed by optional space and emoji (e.g., "2 🍚" or "2🍚")
  for (const [emoji, product] of Object.entries(EMOJI_PRODUCT_MAP)) {
    const numEmojiPattern = new RegExp(
      '(\\d+)\\s*' + emoji.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
      'g'
    );
    if (numEmojiPattern.test(text)) {
      hadEmoji = true;
      text = text.replace(new RegExp(
        '(\\d+)\\s*' + emoji.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
        'g'
      ), (_, qty) => `${qty} ${product}`);
    }
  }

  // Standalone emoji without number → "1 <product>"
  for (const [emoji, product] of Object.entries(EMOJI_PRODUCT_MAP)) {
    if (text.includes(emoji)) {
      hadEmoji = true;
      text = text.replace(new RegExp(emoji.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), `1 ${product}`);
    }
  }

  return { processed: text.trim(), hadEmoji };
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are the order processing AI for Isha's Treat & Groceries, an ethnic grocery shop in London serving the African diaspora community.

Given a customer's WhatsApp message, classify the intent and extract structured data.
Respond ONLY in JSON. No markdown, no explanation, no backticks.

Intent types:
- "new_order" — Customer wants to order specific items
- "reorder" — References previous order ("the usual", "same as last week", "again")
- "reorder_modify" — Reorder with modifications ("same as last week but add palm oil", "the usual but no onions")
- "modify_order" — Change current order ("cancel the rice", "add beans", "remove last item", "I meant 2kg not 20kg")
- "price_enquiry" — Asking about prices, NOT ordering
- "meal_order" — Ordering by meal name ("jollof rice ingredients", "egusi soup ingredients")
- "budget_order" — Ordering by budget ("£50 worth of provisions")
- "quantity_estimate" — Needs help with quantities ("enough for 20 people")
- "running_total" — Asking what's in their cart or how much it costs ("how much is everything so far?", "what's my total?", "what have I ordered?")
- "address_update" — Providing or changing delivery address ("deliver to 14 Market Street", "my address changed")
- "business_info" — Questions about shop hours, location, contact, services ("what time do you close?", "where are you located?", "do you deliver?")
- "order_tracking" — Checking on a placed order ("where's my order?", "when is it arriving?", "order #1042 status")
- "complaint" — Reporting a problem or giving feedback ("the yam was too soft", "1kg rice is missing", "wrong item delivered", "the quality was bad")
- "collection_delegate" — Someone else will collect ("my sister Funke will collect", "my husband will pick it up")
- "cancel_order" — Explicitly cancelling ("cancel my order", "cancel everything", "never mind")
- "general_query" — Not an order (wrong number, payment question, "can I pay tomorrow?", "is this still Isha's?")
- "time_based_order" — References a past order by time ("same as last week", "reorder from 2 weeks ago", "same as December")
- "greeting" — Just saying hello

Response format:
{
  "intent": "new_order",
  "items": [
    {"product": "rice", "quantity": 2, "unit": "kg", "size": null, "notes": ""}
  ],
  "context_clues": {
    "references_previous": false,
    "references_person": null,
    "references_time": null,
    "references_meal": null,
    "references_budget": null,
    "serving_size": null,
    "servings": null,
    "delivery_address": null,
    "order_reference": null,
    "collector_name": null,
    "feedback_product": null,
    "feedback_text": null,
    "references_product": null,
    "preference_aware": false
  },
  "requires_knowledge_graph": false,
  "modification": null,
  "confidence": 0.95
}

Rules:
- "How much is X?" → ALWAYS price_enquiry, never new_order
- "How much is everything so far?" / "What's my total?" → running_total
- "The usual" / "same as" / "again" / "reorder" → reorder, requires_knowledge_graph: true
- "Same as last week" / "reorder from 2 weeks ago" / "same as December" → time_based_order, requires_knowledge_graph: true, context_clues.references_time: "last week"
- "Same as last week but add palm oil" / "the usual but no onions" → reorder_modify (reorder + modification in one message)
  Set requires_knowledge_graph: true, include context_clues for the reorder part, AND include modification/modifications for the changes.
- "My mum's order" → reorder, references_person: "mother"
- "Jollof rice ingredients" → meal_order, references_meal: "Jollof Rice"
- "Jollof rice for 50 people" → meal_order, references_meal: "Jollof Rice", servings: 50 (NOT serving_size)
- "£50 worth" → budget_order, references_budget: 50
- Ambiguous quantity → set to 1, add notes: "quantity unspecified"
- For modifications: "modification": {"action": "cancel"|"add"|"remove_last"|"change_quantity", "target": "rice", "new_value": "beans"}
- COMPOUND MODIFICATIONS: "Cancel the rice, add beans instead" → modify_order with "modifications" array:
  "modifications": [{"action": "cancel", "target": "rice"}, {"action": "add", "new_value": "beans"}]
  (Use "modifications" plural for multiple changes in one message)
- QUANTITY CORRECTIONS: "I meant 2kg not 20kg" → modify_order, modification: {"action": "change_quantity", "target": "20kg item", "new_value": 2, "unit": "kg", "original_quantity": 20}
- "Remove the last item" → modify_order, modification: {"action": "remove_last"}
- "Deliver to <address>" / "My address changed to <address>" → address_update, context_clues.delivery_address: "<full address>"
- If a new_order message ALSO contains a delivery address, extract BOTH: set intent to "new_order" with items AND set context_clues.delivery_address
- "What time do you close?" / "opening hours" / "where are you?" / "do you deliver?" → business_info
- "Where's my order?" / "order #1042" / "when is it arriving?" / "delivery status" → order_tracking, context_clues.order_reference: "#1042" (if given)
- "The yam was too soft" / "wrong item" / "missing item" / "quality was bad" → complaint, context_clues.feedback_product: "yam", context_clues.feedback_text: "too soft"
- "My sister Funke will collect" / "my husband will pick up" → collection_delegate, context_clues.collector_name: "Funke", context_clues.references_person: "sister"
- "Cancel my order" / "cancel everything" / "never mind" → cancel_order
- "Is this still Isha's?" / "wrong number" → general_query
- "Can I pay tomorrow?" / "pay later" → general_query
- "Set up weekly delivery" / "recurring order" / "every Friday" → general_query (not yet supported, flag for escalation)
- "Split the bill" / "split payment" → general_query (not yet supported)
- "Can you match their price?" / "price match" → general_query (not yet supported)

PIDGIN / YORUBA:
- Nigerian Pidgin: "abeg" = please, "wetin" = what, "how much" in Pidgin = price enquiry
- "Abeg send me garri" / "Abeg give me rice" → new_order
- Cultural measurement terms: "derica" = 1 cup (~250ml), "mudu" = 4 cups (~1L), "congo" = small bag, "paint" = bucket (~4L)
- "two derica of crayfish" → new_order with product: "crayfish", quantity: 2, unit: "cup", notes: "derica (~250ml measuring cup)"
- Parse these naturally alongside standard English

RECOMMENDATION RECALL:
- "The goat meat Aunty Isha recommended" / "that spice mix from last time" → reorder with context_clues.references_product: "goat meat"
- When the message references a specific product from a past order or recommendation, set references_product to the product term

PREFERENCE AWARENESS:
- "You know what I like" / "the way I like it" / "my preference" → set context_clues.preference_aware: true
- This can appear alongside meal_order or reorder intents

CONVERSATION CONTEXT:
You may receive a conversation context showing recent exchanges (e.g., what product was just discussed).
Use this context to resolve follow-up messages:
- "ok I need 2" after discussing plantain → new_order with product: "plantain", quantity: 2
- "give me 3" after a price enquiry for rice → new_order with product: "rice", quantity: 3
- "yes add it" after discussing palm oil → new_order with product: "palm oil", quantity: 1
- "how about 5kg?" after discussing rice → new_order with product: "rice", quantity: 5, unit: "kg"
Set context_clues.references_previous = true when the product is inferred from conversation context.`;

const FALLBACK_RESULT = {
  intent: 'general_query',
  items: [],
  context_clues: {
    references_previous: false,
    references_person: null,
    references_time: null,
    references_meal: null,
    references_budget: null,
    serving_size: null,
    servings: null,
    delivery_address: null,
    order_reference: null,
    collector_name: null,
    feedback_product: null,
    feedback_text: null,
    references_product: null,
    preference_aware: false,
  },
  requires_knowledge_graph: false,
  modification: null,
  confidence: 0,
};

// ============================================================================
// REGEX FALLBACK CLASSIFIER
// ============================================================================

/**
 * Simple regex-based classifier for when the Claude API is unavailable.
 * Handles obvious patterns like "I want X of Y", "2kg rice", "3 plantains".
 */
export function regexFallbackClassify(messageText) {
  const text = (messageText || '').trim();
  const lower = text.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|yo|sup)\b/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'greeting', confidence: 0.7 };
  }

  // Time-based order: "same as last week", "reorder from 2 weeks ago"
  const TIME_TERMS = /same as (last week|last month|yesterday|\d+ weeks? ago|january|february|march|april|may|june|july|august|september|october|november|december)|reorder from/i;
  const timeMatch = lower.match(TIME_TERMS);
  if (timeMatch) {
    const timeRef = timeMatch[1] || 'last week';
    return {
      ...FALLBACK_RESULT,
      intent: 'time_based_order',
      context_clues: { ...FALLBACK_RESULT.context_clues, references_time: timeRef },
      requires_knowledge_graph: true,
      confidence: 0.7,
    };
  }

  // Cancel order
  if (/^(cancel|cancel\s*(my\s*)?order|cancel\s*everything|never\s*mind|forget\s*it)$/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'cancel_order', confidence: 0.8 };
  }

  // Business info
  if (/what time.*(close|open|shut)|opening hours|closing time|where (are|is) (you|the shop)|do you deliver|delivery area/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'business_info', confidence: 0.7 };
  }

  // Order tracking
  if (/where.*(my|the) order|order.*(status|update|tracking)|when.*(arriving|delivered|ready)|ref\s*#?\d+/i.test(lower)) {
    const refMatch = lower.match(/#?(\d{3,})/);
    return {
      ...FALLBACK_RESULT,
      intent: 'order_tracking',
      context_clues: { ...FALLBACK_RESULT.context_clues, order_reference: refMatch ? `#${refMatch[1]}` : null },
      confidence: 0.7,
    };
  }

  // Complaint
  if (/missing|wrong item|too soft|too hard|bad quality|damaged|broken|not fresh|complaint|problem with/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'complaint', confidence: 0.6 };
  }

  // Collection delegate
  if (/(sister|brother|wife|husband|friend|mum|mom|dad)\s+\w+\s+will\s+(collect|pick)/i.test(lower) ||
      /will\s+(collect|pick\s*up)|someone.*(collect|pick)/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'collection_delegate', confidence: 0.6 };
  }

  // Running total
  if (/how much.*(so far|everything|total)|what('s| is) my total|what have i ordered/i.test(lower)) {
    return { ...FALLBACK_RESULT, intent: 'running_total', confidence: 0.7 };
  }

  // Price enquiry
  if (/how much (is|are|for)|price (of|for)|what does .* cost/i.test(lower)) {
    const product = lower.replace(/^(how much (is|are|for)|price (of|for)|what does)\s+/i, '')
      .replace(/\?+$/, '').replace(/cost\??$/, '').trim();
    return {
      ...FALLBACK_RESULT,
      intent: 'price_enquiry',
      items: product ? [{ product, quantity: 1, unit: null }] : [],
      confidence: 0.6,
    };
  }

  // Pidgin order patterns: "abeg send me garri", "abeg give me 2 rice"
  const pidginMatch = lower.match(/abeg\s+(?:send|give|bring)\s+(?:me\s+)?(?:(\d+)\s*(?:(?:derica|mudu|congo|paint)\s+(?:of\s+)?)?)?(.+)/i);
  if (pidginMatch) {
    const quantity = pidginMatch[1] ? parseInt(pidginMatch[1]) : 1;
    const product = pidginMatch[2].replace(/please\s*$/, '').trim();
    if (product) {
      // Check for cultural unit in the original text
      const unitMatch = lower.match(/(derica|mudu|congo|paint)/);
      const unit = unitMatch ? unitMatch[1] : null;
      return {
        ...FALLBACK_RESULT,
        intent: 'new_order',
        items: [{ product, quantity, unit }],
        confidence: 0.6,
      };
    }
  }

  // Pidgin with cultural units: "two derica of crayfish", "3 mudu of garri"
  const culturalUnitMatch = lower.match(/(\d+)\s*(derica|mudu|congo|paint)\s+(?:of\s+)?(.+)/);
  if (culturalUnitMatch) {
    const quantity = parseInt(culturalUnitMatch[1]);
    const unit = culturalUnitMatch[2];
    const product = culturalUnitMatch[3].replace(/please\s*$/, '').trim();
    if (product && quantity > 0) {
      return {
        ...FALLBACK_RESULT,
        intent: 'new_order',
        items: [{ product, quantity, unit }],
        confidence: 0.6,
      };
    }
  }

  // Patterns: "I want/need X of Y", "Xkg Y", "X Y", "give me X Y"
  const orderPatterns = [
    /(?:i\s+(?:want|need)|give\s+me|can\s+i\s+(?:get|have))\s+(\d+)\s*(?:kg|g|tins?|bags?|bottles?|packs?|pieces?)?\s*(?:of\s+)?(.+)/i,
    /(\d+)\s*(?:kg|g)\s+(?:of\s+)?(.+)/i,
    /(\d+)\s*(?:tins?|bags?|bottles?|packs?|pieces?)\s+(?:of\s+)?(.+)/i,
    /(\d+)\s+(.+)/i,
  ];

  for (const pattern of orderPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const quantity = parseInt(match[1]);
      const product = match[2].replace(/please\s*$/, '').trim();
      if (product && quantity > 0) {
        // Extract unit if present
        const unitMatch = text.match(/(\d+)\s*(kg|g|tins?|bags?|bottles?|packs?|pieces?)/i);
        const unit = unitMatch ? unitMatch[2].replace(/s$/, '') : null;

        return {
          ...FALLBACK_RESULT,
          intent: 'new_order',
          items: [{ product, quantity, unit }],
          confidence: 0.5,
        };
      }
    }
  }

  return { ...FALLBACK_RESULT };
}

// ============================================================================
// MAIN CLASSIFIER
// ============================================================================

export async function classifyMessage(messageText) {
  // Pre-process emoji messages
  const { processed, hadEmoji } = preprocessMessage(messageText);
  const textToClassify = hadEmoji ? processed : messageText;

  const trace = langfuse.trace({ name: 'intent-classification', input: textToClassify });

  try {
    const generation = trace.generation({
      name: 'classify-intent',
      model: 'claude-sonnet-4-20250514',
      input: [{ role: 'user', content: textToClassify }],
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: textToClassify }],
    });

    const text = response.content[0].text.trim();
    const result = JSON.parse(text);

    generation.end({
      output: result,
      usage: {
        input: response.usage?.input_tokens,
        output: response.usage?.output_tokens,
      },
    });
    trace.update({ output: result.intent });

    // Tag if emoji preprocessing was used
    if (hadEmoji) {
      result._preprocessed = true;
      result._original = messageText;
    }

    return result;
  } catch (err) {
    trace.update({ output: err.message, level: 'ERROR' });

    if (err instanceof SyntaxError) {
      console.error('[intent-classifier] Malformed JSON from Claude:', err.message);
    } else {
      console.error('[intent-classifier] API error:', err.message);
    }

    // Fall back to regex classifier instead of returning empty result
    console.log('[intent-classifier] Falling back to regex classifier');
    const fallback = regexFallbackClassify(textToClassify);
    fallback._fallback = true;
    // Tag rate-limit fallbacks so callers can retry
    if (err.status === 429 || (err.message && err.message.includes('rate_limit_error'))) {
      fallback._rateLimited = true;
    }
    return fallback;
  }
}
