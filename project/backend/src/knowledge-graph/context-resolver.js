/**
 * Apinlero Knowledge Graph - Context Resolver
 *
 * Resolves contextual orders by querying the Knowledge Graph.
 * This is the intelligence layer that makes Apinlero different from ManyChat/Tidio.
 *
 * Each function handles one type of contextual understanding:
 *   "The usual please"              -> resolveUsualOrder
 *   "Same as last week"             -> resolveTimeBasedOrder
 *   "My mum's order"                -> resolveFamilyOrder
 *   "Same as Mrs Adebayo's usual"   -> resolveCrossCustomerOrder
 *   "My usual Saturday meal"        -> resolveDayPatternOrder
 *   "The rice was too small"        -> resolvePreferenceUpdate
 *   "Jollof rice for 20"            -> resolveMealOrder
 *   "50 worth of provisions"        -> resolveBudgetOrder
 */

import { runQuery, runWrite } from './neo4j-client.js';

// ============================================================================
// HELPERS
// ============================================================================

/** Safely convert Neo4j integers to JS numbers */
function toNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toNumber === 'function') return val.toNumber();
  return Number(val) || 0;
}

/** ISO date string for N days ago */
function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** Frequency string -> numeric rank for sorting */
const FREQ_RANK = { daily: 5, weekly: 4, biweekly: 3, fortnightly: 3, monthly: 2, occasionally: 1 };
function freqRank(freq) {
  return FREQ_RANK[(freq || '').toLowerCase()] || 0;
}

/** Normalise relationship names: "mum" -> "mother", "dad" -> "father", etc. */
const REL_ALIASES = {
  mum: 'mother', mom: 'mother', mama: 'mother', ma: 'mother',
  dad: 'father', papa: 'father', pa: 'father',
};
function normaliseRelationship(rel) {
  const lower = (rel || '').toLowerCase().trim();
  return REL_ALIASES[lower] || lower;
}

/** Parse a time reference into { start, end } ISO strings */
function parseTimeWindow(timeRef) {
  const ref = (timeRef || '').toLowerCase().trim();
  const now = new Date();

  if (ref === 'last week' || ref === 'a week ago') {
    return { start: daysAgoISO(14), end: now.toISOString() };
  }

  const weeksMatch = ref.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksMatch) {
    const n = parseInt(weeksMatch[1]);
    return { start: daysAgoISO(n * 7 + 7), end: daysAgoISO(Math.max(0, n * 7 - 7)) };
  }

  if (ref === 'last month') {
    return { start: daysAgoISO(60), end: daysAgoISO(25) };
  }

  if (ref === 'yesterday') {
    return { start: daysAgoISO(2), end: now.toISOString() };
  }

  // Month name: "december", "january", etc.
  const months = ['january','february','march','april','may','june',
                  'july','august','september','october','november','december'];
  const monthIdx = months.indexOf(ref);
  if (monthIdx >= 0) {
    const year = monthIdx > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
    const start = new Date(year, monthIdx, 1);
    const end = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Default: last 2 weeks
  return { start: daysAgoISO(14), end: now.toISOString() };
}

/** Map day name to ISO day number (1=Monday ... 7=Sunday) */
function dayNameToNumber(dayName) {
  const map = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 7,
  };
  return map[(dayName || '').toLowerCase().trim()] || 0;
}

// ============================================================================
// RESOLVERS
// ============================================================================

/**
 * resolveUsualOrder(phone)
 *
 * "The usual please" / "You know what I like"
 *
 * Strategy 1: Follow USUAL_ORDER relationship (highest confidence)
 * Strategy 2: Aggregate most frequent items from last 5 orders
 */
export async function resolveUsualOrder(phone) {
  // Strategy 1: USUAL_ORDER -> pick highest confidence pattern
  const records = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[u:USUAL_ORDER]->(o:Order)
    WITH c, o, u ORDER BY u.confidence DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    OPTIONAL MATCH (c)-[pref:PREFERS]->(p)
    RETURN p.name AS name,
           r.quantity AS quantity,
           pref.preferred_size AS unit,
           r.price AS price,
           u.confidence AS confidence,
           u.pattern_name AS pattern
  `, { phone });

  if (records.length > 0) {
    const items = records.map(r => ({
      name: r.get('name'),
      quantity: toNum(r.get('quantity')),
      unit: r.get('unit') || null,
      price: toNum(r.get('price')),
    }));

    return {
      items,
      confidence: toNum(records[0].get('confidence')),
      source: 'usual_order',
      explanation: `Based on your ${records[0].get('pattern') || 'regular'} order pattern`,
    };
  }

  // Strategy 2: Aggregate from last 5 orders
  const freqRecords = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
    WITH c, o ORDER BY o.created_at DESC LIMIT 5
    MATCH (o)-[r:CONTAINS]->(p:Product)
    OPTIONAL MATCH (c)-[pref:PREFERS]->(p)
    WITH p.name AS name, p.price AS price, pref.preferred_size AS unit,
         count(DISTINCT o) AS freq,
         collect(r.quantity) AS quantities
    RETURN name, price, unit, freq,
           reduce(s = 0.0, q IN quantities | s + toFloat(q)) / toFloat(size(quantities)) AS avgQty
    ORDER BY freq DESC
    LIMIT 10
  `, { phone });

  if (freqRecords.length > 0) {
    const items = freqRecords.map(r => ({
      name: r.get('name'),
      quantity: Math.round(toNum(r.get('avgQty'))),
      unit: r.get('unit') || null,
      price: toNum(r.get('price')),
    }));

    return {
      items,
      confidence: 0.6,
      source: 'usual_order',
      explanation: 'Based on your most frequently ordered items',
    };
  }

  return { items: [], confidence: 0, source: 'usual_order', explanation: 'No order history found' };
}

/**
 * resolveTimeBasedOrder(phone, timeRef)
 *
 * "Same as last week" / "Reorder from 2 weeks ago" / "Same event as December"
 */
export async function resolveTimeBasedOrder(phone, timeRef, productFilter = null) {
  const { start, end } = parseTimeWindow(timeRef);

  // If a product filter is provided, search for that specific product in the time window
  if (productFilter) {
    const filterTerm = productFilter.toLowerCase().trim();
    const records = await runQuery(`
      MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
      WHERE o.created_at >= $start AND o.created_at <= $end
      WITH o ORDER BY o.created_at DESC
      MATCH (o)-[r:CONTAINS]->(p:Product)
      WHERE toLower(p.name) CONTAINS toLower($filterTerm)
      RETURN o.id AS orderId, o.created_at AS orderDate,
             p.name AS name, r.quantity AS quantity, r.price AS price,
             p.stock_quantity AS stock
      LIMIT 1
    `, { phone, start, end, filterTerm });

    if (records.length === 0) {
      return { items: [], confidence: 0, source: 'date_lookup', explanation: `No "${productFilter}" found in your ${timeRef} orders` };
    }

    const item = {
      name: records[0].get('name'),
      quantity: toNum(records[0].get('quantity')),
      unit: null,
      price: toNum(records[0].get('price')),
    };
    const stock = toNum(records[0].get('stock'));
    const orderDate = new Date(records[0].get('orderDate')).toLocaleDateString('en-GB');

    return {
      items: [item],
      confidence: 0.85,
      source: 'date_lookup',
      explanation: `${item.name} from your order on ${orderDate}${stock > 0 ? ' (in stock)' : stock === 0 ? ' (currently out of stock)' : ''}`,
      stock,
    };
  }

  const records = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
    WHERE o.created_at >= $start AND o.created_at <= $end
    WITH o ORDER BY o.created_at DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    RETURN o.id AS orderId, o.created_at AS orderDate,
           p.name AS name, r.quantity AS quantity, r.price AS price
  `, { phone, start, end });

  if (records.length === 0) {
    return { items: [], confidence: 0, source: 'date_lookup', explanation: `No orders found for "${timeRef}"` };
  }

  const items = records.map(r => ({
    name: r.get('name'),
    quantity: toNum(r.get('quantity')),
    unit: null,
    price: toNum(r.get('price')),
  }));

  const orderDate = new Date(records[0].get('orderDate')).toLocaleDateString('en-GB');

  return {
    items,
    confidence: 0.8,
    source: 'date_lookup',
    explanation: `Order from ${orderDate}`,
  };
}

/**
 * resolveFamilyOrder(phone, relationship)
 *
 * "My mum's order" / "Same as my wife's last order"
 *
 * Traverses RELATED_TO to find the referenced person, returns their most recent order.
 */
export async function resolveFamilyOrder(phone, relationship) {
  const normRel = normaliseRelationship(relationship);

  const records = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[rel:RELATED_TO]->(family:Customer)
    WHERE toLower(rel.relationship) = $relationship
    WITH family
    MATCH (family)-[:PLACED]->(o:Order)
    WITH family, o ORDER BY o.created_at DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    RETURN family.name AS familyName,
           p.name AS name, r.quantity AS quantity, r.price AS price
  `, { phone, relationship: normRel });

  if (records.length === 0) {
    return { items: [], confidence: 0, source: 'family_ref', explanation: `No ${relationship}'s orders found` };
  }

  const familyName = records[0].get('familyName');
  const items = records.map(r => ({
    name: r.get('name'),
    quantity: toNum(r.get('quantity')),
    unit: null,
    price: toNum(r.get('price')),
  }));

  return {
    items,
    confidence: 0.75,
    source: 'family_ref',
    explanation: `${familyName}'s most recent order`,
  };
}

/**
 * resolveCrossCustomerOrder(referencedName)
 *
 * "Same as Mrs Adebayo's usual"
 *
 * Looks up customer by name, returns their usual order (or most recent).
 */
export async function resolveCrossCustomerOrder(referencedName) {
  // Strategy 1: USUAL_ORDER for the named customer (highest confidence)
  const usualRecords = await runQuery(`
    MATCH (c:Customer)-[u:USUAL_ORDER]->(o:Order)
    WHERE toLower(c.name) CONTAINS toLower($name)
    WITH c, o, u ORDER BY u.confidence DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    RETURN c.name AS customerName,
           p.name AS name, r.quantity AS quantity, r.price AS price,
           u.confidence AS confidence
  `, { name: referencedName });

  if (usualRecords.length > 0) {
    const items = usualRecords.map(r => ({
      name: r.get('name'),
      quantity: toNum(r.get('quantity')),
      unit: null,
      price: toNum(r.get('price')),
    }));

    return {
      items,
      confidence: toNum(usualRecords[0].get('confidence')),
      source: 'cross_customer',
      explanation: `${usualRecords[0].get('customerName')}'s usual order`,
    };
  }

  // Strategy 2: Most recent order
  const recentRecords = await runQuery(`
    MATCH (c:Customer)-[:PLACED]->(o:Order)
    WHERE toLower(c.name) CONTAINS toLower($name)
    WITH c, o ORDER BY o.created_at DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    RETURN c.name AS customerName,
           p.name AS name, r.quantity AS quantity, r.price AS price
  `, { name: referencedName });

  if (recentRecords.length === 0) {
    return { items: [], confidence: 0, source: 'cross_customer', explanation: `Customer "${referencedName}" not found` };
  }

  const items = recentRecords.map(r => ({
    name: r.get('name'),
    quantity: toNum(r.get('quantity')),
    unit: null,
    price: toNum(r.get('price')),
  }));

  return {
    items,
    confidence: 0.5,
    source: 'cross_customer',
    explanation: `${recentRecords[0].get('customerName')}'s most recent order`,
  };
}

/**
 * resolveDayPatternOrder(phone, dayOfWeek)
 *
 * "My usual Saturday meal"
 *
 * Finds orders placed on a specific day of week.
 */
export async function resolveDayPatternOrder(phone, dayOfWeek) {
  const dayNum = dayNameToNumber(dayOfWeek);
  if (!dayNum) {
    return { items: [], confidence: 0, source: 'day_pattern', explanation: `Unknown day: ${dayOfWeek}` };
  }

  const records = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
    WHERE datetime(o.created_at).dayOfWeek = $dayNum
    WITH o ORDER BY o.created_at DESC LIMIT 1
    MATCH (o)-[r:CONTAINS]->(p:Product)
    RETURN p.name AS name, r.quantity AS quantity, r.price AS price,
           o.created_at AS orderDate, o.meal_prep AS mealPrep
  `, { phone, dayNum });

  if (records.length === 0) {
    return { items: [], confidence: 0, source: 'day_pattern', explanation: `No ${dayOfWeek} orders found` };
  }

  const items = records.map(r => ({
    name: r.get('name'),
    quantity: toNum(r.get('quantity')),
    unit: null,
    price: toNum(r.get('price')),
  }));

  const mealPrep = records[0].get('mealPrep');

  return {
    items,
    confidence: 0.7,
    source: 'day_pattern',
    explanation: `Your ${dayOfWeek} order${mealPrep ? ` (${mealPrep})` : ''}`,
  };
}

/**
 * resolvePreferenceUpdate(phone, productName, feedback)
 *
 * "The rice last time was too small, get the bigger one"
 *
 * Reads current PREFERS, finds next size up/down, updates the relationship.
 */
export async function resolvePreferenceUpdate(phone, productName, feedback) {
  const term = productName.toLowerCase();
  const feedbackLower = feedback.toLowerCase();

  // Find current preference for this product
  const prefRecords = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[pref:PREFERS]->(p:Product)
    WHERE toLower(p.name) CONTAINS $term
    RETURN p.id AS id, p.name AS name, p.price AS price,
           p.category AS category, pref.preferred_size AS size,
           pref.frequency AS frequency, pref.typical_quantity AS quantity
  `, { phone, term });

  if (prefRecords.length === 0) {
    return { updated: false, explanation: `No preference found for "${productName}"` };
  }

  const current = {
    id: prefRecords[0].get('id'),
    name: prefRecords[0].get('name'),
    price: toNum(prefRecords[0].get('price')),
    category: prefRecords[0].get('category'),
    size: prefRecords[0].get('size'),
    frequency: prefRecords[0].get('frequency'),
    quantity: toNum(prefRecords[0].get('quantity')),
  };

  // Determine direction from feedback
  const upgrading = /too small|too little|not enough|bigger|larger|more/.test(feedbackLower);
  const downgrading = /too big|too much|too large|smaller|less/.test(feedbackLower);

  if (!upgrading && !downgrading) {
    return { updated: false, explanation: `Couldn't interpret feedback: "${feedback}"` };
  }

  // Find all similar products in same category, sorted by price (size proxy)
  const alternates = await runQuery(`
    MATCH (p:Product)
    WHERE p.category = $category AND toLower(p.name) CONTAINS $term
    RETURN p.id AS id, p.name AS name, p.price AS price
    ORDER BY p.price ASC
  `, { category: current.category, term });

  const sorted = alternates.map(r => ({
    id: r.get('id'),
    name: r.get('name'),
    price: toNum(r.get('price')),
  }));

  const currentIdx = sorted.findIndex(p => p.id === current.id);
  if (currentIdx < 0) {
    return { updated: false, explanation: 'Could not find current product in alternates' };
  }

  const targetIdx = upgrading ? currentIdx + 1 : currentIdx - 1;
  if (targetIdx < 0 || targetIdx >= sorted.length) {
    const dir = upgrading ? 'larger' : 'smaller';
    return { updated: false, explanation: `No ${dir} size available for ${current.name}` };
  }

  const target = sorted[targetIdx];

  // Extract size from product name (e.g., "Nigerian Rice 10kg" -> "10kg")
  const sizeMatch = target.name.match(/(\d+(?:\.\d+)?(?:kg|g|L|l|ml))/i);
  const newSize = sizeMatch ? sizeMatch[1] : null;

  // Update PREFERS: delete old -> create new
  await runWrite(`
    MATCH (c:Customer {phone: $phone})-[old:PREFERS]->(oldP:Product {id: $oldId})
    DELETE old
    WITH c
    MATCH (newP:Product {id: $newId})
    MERGE (c)-[pref:PREFERS]->(newP)
    SET pref.frequency = $frequency,
        pref.typical_quantity = $quantity,
        pref.preferred_size = $newSize,
        pref.last_ordered = $now
  `, {
    phone,
    oldId: current.id,
    newId: target.id,
    frequency: current.frequency || 'monthly',
    quantity: current.quantity || 1,
    newSize: newSize || current.size,
    now: new Date().toISOString(),
  });

  return {
    updated: true,
    previous: { name: current.name, size: current.size, price: current.price },
    current: { name: target.name, size: newSize, price: target.price },
    source: 'preference_update',
    explanation: `Upgraded from ${current.name} to ${target.name}`,
  };
}

/**
 * resolveMealOrder(mealName, servings)
 *
 * "Jollof rice ingredients for 20" / "Egusi soup ingredients"
 *
 * Finds Meal node, follows REQUIRES -> Product, scales quantities.
 */
export async function resolveMealOrder(mealName, servings, phone = null) {
  const records = await runQuery(`
    MATCH (m:Meal)-[r:REQUIRES]->(p:Product)
    WHERE toLower(m.name) = toLower($mealName)
    RETURN m.name AS meal, m.serves AS baseServings, m.emoji AS emoji,
           p.name AS name, p.price AS price, p.category AS category,
           r.quantity_per_serving AS qtyPerServing, r.unit AS unit, r.notes AS notes
  `, { mealName });

  if (records.length === 0) {
    return { items: [], confidence: 0, source: 'meal_recipe', explanation: `Meal "${mealName}" not found` };
  }

  const baseServings = toNum(records[0].get('baseServings'));
  const scale = servings / baseServings;
  const emoji = records[0].get('emoji');
  const meal = records[0].get('meal');

  const items = records.map(r => ({
    name: r.get('name'),
    quantity: Math.round(toNum(r.get('qtyPerServing')) * scale * 100) / 100,
    unit: r.get('unit'),
    price: toNum(r.get('price')),
    category: r.get('category'),
    notes: r.get('notes') || null,
  }));

  // If phone provided, check for preference-based substitutions
  let substitutions = [];
  if (phone) {
    const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
    if (categories.length > 0) {
      const prefRecords = await runQuery(`
        MATCH (c:Customer {phone: $phone})-[pref:PREFERS]->(p:Product)
        WHERE p.category IN $categories
        RETURN p.name AS name, p.price AS price, p.category AS category,
               pref.preferred_size AS unit
      `, { phone, categories });

      // Substitute recipe ingredients with preferred products in same category
      for (const pref of prefRecords) {
        const prefCategory = pref.get('category');
        const idx = items.findIndex(i => i.category === prefCategory);
        if (idx >= 0) {
          const original = items[idx].name;
          items[idx] = {
            ...items[idx],
            name: pref.get('name'),
            price: toNum(pref.get('price')),
            unit: pref.get('unit') || items[idx].unit,
          };
          substitutions.push(`${original} -> ${pref.get('name')} (your preference)`);
        }
      }
    }
  }

  // Remove category from final items (internal field)
  const finalItems = items.map(({ category, ...rest }) => rest);

  let explanation = `${emoji} ${meal} for ${servings} (scaled ${scale}x from ${baseServings} servings)`;
  if (substitutions.length > 0) {
    explanation += `\nSubstituted: ${substitutions.join(', ')}`;
  }

  return {
    items: finalItems,
    confidence: 0.9,
    source: 'meal_recipe',
    explanation,
  };
}

/**
 * resolveBudgetOrder(phone, budgetGBP)
 *
 * "50 worth of provisions"
 *
 * Gets PREFERS + frequent order items, fills cart within budget.
 */
export async function resolveBudgetOrder(phone, budgetGBP) {
  // Get explicit preferences
  const prefRecords = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[pref:PREFERS]->(p:Product)
    RETURN p.name AS name, p.price AS price,
           pref.frequency AS frequency, pref.typical_quantity AS quantity,
           pref.preferred_size AS unit
  `, { phone });

  // Get frequently ordered items from last 5 orders (excluding PREFERS items)
  const freqRecords = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
    WITH c, o ORDER BY o.created_at DESC LIMIT 5
    MATCH (o)-[r:CONTAINS]->(p:Product)
    WHERE NOT (c)-[:PREFERS]->(p)
    WITH p.name AS name, p.price AS price, count(DISTINCT o) AS freq,
         collect(r.quantity) AS quantities
    RETURN name, price, freq,
           reduce(s = 0.0, q IN quantities | s + toFloat(q)) / toFloat(size(quantities)) AS avgQty
    ORDER BY freq DESC
  `, { phone });

  // Build sorted candidate list: preferences first, then frequent items
  const candidates = [];

  for (const r of prefRecords) {
    candidates.push({
      name: r.get('name'),
      price: toNum(r.get('price')),
      quantity: toNum(r.get('quantity')) || 1,
      unit: r.get('unit') || null,
      source: 'preference',
      rank: freqRank(r.get('frequency')),
    });
  }

  for (const r of freqRecords) {
    candidates.push({
      name: r.get('name'),
      price: toNum(r.get('price')),
      quantity: Math.round(toNum(r.get('avgQty'))) || 1,
      unit: null,
      source: 'history',
      rank: toNum(r.get('freq')),
    });
  }

  // Sort: preferences first (by freq rank desc), then history items (by freq desc)
  candidates.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'preference' ? -1 : 1;
    return b.rank - a.rank;
  });

  // Fill cart within budget
  const cart = [];
  let remaining = budgetGBP;

  for (const item of candidates) {
    const cost = item.price * item.quantity;

    if (cost <= remaining) {
      // Full quantity fits
      cart.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        subtotal: Math.round(cost * 100) / 100,
      });
      remaining -= cost;
    } else if (item.price <= remaining) {
      // Partial quantity fits
      const maxQty = Math.floor(remaining / item.price);
      if (maxQty > 0) {
        cart.push({
          name: item.name,
          quantity: maxQty,
          unit: item.unit,
          price: item.price,
          subtotal: Math.round(item.price * maxQty * 100) / 100,
        });
        remaining -= item.price * maxQty;
      }
    }
  }

  const total = Math.round((budgetGBP - remaining) * 100) / 100;

  return {
    items: cart,
    total,
    budget: budgetGBP,
    remaining: Math.round(remaining * 100) / 100,
    confidence: cart.length > 0 ? 0.7 : 0,
    source: 'budget_fill',
    explanation: cart.length > 0
      ? `\u00A3${total.toFixed(2)} of provisions based on your preferences (\u00A3${remaining.toFixed(2)} remaining)`
      : 'Could not build a cart within budget',
  };
}

/**
 * resolveProductHistory(phone, productTerm)
 *
 * "The goat meat Aunty Isha recommended last time"
 *
 * Searches the customer's past orders for a product matching the term.
 */
export async function resolveProductHistory(phone, productTerm) {
  const term = (productTerm || '').toLowerCase().trim();
  if (!term) {
    return { items: [], confidence: 0, source: 'product_history', explanation: 'No product term provided' };
  }

  const records = await runQuery(`
    MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)-[r:CONTAINS]->(p:Product)
    WHERE toLower(p.name) CONTAINS toLower($term)
    RETURN p.name AS name, p.price AS price, r.quantity AS quantity,
           o.created_at AS orderDate, p.stock_quantity AS stock
    ORDER BY o.created_at DESC LIMIT 1
  `, { phone, term });

  if (records.length === 0) {
    return { items: [], confidence: 0, source: 'product_history', explanation: `No "${productTerm}" found in your order history` };
  }

  const item = {
    name: records[0].get('name'),
    quantity: toNum(records[0].get('quantity')),
    unit: null,
    price: toNum(records[0].get('price')),
  };

  const stock = toNum(records[0].get('stock'));
  const orderDate = new Date(records[0].get('orderDate')).toLocaleDateString('en-GB');

  return {
    items: [item],
    confidence: 0.75,
    source: 'product_history',
    explanation: `${item.name} from your order on ${orderDate}`,
    stock,
  };
}

// ============================================================================
// MASTER ROUTER
// ============================================================================

/**
 * resolveContext(phone, clues)
 *
 * Master router. Examines the clues object and delegates to the right resolver.
 *
 * Clue keys:
 *   references_previous: true          -> resolveUsualOrder
 *   references_time: "last week"       -> resolveTimeBasedOrder
 *   references_person: "mother"        -> resolveFamilyOrder (if family term)
 *   references_person: "Mrs Adebayo"   -> resolveCrossCustomerOrder (if name)
 *   references_day: "Saturday"         -> resolveDayPatternOrder
 *   references_meal: "Jollof Rice"     -> resolveMealOrder
 *   references_budget: 50              -> resolveBudgetOrder
 *   feedback + product                 -> resolvePreferenceUpdate
 */
export async function resolveContext(phone, clues) {
  if (!clues || typeof clues !== 'object') {
    return { items: [], confidence: 0, source: 'unknown', explanation: 'No context clues provided' };
  }

  // Meal order (check first - most specific)
  // Accept both "servings" and "serving_size" for backwards compatibility
  if (clues.references_meal) {
    const servings = clues.servings || clues.serving_size || 4;
    // Pass phone for preference-aware substitutions when flagged
    const mealPhone = clues.preference_aware ? phone : null;
    return resolveMealOrder(clues.references_meal, servings, mealPhone);
  }

  // Budget order
  if (clues.references_budget) {
    return resolveBudgetOrder(phone, clues.references_budget);
  }

  // Person reference: family term or another customer's name
  if (clues.references_person) {
    const familyTerms = [
      'mother', 'mum', 'mom', 'mama', 'ma',
      'father', 'dad', 'papa', 'pa',
      'wife', 'husband', 'spouse',
      'sister', 'brother', 'sibling',
    ];
    if (familyTerms.includes(clues.references_person.toLowerCase())) {
      return resolveFamilyOrder(phone, clues.references_person);
    }
    return resolveCrossCustomerOrder(clues.references_person);
  }

  // Product history reference (e.g. "the goat meat from last time")
  if (clues.references_product && !clues.references_time) {
    return resolveProductHistory(phone, clues.references_product);
  }

  // Time reference (optionally filtered by product)
  if (clues.references_time) {
    return resolveTimeBasedOrder(phone, clues.references_time, clues.references_product || null);
  }

  // Day pattern
  if (clues.references_day) {
    return resolveDayPatternOrder(phone, clues.references_day);
  }

  // Preference feedback
  if (clues.feedback && clues.product) {
    return resolvePreferenceUpdate(phone, clues.product, clues.feedback);
  }

  // Previous order / "the usual"
  if (clues.references_previous) {
    return resolveUsualOrder(phone);
  }

  // Default fallback: try usual order
  return resolveUsualOrder(phone);
}
