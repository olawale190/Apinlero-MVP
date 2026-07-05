/**
 * Smart Product Suggestions Module
 *
 * Provides intelligent product recommendations based on:
 * - What customer is ordering
 * - Popular cooking combinations
 * - Frequently bought together patterns
 *
 * Helps increase basket size through friendly upselling
 */

// Product pairing map - keyword → items that go well together.
// Keys are matched as substrings of the ordered product name (case-insensitive),
// so "Palm Oil 2L", "Palm Oil 5L" and "Zomi Palm Oil" all trigger 'palm oil'.
const PRODUCT_PAIRINGS = {
  'palm oil': ['Egusi Seeds', 'Stockfish', 'Dried Crayfish', 'Scotch Bonnet Peppers'],
  'jollof': ['Fresh Tomatoes', 'Scotch Bonnet Peppers', 'Red Onions'],
  'cassava': ['Palm Oil', 'Egusi Seeds', 'Stockfish'],
  'yam': ['Palm Oil', 'Egusi Seeds', 'Dried Crayfish'],
  'egusi': ['Palm Oil', 'Stockfish', 'Dried Crayfish', 'Scotch Bonnet Peppers'],
  'rice': ['Fresh Tomatoes', 'Scotch Bonnet Peppers', 'Red Onions'],
  'plantain': ['Palm Oil', 'Scotch Bonnet Peppers'],
  'stockfish': ['Palm Oil', 'Egusi Seeds', 'Dried Crayfish'],
  'scotch bonnet': ['Fresh Tomatoes', 'Red Onions', 'Palm Oil'],
  'pepper': ['Fresh Tomatoes', 'Red Onions'],
  'fufu': ['Palm Oil', 'Egusi Seeds', 'Stockfish'],
  'maggi': ['Fresh Tomatoes', 'Red Onions', 'Scotch Bonnet Peppers'],
  'garri': ['Groundnut', 'Sugar', 'Dried Fish'],
  'semovita': ['Egusi Seeds', 'Palm Oil', 'Stockfish'],
  'beans': ['Palm Oil', 'Plantain', 'Dried Crayfish'],
  'crayfish': ['Palm Oil', 'Egusi Seeds'],
  'tomato': ['Red Onions', 'Scotch Bonnet Peppers'],
  'onion': ['Fresh Tomatoes', 'Scotch Bonnet Peppers'],
  'chicken': ['Maggi Seasoning', 'Scotch Bonnet Peppers', 'Red Onions'],
  'fish': ['Palm Oil', 'Scotch Bonnet Peppers'],
  'egg': ['Bread', 'Fresh Tomatoes'],
};

/**
 * Get suggested products based on current order
 * @param {Array} currentOrder - Array of order items {product_name, quantity, ...}
 * @returns {Array} - Array of suggested product names (max 3)
 */
export function getSuggestedProducts(currentOrder) {
  const suggestions = new Set();
  const alreadyOrdered = currentOrder.map(item => (item.product_name || '').toLowerCase());

  for (const item of currentOrder) {
    const name = (item.product_name || '').toLowerCase();

    for (const [keyword, pairings] of Object.entries(PRODUCT_PAIRINGS)) {
      if (!name.includes(keyword)) continue;

      pairings.forEach(pairing => {
        const alreadyIn = alreadyOrdered.some(ordered =>
          ordered.includes(pairing.toLowerCase()) || pairing.toLowerCase().includes(ordered)
        );
        if (!alreadyIn) suggestions.add(pairing);
      });
    }
  }

  // Return max 3 suggestions
  return Array.from(suggestions).slice(0, 3);
}

/**
 * Generate a friendly suggestion message
 * @param {Array} suggestions - Array of product names to suggest
 * @param {string} tone - Tone of message ('friendly' by default)
 * @returns {string|null} - Suggestion message or null if no suggestions
 */
export function generateSuggestionMessage(suggestions, tone = 'friendly') {
  if (!suggestions || suggestions.length === 0) return null;

  // Different message variations for variety
  const messages = [
    `\n\nBy the way, lots of people also grab ${suggestions.slice(0, 2).join(' and ')} with that - need any? 😊`,
    `\n\nOh! Would you like ${suggestions.slice(0, 2).join(' or ')} too? They go great with what you ordered! 🌶️`,
    `\n\nJust so you know, we have ${suggestions.slice(0, 2).join(' and ')} in stock if you need them! 👍`,
  ];

  // Randomly select for variety
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

/**
 * Check if a product has any pairings defined
 * @param {string} productName - Product name to check
 * @returns {boolean} - True if pairings exist
 */
export function hasPairings(productName) {
  return PRODUCT_PAIRINGS.hasOwnProperty(productName);
}

/**
 * Get all pairing rules (for testing/debugging)
 * @returns {Object} - Complete pairing map
 */
export function getPairingRules() {
  return PRODUCT_PAIRINGS;
}
