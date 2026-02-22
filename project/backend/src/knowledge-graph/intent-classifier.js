import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
- "modify_order" — Change current order ("cancel the rice", "add beans", "remove last item", "I meant 2kg not 20kg")
- "price_enquiry" — Asking about prices, NOT ordering
- "meal_order" — Ordering by meal name ("jollof rice ingredients", "egusi soup ingredients")
- "budget_order" — Ordering by budget ("£50 worth of provisions")
- "quantity_estimate" — Needs help with quantities ("enough for 20 people")
- "running_total" — Asking what's in their cart or how much it costs ("how much is everything so far?", "what's my total?", "what have I ordered?")
- "address_update" — Providing or changing delivery address ("deliver to 14 Market Street", "my address changed")
- "general_query" — Not an order (wrong number, payment question, complaint, "can I pay tomorrow?", "is this still Isha's?")
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
    "delivery_address": null
  },
  "requires_knowledge_graph": false,
  "modification": null,
  "confidence": 0.95
}

Rules:
- "How much is X?" → ALWAYS price_enquiry, never new_order
- "How much is everything so far?" / "What's my total?" → running_total
- "The usual" / "same as" / "again" / "reorder" → reorder, requires_knowledge_graph: true
- "My mum's order" → reorder, references_person: "mother"
- "Jollof rice ingredients" → meal_order, references_meal: "Jollof Rice"
- "£50 worth" → budget_order, references_budget: 50
- Ambiguous quantity → set to 1, add notes: "quantity unspecified"
- For modifications: "modification": {"action": "cancel"|"add"|"remove_last"|"change_quantity", "target": "rice", "new_value": "beans"}
- COMPOUND MODIFICATIONS: "Cancel the rice, add beans instead" → modify_order with "modifications" array:
  "modifications": [{"action": "cancel", "target": "rice"}, {"action": "add", "new_value": "beans"}]
  (Use "modifications" plural for multiple changes in one message)
- QUANTITY CORRECTIONS: "I meant 2kg not 20kg" → modify_order, modification: {"action": "change_quantity", "target": "20kg item", "new_value": 2, "unit": "kg", "original_quantity": 20}
- "Remove the last item" → modify_order, modification: {"action": "remove_last"}
- "Deliver to <address>" / "My address changed to <address>" → address_update, context_clues.delivery_address: "<full address>"
- "Is this still Isha's?" / "wrong number" → general_query
- "Can I pay tomorrow?" / "pay later" → general_query`;

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
    delivery_address: null,
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

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: textToClassify }],
    });

    const text = response.content[0].text.trim();
    const result = JSON.parse(text);

    // Tag if emoji preprocessing was used
    if (hadEmoji) {
      result._preprocessed = true;
      result._original = messageText;
    }

    return result;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('[intent-classifier] Malformed JSON from Claude:', err.message);
    } else {
      console.error('[intent-classifier] API error:', err.message);
    }

    // Fall back to regex classifier instead of returning empty result
    console.log('[intent-classifier] Falling back to regex classifier');
    const fallback = regexFallbackClassify(textToClassify);
    fallback._fallback = true;
    return fallback;
  }
}
