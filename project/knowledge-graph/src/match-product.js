/**
 * Àpínlẹ̀rọ Knowledge Graph - Intelligent Product Matching
 *
 * This is the CORE INNOVATION: Using Neo4j to match ethnic food terminology
 * to products. Supports Yoruba and English aliases.
 *
 * Usage:
 *   import { matchProduct, matchProducts } from './match-product.js';
 *   const result = await matchProduct('epo pupa');
 *   // Returns: { product: 'Palm Oil 5L', confidence: 1.0, language: 'yoruba', alias: 'epo pupa' }
 */

import { runQuery, verifyConnection, closeDriver } from './neo4j-client.js';

/**
 * Match a single term to a product using Neo4j aliases
 * @param {string} searchTerm - The term to match (e.g., 'red oil', 'epo pupa')
 * @returns {Promise<Object|null>} - Matched product with confidence score
 */
export async function matchProduct(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  const normalizedTerm = searchTerm.toLowerCase().trim();

  try {
    // First try exact alias match
    const exactMatch = await runQuery(`
      MATCH (a:Alias)-[:REFERS_TO]->(p:Product)
      WHERE a.name = $term
      RETURN p.name as productName,
             p.price as price,
             p.category as category,
             p.stock_quantity as stock,
             a.name as matchedAlias,
             a.language as language,
             1.0 as confidence
      LIMIT 1
    `, { term: normalizedTerm });

    if (exactMatch.length > 0) {
      const record = exactMatch[0];
      return {
        product: record.get('productName'),
        price: record.get('price'),
        category: record.get('category'),
        stock: record.get('stock'),
        alias: record.get('matchedAlias'),
        language: record.get('language'),
        confidence: 1.0,
        matchType: 'exact'
      };
    }

    // Try partial match (contains)
    const partialMatch = await runQuery(`
      MATCH (a:Alias)-[:REFERS_TO]->(p:Product)
      WHERE a.name CONTAINS $term OR $term CONTAINS a.name
      RETURN p.name as productName,
             p.price as price,
             p.category as category,
             p.stock_quantity as stock,
             a.name as matchedAlias,
             a.language as language,
             0.8 as confidence
      LIMIT 1
    `, { term: normalizedTerm });

    if (partialMatch.length > 0) {
      const record = partialMatch[0];
      return {
        product: record.get('productName'),
        price: record.get('price'),
        category: record.get('category'),
        stock: record.get('stock'),
        alias: record.get('matchedAlias'),
        language: record.get('language'),
        confidence: 0.8,
        matchType: 'partial'
      };
    }

    // Try fuzzy match using fulltext index
    const fuzzyMatch = await runQuery(`
      CALL db.index.fulltext.queryNodes('alias_search', $term + '~')
      YIELD node, score
      WHERE score > 0.5
      MATCH (node)-[:REFERS_TO]->(p:Product)
      RETURN p.name as productName,
             p.price as price,
             p.category as category,
             p.stock_quantity as stock,
             node.name as matchedAlias,
             node.language as language,
             score * 0.7 as confidence
      ORDER BY score DESC
      LIMIT 1
    `, { term: normalizedTerm });

    if (fuzzyMatch.length > 0) {
      const record = fuzzyMatch[0];
      return {
        product: record.get('productName'),
        price: record.get('price'),
        category: record.get('category'),
        stock: record.get('stock'),
        alias: record.get('matchedAlias'),
        language: record.get('language'),
        confidence: record.get('confidence'),
        matchType: 'fuzzy'
      };
    }

    // Try direct product name match
    const productMatch = await runQuery(`
      MATCH (p:Product)
      WHERE toLower(p.name) CONTAINS $term OR $term CONTAINS toLower(p.name)
      RETURN p.name as productName,
             p.price as price,
             p.category as category,
             p.stock_quantity as stock,
             0.9 as confidence
      LIMIT 1
    `, { term: normalizedTerm });

    if (productMatch.length > 0) {
      const record = productMatch[0];
      return {
        product: record.get('productName'),
        price: record.get('price'),
        category: record.get('category'),
        stock: record.get('stock'),
        alias: null,
        language: 'english',
        confidence: 0.9,
        matchType: 'product_name'
      };
    }

    return null;
  } catch (error) {
    console.error('Error matching product:', error.message);
    return null;
  }
}

/**
 * Match multiple terms to products
 * @param {string[]} searchTerms - Array of terms to match
 * @returns {Promise<Object[]>} - Array of matched products
 */
export async function matchProducts(searchTerms) {
  const results = [];

  for (const term of searchTerms) {
    const match = await matchProduct(term);
    if (match) {
      results.push({
        searchTerm: term,
        ...match
      });
    }
  }

  return results;
}

/**
 * Get all aliases for a product
 * @param {string} productName - The product name
 * @returns {Promise<Object[]>} - Array of aliases with language info
 */
export async function getProductAliases(productName) {
  try {
    const results = await runQuery(`
      MATCH (a:Alias)-[:REFERS_TO]->(p:Product {name: $productName})
      RETURN a.name as alias, a.language as language
      ORDER BY a.language, a.name
    `, { productName });

    return results.map(record => ({
      alias: record.get('alias'),
      language: record.get('language')
    }));
  } catch (error) {
    console.error('Error getting product aliases:', error.message);
    return [];
  }
}

/**
 * Search products by language-specific aliases
 * @param {string} language - 'yoruba' or 'english'
 * @returns {Promise<Object[]>} - Products with aliases in that language
 */
export async function searchByLanguage(language) {
  try {
    const results = await runQuery(`
      MATCH (a:Alias {language: $language})-[:REFERS_TO]->(p:Product)
      RETURN p.name as product,
             collect(a.name) as aliases,
             p.price as price,
             p.category as category
      ORDER BY p.name
    `, { language: language.toLowerCase() });

    return results.map(record => ({
      product: record.get('product'),
      aliases: record.get('aliases'),
      price: record.get('price'),
      category: record.get('category')
    }));
  } catch (error) {
    console.error('Error searching by language:', error.message);
    return [];
  }
}

/**
 * Get statistics about the alias graph
 * @returns {Promise<Object>} - Graph statistics
 */
export async function getAliasStats() {
  try {
    const stats = await runQuery(`
      MATCH (a:Alias)
      WITH count(a) as totalAliases
      MATCH (a:Alias {language: 'yoruba'})
      WITH totalAliases, count(a) as yorubaAliases
      MATCH (a:Alias {language: 'english'})
      WITH totalAliases, yorubaAliases, count(a) as englishAliases
      MATCH (p:Product)
      WITH totalAliases, yorubaAliases, englishAliases, count(p) as totalProducts
      MATCH (p:Product)<-[:REFERS_TO]-(:Alias)
      WITH totalAliases, yorubaAliases, englishAliases, totalProducts, count(DISTINCT p) as productsWithAliases
      RETURN totalAliases, yorubaAliases, englishAliases, totalProducts, productsWithAliases
    `);

    if (stats.length > 0) {
      const record = stats[0];
      return {
        totalAliases: record.get('totalAliases').toNumber(),
        yorubaAliases: record.get('yorubaAliases').toNumber(),
        englishAliases: record.get('englishAliases').toNumber(),
        totalProducts: record.get('totalProducts').toNumber(),
        productsWithAliases: record.get('productsWithAliases').toNumber()
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting alias stats:', error.message);
    return null;
  }
}

// CLI test mode
if (process.argv[2] === 'test') {
  (async () => {
    console.log('🧪 Testing Àpínlẹ̀rọ Product Matching\n');

    const connected = await verifyConnection();
    if (!connected) {
      console.error('Cannot connect to Neo4j');
      process.exit(1);
    }

    // Test cases - Yoruba and English
    const testTerms = [
      'epo pupa',      // Yoruba for palm oil
      'red oil',       // English for palm oil
      'egusi',         // English/Yoruba for melon seeds
      'ata rodo',      // Yoruba for scotch bonnet
      'garri',         // Pidgin for cassava flour
      'pounded yam',   // English for fufu
      'amala',         // Yoruba for yam flour
      'okporoko',      // Yoruba for stockfish
      'jollof rice',   // English
      'ogede'          // Yoruba for plantain
    ];

    console.log('Testing product matching:\n');

    for (const term of testTerms) {
      const result = await matchProduct(term);
      if (result) {
        console.log(`  "${term}" → ${result.product}`);
        console.log(`     Language: ${result.language}, Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      } else {
        console.log(`  "${term}" → No match found`);
      }
    }

    console.log('\n📊 Alias Statistics:');
    const stats = await getAliasStats();
    if (stats) {
      console.log(`  Total Aliases: ${stats.totalAliases}`);
      console.log(`  Yoruba: ${stats.yorubaAliases}`);
      console.log(`  English: ${stats.englishAliases}`);
      console.log(`  Products with Aliases: ${stats.productsWithAliases}/${stats.totalProducts}`);
    }

    await closeDriver();
  })();
}

export default { matchProduct, matchProducts, getProductAliases, searchByLanguage, getAliasStats };
