/**
 * Àpínlẹ̀rọ Message Parser
 *
 * Intelligent parsing of WhatsApp messages to extract:
 * - Intent (order, inquiry, greeting, etc.)
 * - Order items (product + quantity)
 * - Delivery address
 * - Customer preferences
 *
 * Now powered by Neo4j Knowledge Graph for Yoruba + English matching!
 *
 * SECURITY: All inputs should be pre-sanitized before reaching this module
 */

import { matchProductFromGraph, isNeo4jAvailable } from './neo4j-matcher.js';

// Fallback product catalog with aliases (used when Neo4j is unavailable)
const PRODUCT_ALIASES = {
  'Palm Oil 5L': ['palm oil', 'red oil', 'zomi', 'epo pupa', 'adin'],
  'Jollof Rice Mix': ['jollof', 'jollof rice', 'jollof mix', 'party jollof'],
  'Rice': ['rice', 'long grain rice', 'iresi'],
  'Plantain (Green)': ['plantain', 'green plantain', 'unripe plantain', 'ogede'],
  'Egusi Seeds': ['egusi', 'melon seeds', 'agusi', 'egwusi'],
  'Stockfish': ['stockfish', 'stock fish', 'okporoko', 'panla'],
  'Scotch Bonnet Peppers': ['scotch bonnet', 'pepper', 'ata rodo', 'hot pepper', 'chili'],
  'Yam Flour': ['yam flour', 'elubo', 'amala flour', 'amala'],
  'Maggi Seasoning': ['maggi', 'seasoning', 'seasoning cubes', 'knorr'],
  'Cassava Flour': ['cassava', 'garri', 'eba', 'gari', 'cassava flour'],
  'Dried Crayfish': ['crayfish', 'dried crayfish', 'crawfish'],
  'Garden Eggs': ['garden eggs', 'african eggplant', 'igba'],
  'Fufu Flour': ['fufu', 'pounded yam', 'poundo', 'iyan'],
  'Coconut Oil 1L': ['coconut oil', 'coconut'],
  'Red Palm Oil': ['red palm oil', 'palm kernel oil'],
  'African Nutmeg': ['nutmeg', 'ehuru', 'ariwo']
};

// Intent keywords - expanded for natural language understanding
const INTENT_PATTERNS = {
  // Greetings - more natural variations
  GREETING: /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|yo|hiya|morning|evening|afternoon|sup|what'?s\s*up)/i,

  // Product listing
  PRODUCTS_LIST: /(products|catalog|catalogue|menu|what\s*(do\s*)?you\s*(have|sell|stock|got)|view\s*catalog|view\s*products|show\s*me|list|browse)/i,

  // Explicit order start
  START_ORDER: /(📦\s*)?(place\s*(an?\s*)?order|order\s*now|new\s*order|start\s*order|make\s*(an?\s*)?order|i\s*want\s*to\s*order)/i,

  // General order intent - expanded for natural language
  ORDER: /(order|buy|want|need|get|send|deliver|i('d)?\s*like|can\s*i\s*(have|get)|please|looking\s*for|interested\s*in|gimme|give\s*me)/i,

  // Implicit order intent - cooking/preparing meals
  IMPLICIT_ORDER: /(cooking|making|preparing|recipe|need\s*for|running\s*low|ran\s*out|finishing|almost\s*out)/i,

  // Price inquiries
  PRICE_CHECK: /(how\s*much|price|cost|what('s)?\s*the\s*price|how\s*dear)/i,

  // Availability checks
  AVAILABILITY: /(do\s*you\s*have|available|in\s*stock|got\s*any|still\s*have|have\s*you\s*got)/i,

  // Delivery inquiries
  DELIVERY: /(deliver|delivery\s*info|shipping|ship\s*to|send\s*to|delivery\s*to|can\s*you\s*deliver)/i,

  // Business hours
  HOURS: /(open|close|hours|time|when\s*(are\s*you|do\s*you))/i,

  // Order status
  ORDER_STATUS: /(track|where\s*is|status|my\s*order|order\s*status)/i,

  // Cancellation
  CANCEL: /(cancel|refund|return|never\s*mind|forget\s*it)/i,

  // Confirmation - more natural variations (flexible - allows trailing words like "yes please", "yeah sure")
  CONFIRM: /^(yes|yeah|yep|yup|yh|ye|ya|yas|yass|yea|confirm|ok|okay|k|sure|correct|right|proceed|go\s*ahead|sounds\s*good|perfect|looks\s*good|that'?s\s*right|that'?s\s*correct|all\s*good|good|fine|great|absolutely|definitely|affirmative|👍|✅|same\s*address|yes\s*please|yep\s*please|please|do\s*it|let'?s\s*go|go\s*for\s*it)(\s|$|[!.,?]|please|thanks|thank\s*you|mate|bro|sis|sure|definitely)*/i,

  // Decline - more natural variations (flexible - allows trailing words like "no thanks", "nope sorry")
  DECLINE: /^(no|nope|nah|na|cancel|stop|wrong|no\s*way|noway|don'?t|not\s*now|never\s*mind|nevermind|forget\s*it|changed\s*my\s*mind|no\s*thanks|nah\s*thanks|👎|❌|x)(\s|$|[!.,?]|thanks|thank\s*you|sorry|mate|bro)*/i,

  // Thanks
  THANKS: /(thank|thanks|cheers|appreciate|ta\b)/i,

  // Payment methods
  PAYMENT_CASH: /(💵\s*)?(cash|cash\s*on\s*delivery|cod|pay\s*cash|pay\s*on\s*delivery|when\s*it\s*arrives)/i,
  PAYMENT_CARD: /(💳\s*)?(card|pay\s*now|pay\s*online|debit|credit|online\s*payment)/i,
  PAYMENT_TRANSFER: /(🏦\s*)?(bank\s*transfer|transfer|bank|bacs|wire)/i,

  // Quick commands for faster ordering
  REORDER: /^(reorder|same\s*again|repeat|usual|last\s*order|my\s*usual|🔄)$/i,
  QUICK_ORDER: /^quick\s+/i,

  // Conversational/casual - for friendliness
  CASUAL_INQUIRY: /(what'?s\s*up|how\s*are\s*you|you\s*there|hello\s*there|anyone\s*there)/i
};

/**
 * Detect the intent of a message with context awareness
 * @param {string} message - The message text
 * @param {string|null} conversationState - Current conversation state for context
 * @returns {string} - The detected intent
 */
export function detectIntent(message, conversationState = null) {
  const text = message.toLowerCase().trim();

  // Context-aware: If awaiting confirmation, be more lenient
  if (conversationState === 'AWAITING_CONFIRMATION') {
    if (INTENT_PATTERNS.CONFIRM.test(text)) return 'CONFIRM';
    if (INTENT_PATTERNS.DECLINE.test(text)) return 'DECLINE';
  }

  // Check for confirmation/decline first (exact matches)
  if (INTENT_PATTERNS.CONFIRM.test(text)) return 'CONFIRM';
  if (INTENT_PATTERNS.DECLINE.test(text)) return 'DECLINE';

  // Check for quick commands (reorder, etc.)
  if (INTENT_PATTERNS.REORDER.test(text)) return 'REORDER';
  if (INTENT_PATTERNS.QUICK_ORDER.test(text)) return 'QUICK_ORDER';

  // Check for payment methods
  if (INTENT_PATTERNS.PAYMENT_CASH.test(text)) return 'PAYMENT_CASH';
  if (INTENT_PATTERNS.PAYMENT_CARD.test(text)) return 'PAYMENT_CARD';
  if (INTENT_PATTERNS.PAYMENT_TRANSFER.test(text)) return 'PAYMENT_TRANSFER';

  // Check greetings and casual inquiries
  if (INTENT_PATTERNS.GREETING.test(text) && text.length < 30) return 'GREETING';
  if (INTENT_PATTERNS.CASUAL_INQUIRY.test(text)) return 'GREETING';

  // Check other intents
  if (INTENT_PATTERNS.START_ORDER.test(text)) return 'START_ORDER';
  if (INTENT_PATTERNS.PRODUCTS_LIST.test(text)) return 'PRODUCTS_LIST';
  if (INTENT_PATTERNS.PRICE_CHECK.test(text)) return 'PRICE_CHECK';
  if (INTENT_PATTERNS.AVAILABILITY.test(text)) return 'AVAILABILITY';
  if (INTENT_PATTERNS.DELIVERY.test(text) && !INTENT_PATTERNS.ORDER.test(text)) return 'DELIVERY_INQUIRY';
  if (INTENT_PATTERNS.HOURS.test(text)) return 'BUSINESS_HOURS';
  if (INTENT_PATTERNS.ORDER_STATUS.test(text)) return 'ORDER_STATUS';
  if (INTENT_PATTERNS.CANCEL.test(text)) return 'CANCEL';
  if (INTENT_PATTERNS.THANKS.test(text)) return 'THANKS';

  // Check for implicit order intent (cooking/preparing + product mention)
  if (INTENT_PATTERNS.IMPLICIT_ORDER.test(text) && hasProductMentioned(text)) {
    return 'NEW_ORDER';
  }

  // Check if it looks like an order (has quantities or product names)
  if (hasOrderIndicators(text)) return 'NEW_ORDER';

  return 'GENERAL_INQUIRY';
}

/**
 * Check if message mentions any product
 * @param {string} text - Message text
 * @returns {boolean} - True if a product is mentioned
 */
function hasProductMentioned(text) {
  const lowerText = text.toLowerCase();
  return Object.values(PRODUCT_ALIASES).some(aliases =>
    aliases.some(alias => lowerText.includes(alias.toLowerCase()))
  );
}

/**
 * Check if message contains order indicators
 */
function hasOrderIndicators(text) {
  // Has quantity patterns
  const hasQuantity = /\d+\s*(x|kg|bags?|bottles?|packs?|pieces?|tins?|cartons?)/i.test(text);

  // Has product names
  const hasProduct = Object.values(PRODUCT_ALIASES).some(aliases =>
    aliases.some(alias => text.includes(alias.toLowerCase()))
  );

  // Has order keywords
  const hasOrderKeyword = INTENT_PATTERNS.ORDER.test(text);

  // Allow order with just product name + order keyword (no quantity needed)
  return (hasQuantity && hasProduct) || (hasOrderKeyword && hasProduct);
}

/**
 * Parse order items from message (async for Neo4j matching)
 * @param {string} message - The message text
 * @returns {Promise<Array>} - Array of {product, quantity, unit, matched, language, confidence}
 */
export async function parseOrderItems(message) {
  const items = [];
  const text = message.toLowerCase();

  // Pattern 1: "2x Palm Oil" or "2 x palm oil"
  const pattern1 = /(\d+)\s*x\s*([a-zA-Z\s]+?)(?=,|\n|$|\d)/gi;

  // Pattern 2: "3 bags rice" or "5kg plantain"
  const pattern2 = /(\d+)\s*(bags?|bottles?|kg|packs?|pieces?|tins?|cartons?|liters?|l)\s+(?:of\s+)?([a-zA-Z\s]+?)(?=,|\n|$|\d)/gi;

  // Pattern 3: "palm oil - 2" or "rice 3"
  const pattern3 = /([a-zA-Z\s]+?)\s*[-–]?\s*(\d+)(?:\s*(bags?|bottles?|kg|packs?))?\s*(?=,|\n|$)/gi;

  // Pattern 4: Just product name without quantity (defaults to 1)
  // e.g., "I want coconut oil" or "order palm oil"

  // Extract with pattern 1
  let match;
  const pattern1Matches = [];
  while ((match = pattern1.exec(text)) !== null) {
    pattern1Matches.push({ quantity: parseInt(match[1]), productText: match[2].trim(), originalText: match[0] });
  }

  for (const m of pattern1Matches) {
    const matchedProduct = await matchProduct(m.productText);
    if (matchedProduct) {
      items.push({
        product: matchedProduct.name,
        quantity: m.quantity,
        unit: 'Each',
        originalText: m.originalText,
        matchedText: matchedProduct.matchedText || matchedProduct.name,
        language: matchedProduct.language,
        confidence: matchedProduct.confidence,
        source: matchedProduct.source,
        typoDetected: matchedProduct.typoDetected || false
      });
    }
  }

  // Extract with pattern 2
  const pattern2Matches = [];
  while ((match = pattern2.exec(text)) !== null) {
    pattern2Matches.push({
      quantity: parseInt(match[1]),
      unit: normalizeUnit(match[2]),
      productText: match[3].trim(),
      originalText: match[0]
    });
  }

  for (const m of pattern2Matches) {
    const matchedProduct = await matchProduct(m.productText);
    if (matchedProduct) {
      items.push({
        product: matchedProduct.name,
        quantity: m.quantity,
        unit: m.unit,
        originalText: m.originalText,
        matchedText: matchedProduct.matchedText || matchedProduct.name,
        language: matchedProduct.language,
        confidence: matchedProduct.confidence,
        source: matchedProduct.source,
        typoDetected: matchedProduct.typoDetected || false
      });
    }
  }

  // Extract with pattern 3 (only if we don't have items yet)
  if (items.length === 0) {
    const pattern3Matches = [];
    while ((match = pattern3.exec(text)) !== null) {
      pattern3Matches.push({
        productText: match[1].trim(),
        quantity: parseInt(match[2]),
        unit: match[3] ? normalizeUnit(match[3]) : 'Each',
        originalText: match[0]
      });
    }

    for (const m of pattern3Matches) {
      if (m.quantity > 0 && m.quantity < 100) {
        const matchedProduct = await matchProduct(m.productText);
        if (matchedProduct) {
          items.push({
            product: matchedProduct.name,
            quantity: m.quantity,
            unit: m.unit,
            originalText: m.originalText,
            matchedText: matchedProduct.matchedText || matchedProduct.name,
            language: matchedProduct.language,
            confidence: matchedProduct.confidence,
            source: matchedProduct.source,
            typoDetected: matchedProduct.typoDetected || false
          });
        }
      }
    }
  }

  // Pattern 4: If no items found, try to find product names and default to quantity 1
  if (items.length === 0) {
    // Try matching each word/phrase in the message
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // Try single words and 2-3 word combinations
      for (let len = 1; len <= Math.min(3, words.length - i); len++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length >= 3) {
          const matchedProduct = await matchProduct(phrase);
          if (matchedProduct && matchedProduct.confidence >= 0.8) {
            items.push({
              product: matchedProduct.name,
              quantity: 1,
              unit: 'Each',
              originalText: phrase,
              matchedText: matchedProduct.matchedText || matchedProduct.name,
              language: matchedProduct.language,
              confidence: matchedProduct.confidence,
              source: matchedProduct.source,
              typoDetected: matchedProduct.typoDetected || false
            });
            break;
          }
        }
      }
    }
  }

  // Deduplicate items
  const uniqueItems = [];
  const seen = new Set();
  for (const item of items) {
    const key = `${item.product}-${item.unit}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * Match product text to catalog product using Neo4j Knowledge Graph
 * Falls back to local aliases if Neo4j is unavailable
 *
 * @param {string} text - Product text from message
 * @returns {Promise<Object|null>} - Matched product info or null
 */
export async function matchProduct(text) {
  const normalizedText = text.toLowerCase().trim();

  // Try Neo4j Knowledge Graph first (Yoruba + English aliases)
  if (isNeo4jAvailable()) {
    try {
      const graphMatch = await matchProductFromGraph(normalizedText);
      if (graphMatch) {
        console.log(`🧠 Neo4j matched "${normalizedText}" → ${graphMatch.product} (${graphMatch.language}, ${graphMatch.confidence * 100}%)`);
        return {
          name: graphMatch.product,
          price: graphMatch.price,
          category: graphMatch.category,
          alias: graphMatch.alias,
          matchedText: graphMatch.alias || graphMatch.product,
          originalText: text,
          language: graphMatch.language,
          confidence: graphMatch.confidence,
          source: graphMatch.source,
          typoDetected: false  // Neo4j matches are exact
        };
      }
    } catch (error) {
      console.warn('Neo4j matching failed, using fallback:', error.message);
    }
  }

  // Fallback to local matching
  return matchProductLocal(normalizedText);
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Fuzzy match products with typo tolerance
 * Uses Levenshtein distance to find close matches
 * @param {string} text - User input (possibly with typos)
 * @returns {Object|null} - Best match with confidence score
 */
function fuzzyMatchProduct(text) {
  let bestMatch = null;
  let bestDistance = Infinity;
  const normalizedText = text.toLowerCase().trim();

  // Only try fuzzy matching if text is long enough (3+ chars)
  if (normalizedText.length < 3) return null;

  // Fuzzy match against product names
  for (const [productName, aliases] of Object.entries(PRODUCT_ALIASES)) {
    // Check product name with typo tolerance (max 2 character difference)
    const productDistance = levenshteinDistance(normalizedText, productName.toLowerCase());
    if (productDistance <= 2 && productDistance < bestDistance) {
      bestDistance = productDistance;
      bestMatch = {
        name: productName,
        matchedText: productName,
        originalText: text,
        language: 'english',
        confidence: 1 - (productDistance / Math.max(productName.length, normalizedText.length)),
        source: 'fuzzy_product',
        typoDetected: productDistance > 0
      };
    }

    // Check aliases with stricter tolerance (max 1 character difference)
    for (const alias of aliases) {
      const aliasDistance = levenshteinDistance(normalizedText, alias);
      if (aliasDistance <= 1 && aliasDistance < bestDistance) {
        bestDistance = aliasDistance;
        bestMatch = {
          name: productName,
          matchedText: alias,
          originalText: text,
          language: alias.match(/epo|adin|zomi|ogede|egwusi|agusi|okporoko|panla|ata|elubo|igba|ehuru|ariwo|iyan/) ? 'yoruba' : 'english',
          confidence: 1 - (aliasDistance / Math.max(alias.length, normalizedText.length)),
          source: 'fuzzy_alias',
          typoDetected: aliasDistance > 0
        };
      }
    }
  }

  // Only return if confidence is high enough (>70%)
  if (bestMatch && bestMatch.confidence >= 0.7) {
    return bestMatch;
  }

  return null;
}

/**
 * Local fallback product matching (when Neo4j is unavailable)
 * @param {string} text - Normalized product text
 * @returns {Object|null} - Matched product info or null
 */
function matchProductLocal(text) {
  // Direct match on product name (exact substring)
  for (const [productName, aliases] of Object.entries(PRODUCT_ALIASES)) {
    if (productName.toLowerCase().includes(text) ||
        text.includes(productName.toLowerCase())) {
      return {
        name: productName,
        alias: null,
        language: 'english',
        confidence: 0.9,
        source: 'local_product',
        typoDetected: false
      };
    }

    // Check aliases (exact substring)
    for (const alias of aliases) {
      if (text.includes(alias) || alias.includes(text)) {
        return {
          name: productName,
          alias: alias,
          language: alias.match(/epo|adin|zomi|ogede|egwusi|agusi|okporoko|panla|ata|elubo|igba|ehuru|ariwo|iyan/) ? 'yoruba' : 'english',
          confidence: 0.85,
          source: 'local_alias',
          typoDetected: false
        };
      }
    }
  }

  // Try fuzzy matching as last resort
  return fuzzyMatchProduct(text);
}

/**
 * Normalize unit strings
 */
function normalizeUnit(unit) {
  const u = unit.toLowerCase();
  if (u.includes('bag')) return 'bag';
  if (u.includes('bottle') || u.includes('liter') || u === 'l') return 'bottle';
  if (u.includes('kg')) return 'kg';
  if (u.includes('pack')) return 'pack';
  if (u.includes('piece')) return 'piece';
  if (u.includes('tin')) return 'tin';
  if (u.includes('carton')) return 'carton';
  return 'Each';
}

/**
 * Parse delivery address from message
 * @param {string} message - The message text
 * @returns {Object} - {address, postcode}
 */
export function parseAddress(message) {
  // UK postcode pattern
  const postcodeMatch = message.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}/i);

  // Address keywords
  const addressKeywords = ['deliver to', 'address:', 'delivery:', 'send to', 'at', 'location:'];
  let address = null;

  for (const kw of addressKeywords) {
    const idx = message.toLowerCase().indexOf(kw);
    if (idx !== -1) {
      // Extract text after keyword
      const afterKeyword = message.substring(idx + kw.length);
      // Take until newline or end
      address = afterKeyword.split('\n')[0].trim();
      // Remove leading punctuation
      address = address.replace(/^[:\s-]+/, '').trim();
      break;
    }
  }

  // If we found a postcode but no address, try to extract address around postcode
  if (!address && postcodeMatch) {
    // Look for text before postcode
    const postcodeIdx = message.indexOf(postcodeMatch[0]);
    const beforePostcode = message.substring(Math.max(0, postcodeIdx - 100), postcodeIdx);
    // Find last sentence or line
    const lines = beforePostcode.split(/[.\n]/);
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine.length > 5) {
      address = lastLine + ' ' + postcodeMatch[0];
    }
  }

  // Format postcode with proper spacing (e.g., "SE154AA" -> "SE15 4AA")
  let formattedPostcode = null;
  if (postcodeMatch) {
    const pc = postcodeMatch[0].toUpperCase().replace(/\s+/g, '');
    // Insert space before the last 3 characters (inward code)
    formattedPostcode = pc.slice(0, -3) + ' ' + pc.slice(-3);
  }

  return {
    address: address || null,
    postcode: formattedPostcode
  };
}

/**
 * Get delivery zone from postcode
 * @param {string} postcode - UK postcode
 * @returns {Object} - {zone, fee, estimatedDelivery}
 */
export function getDeliveryZone(postcode) {
  if (!postcode) return { zone: null, fee: 10, estimatedDelivery: '2-3 days' };

  const prefix = postcode.toUpperCase().match(/^[A-Z]+/)?.[0];

  const zones = {
    'E': { zone: 1, fee: 5, estimatedDelivery: 'Same day' },
    'N': { zone: 2, fee: 5, estimatedDelivery: 'Same day' },
    'SE': { zone: 3, fee: 5, estimatedDelivery: 'Next day' },
    'SW': { zone: 4, fee: 7, estimatedDelivery: 'Next day' },
    'W': { zone: 5, fee: 7, estimatedDelivery: 'Next day' },
    'NW': { zone: 6, fee: 7, estimatedDelivery: 'Next day' },
    'RM': { zone: 7, fee: 10, estimatedDelivery: '2-3 days' },
    'IG': { zone: 7, fee: 10, estimatedDelivery: '2-3 days' },
    'DA': { zone: 7, fee: 10, estimatedDelivery: '2-3 days' },
    'BR': { zone: 7, fee: 10, estimatedDelivery: '2-3 days' },
    'CR': { zone: 7, fee: 10, estimatedDelivery: '2-3 days' }
  };

  return zones[prefix] || { zone: 7, fee: 10, estimatedDelivery: '2-3 days' };
}

/**
 * Check if within business hours
 * @returns {boolean}
 */
export function isBusinessHours() {
  const now = new Date();
  // Convert to London time
  const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const hour = londonTime.getHours();
  const day = londonTime.getDay();

  // Mon-Sat (1-6) 8AM-8PM
  return day >= 1 && day <= 6 && hour >= 8 && hour < 20;
}

/**
 * Check if this is a complete one-message order
 * (has products AND delivery address)
 * @param {Array} items - Parsed items
 * @param {string} postcode - Parsed postcode
 * @returns {boolean}
 */
export function isCompleteOrder(items, postcode) {
  return items.length > 0 && postcode !== null;
}

/**
 * Parse the full message and return structured data (async for Neo4j)
 * @param {string} message - The message text
 * @param {string|null} conversationState - Current conversation state for context-aware parsing
 * @returns {Promise<Object>} - Parsed message data
 */
export async function parseMessage(message, conversationState = null) {
  const intent = detectIntent(message, conversationState);
  const items = await parseOrderItems(message);
  const { address, postcode } = parseAddress(message);
  const deliveryZone = getDeliveryZone(postcode);

  // Check if this is a complete one-message order
  const isComplete = isCompleteOrder(items, postcode);

  return {
    intent,
    items,
    address,
    postcode,
    deliveryZone,
    isBusinessHours: isBusinessHours(),
    originalMessage: message,
    neo4jEnabled: isNeo4jAvailable(),
    isCompleteOrder: isComplete
  };
}
