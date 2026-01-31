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

// Product pairing map - items that go well together
const PRODUCT_PAIRINGS = {
  'Palm Oil 5L': ['Egusi Seeds', 'Stockfish', 'Dried Crayfish', 'Scotch Bonnet Peppers'],
  'Jollof Rice Mix': ['Fresh Tomatoes', 'Scotch Bonnet Peppers', 'Red Onions'],
  'Cassava Flour': ['Palm Oil 5L', 'Egusi Seeds', 'Stockfish'],
  'Yam Flour': ['Palm Oil 5L', 'Egusi Seeds', 'Dried Crayfish'],
  'Egusi Seeds': ['Palm Oil 5L', 'Stockfish', 'Dried Crayfish', 'Scotch Bonnet Peppers'],
  'Rice': ['Jollof Rice Mix', 'Fresh Tomatoes', 'Scotch Bonnet Peppers'],
  'Plantain (Green)': ['Palm Oil 5L', 'Scotch Bonnet Peppers'],
  'Stockfish': ['Palm Oil 5L', 'Egusi Seeds', 'Dried Crayfish'],
  'Scotch Bonnet Peppers': ['Fresh Tomatoes', 'Red Onions', 'Palm Oil 5L'],
  'Fufu Flour': ['Palm Oil 5L', 'Egusi Seeds', 'Stockfish'],
  'Maggi Seasoning': ['Fresh Tomatoes', 'Red Onions', 'Scotch Bonnet Peppers'],
};

/**
 * Get suggested products based on current order
 * @param {Array} currentOrder - Array of order items {product_name, quantity, ...}
 * @returns {Array} - Array of suggested product names (max 3)
 */
export function getSuggestedProducts(currentOrder) {
  const suggestions = new Set();
  const alreadyOrdered = currentOrder.map(item => item.product_name);

  for (const item of currentOrder) {
    const pairings = PRODUCT_PAIRINGS[item.product_name];

    if (pairings) {
      // Add suggestions that aren't already in the order
      pairings.forEach(pairing => {
        if (!alreadyOrdered.includes(pairing)) {
          suggestions.add(pairing);
        }
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
