/**
 * Apinlero Knowledge Graph - Smart Product Search
 *
 * Multi-strategy product search with ranked results:
 *   1. Exact match on Product.name (case-insensitive)
 *   2. Match on aliases array
 *   3. Match on cultural_names array
 *   4. Fuzzy match using Levenshtein distance <= 2
 *   5. Emoji lookup
 *
 * Usage:
 *   import { searchProduct } from './product-search.js';
 *   const results = await searchProduct('ricee');
 *   // [{ product: 'Rice 10kg', match_type: 'fuzzy', confidence: 0.8, ... }]
 */

import { runQuery } from './neo4j-client.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const EMOJI_MAP = {
  '\u{1F35A}': 'rice',       // 🍚
  '\u{1F357}': 'chicken',    // 🍗
  '\u{1FAD2}': 'palm oil',   // 🫒
  '\u{1F9C5}': 'onion',      // 🧅
  '\u{1F95A}': 'egg',        // 🥚
  '\u{1F34C}': 'plantain',   // 🍌
  '\u{1F41F}': 'fish',       // 🐟
  '\u{1F336}\uFE0F': 'pepper', // 🌶️ (with variation selector)
  '\u{1F336}': 'pepper',     // 🌶 (without variation selector)
  '\u{1F345}': 'tomato',     // 🍅
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalise a search query: lowercase, trim, collapse whitespace
 */
function normalise(input) {
  if (!input || typeof input !== 'string') return '';
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Compute Levenshtein distance between two strings.
 * Uses the Wagner-Fischer algorithm with a single-row optimisation.
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for the single-row optimisation
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const aLen = a.length;
  const bLen = b.length;

  // Previous row of distances
  const row = new Array(aLen + 1);
  for (let i = 0; i <= aLen; i++) {
    row[i] = i;
  }

  for (let j = 1; j <= bLen; j++) {
    let prev = row[0];
    row[0] = j;

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = row[i];
      row[i] = Math.min(
        row[i] + 1,      // deletion
        row[i - 1] + 1,  // insertion
        prev + cost       // substitution
      );
      prev = temp;
    }
  }

  return row[aLen];
}

// ============================================================================
// SEARCH STRATEGIES
// ============================================================================

/**
 * Step 1: Exact match on Product.name (case-insensitive)
 */
async function exactNameMatch(term) {
  const records = await runQuery(`
    MATCH (p:Product)
    WHERE toLower(p.name) = $term
    RETURN p.name AS name,
           p.price AS price,
           p.category AS category,
           p.stock_quantity AS stock
  `, { term });

  return records.map(r => ({
    product: r.get('name'),
    price: r.get('price'),
    category: r.get('category'),
    stock: r.get('stock'),
    match_type: 'exact',
    matched_on: r.get('name'),
    confidence: 1.0,
  }));
}

/**
 * Check if two multi-word strings contain the same words (order-independent)
 */
function sameWords(a, b) {
  const wordsA = a.split(' ').sort();
  const wordsB = b.split(' ').sort();
  if (wordsA.length !== wordsB.length) return false;
  return wordsA.every((w, i) => w === wordsB[i]);
}

/**
 * Step 2: Match on aliases array elements (exact or word-reordered)
 */
async function aliasMatch(term) {
  // Exact match first
  const records = await runQuery(`
    MATCH (p:Product)
    WHERE ANY(a IN p.aliases WHERE toLower(a) = $term)
    RETURN p.name AS name,
           p.price AS price,
           p.category AS category,
           p.stock_quantity AS stock,
           [a IN p.aliases WHERE toLower(a) = $term][0] AS matched
  `, { term });

  if (records.length > 0) {
    return records.map(r => ({
      product: r.get('name'),
      price: r.get('price'),
      category: r.get('category'),
      stock: r.get('stock'),
      match_type: 'alias',
      matched_on: r.get('matched'),
      confidence: 0.95,
    }));
  }

  // Word-reorder match (e.g. "tin tomato" matches "tomato tin")
  if (term.includes(' ')) {
    const allProducts = await runQuery(`
      MATCH (p:Product)
      WHERE size(p.aliases) > 0
      RETURN p.name AS name,
             p.price AS price,
             p.category AS category,
             p.stock_quantity AS stock,
             p.aliases AS aliases
    `);

    const results = [];
    for (const r of allProducts) {
      const aliases = r.get('aliases') || [];
      for (const alias of aliases) {
        if (sameWords(term, normalise(alias))) {
          results.push({
            product: r.get('name'),
            price: r.get('price'),
            category: r.get('category'),
            stock: r.get('stock'),
            match_type: 'alias',
            matched_on: alias,
            confidence: 0.93,
          });
          break;
        }
      }
    }
    if (results.length > 0) return results;
  }

  return [];
}

/**
 * Step 3: Match on cultural_names array elements
 */
async function culturalMatch(term) {
  const records = await runQuery(`
    MATCH (p:Product)
    WHERE ANY(c IN p.cultural_names WHERE toLower(c) = $term)
    RETURN p.name AS name,
           p.price AS price,
           p.category AS category,
           p.stock_quantity AS stock,
           [c IN p.cultural_names WHERE toLower(c) = $term][0] AS matched
  `, { term });

  return records.map(r => ({
    product: r.get('name'),
    price: r.get('price'),
    category: r.get('category'),
    stock: r.get('stock'),
    match_type: 'cultural',
    matched_on: r.get('matched'),
    confidence: 0.9,
  }));
}

/**
 * Step 4: Fuzzy match — fetch all products and compare with Levenshtein
 */
async function fuzzyMatch(term) {
  const records = await runQuery(`
    MATCH (p:Product)
    RETURN p.name AS name,
           p.price AS price,
           p.category AS category,
           p.stock_quantity AS stock,
           p.aliases AS aliases,
           p.cultural_names AS cultural_names
  `);

  const results = [];
  const MAX_DISTANCE = 2;

  for (const r of records) {
    const name = r.get('name');
    const price = r.get('price');
    const category = r.get('category');
    const stock = r.get('stock');
    const aliases = r.get('aliases') || [];
    const culturalNames = r.get('cultural_names') || [];

    // Check product name
    const nameDist = levenshtein(term, normalise(name));
    if (nameDist > 0 && nameDist <= MAX_DISTANCE) {
      results.push({
        product: name,
        price,
        category,
        stock,
        match_type: 'fuzzy',
        matched_on: name,
        confidence: Math.round((1 - nameDist / Math.max(term.length, name.length)) * 100) / 100,
        distance: nameDist,
      });
      continue; // best match for this product found
    }

    // Check aliases
    let bestAlias = null;
    let bestAliasDist = MAX_DISTANCE + 1;
    for (const alias of aliases) {
      const d = levenshtein(term, normalise(alias));
      if (d > 0 && d <= MAX_DISTANCE && d < bestAliasDist) {
        bestAlias = alias;
        bestAliasDist = d;
      }
    }

    if (bestAlias) {
      results.push({
        product: name,
        price,
        category,
        stock,
        match_type: 'fuzzy',
        matched_on: bestAlias,
        confidence: Math.round((1 - bestAliasDist / Math.max(term.length, bestAlias.length)) * 100) / 100,
        distance: bestAliasDist,
      });
      continue;
    }

    // Check cultural names
    let bestCultural = null;
    let bestCulturalDist = MAX_DISTANCE + 1;
    for (const cn of culturalNames) {
      const d = levenshtein(term, normalise(cn));
      if (d > 0 && d <= MAX_DISTANCE && d < bestCulturalDist) {
        bestCultural = cn;
        bestCulturalDist = d;
      }
    }

    if (bestCultural) {
      results.push({
        product: name,
        price,
        category,
        stock,
        match_type: 'fuzzy',
        matched_on: bestCultural,
        confidence: Math.round((1 - bestCulturalDist / Math.max(term.length, bestCultural.length)) * 100) / 100,
        distance: bestCulturalDist,
      });
    }
  }

  // Sort by distance ascending (closest match first)
  results.sort((a, b) => a.distance - b.distance);
  return results;
}

/**
 * Step 5: Emoji lookup — resolve emoji to text, then search
 */
function resolveEmoji(query) {
  const trimmed = query.trim();
  return EMOJI_MAP[trimmed] || null;
}

// Also try Alias nodes (from the original schema with REFERS_TO relationships)
async function aliasNodeMatch(term) {
  const records = await runQuery(`
    MATCH (a:Alias)-[:REFERS_TO]->(p:Product)
    WHERE a.name = $term
    RETURN p.name AS name,
           p.price AS price,
           p.category AS category,
           p.stock_quantity AS stock,
           a.name AS matched,
           a.language AS language
  `, { term });

  return records.map(r => ({
    product: r.get('name'),
    price: r.get('price'),
    category: r.get('category'),
    stock: r.get('stock'),
    match_type: 'alias',
    matched_on: r.get('matched'),
    language: r.get('language'),
    confidence: 0.95,
  }));
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Search for a product using multiple strategies in priority order.
 *
 * @param {string} query - The search term (product name, alias, cultural name, typo, or emoji)
 * @returns {Promise<Object[]>} - Ranked results with match_type field
 */
export async function searchProduct(query) {
  if (!query || typeof query !== 'string') return [];

  const term = normalise(query);
  if (!term) return [];

  // Step 5 (check first): Emoji lookup — resolve to text then search
  const emojiText = resolveEmoji(query);
  if (emojiText) {
    const emojiResults = await searchProduct(emojiText);
    // Tag these as emoji matches
    return emojiResults.map(r => ({
      ...r,
      match_type: 'emoji',
      matched_on: `${query} -> ${emojiText}`,
      confidence: Math.min(r.confidence, 0.85),
    }));
  }

  // Step 1: Exact name match
  const exact = await exactNameMatch(term);
  if (exact.length > 0) return exact;

  // Step 2: Alias array match + Alias node match
  const aliases = await aliasMatch(term);
  const aliasNodes = await aliasNodeMatch(term);
  const allAliases = [...aliases, ...aliasNodes];
  // Deduplicate by product name
  const seen = new Set();
  const uniqueAliases = allAliases.filter(r => {
    if (seen.has(r.product)) return false;
    seen.add(r.product);
    return true;
  });
  if (uniqueAliases.length > 0) return uniqueAliases;

  // Step 3: Cultural name match
  const cultural = await culturalMatch(term);
  if (cultural.length > 0) return cultural;

  // Step 4: Fuzzy match
  const fuzzy = await fuzzyMatch(term);
  if (fuzzy.length > 0) return fuzzy;

  // No match
  return [];
}

export { normalise, levenshtein, EMOJI_MAP };
