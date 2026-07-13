/**
 * Àpínlẹ̀rọ Context Resolver — SQL edition
 *
 * Replaces the Neo4j-backed context-resolver (project/knowledge-graph/src/).
 * Same public API and return shapes, so kg-preprocessor.js needed only an
 * import-path change. Runs against the same Supabase Postgres the rest of
 * the bot already uses — no separate graph database to run, pay for, or
 * operate.
 *
 * Each function handles one type of contextual understanding:
 *   "The usual please"              → resolveUsualOrder
 *   "Same as last week"             → resolveTimeBasedOrder
 *   "My mum's order"                → resolveFamilyOrder
 *   "Same as Mrs Adebayo's usual"   → resolveCrossCustomerOrder
 *   "My usual Saturday meal"        → resolveDayPatternOrder
 *   "The rice was too small"        → resolvePreferenceUpdate
 *   "Jollof rice for 20"            → resolveMealOrder
 *   "£50 worth of provisions"       → resolveBudgetOrder
 *
 * resolveFamilyOrder / resolvePreferenceUpdate / resolveMealOrder depend on
 * customer_relationships / customer_preferences / meals+meal_ingredients —
 * tables that start empty (the original Neo4j versions were only ever
 * seeded with synthetic test customers, never real vendor data). They
 * return a clean "no data" result until those tables are populated; no
 * crash, no fake behaviour.
 */

import { supabase } from './supabase-client.js';

// ============================================================================
// HELPERS
// ============================================================================

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const FREQ_RANK = { daily: 5, weekly: 4, biweekly: 3, fortnightly: 3, monthly: 2, occasionally: 1 };
function freqRank(freq) {
  return FREQ_RANK[(freq || '').toLowerCase()] || 0;
}

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

/** Map day name to JS Date.getDay() number (0=Sunday … 6=Saturday) */
function dayNameToNumber(dayName) {
  const map = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return Object.prototype.hasOwnProperty.call(map, (dayName || '').toLowerCase().trim())
    ? map[(dayName || '').toLowerCase().trim()]
    : null;
}

/** orders.items is a JSON array: [{product_id, product_name, quantity, unit, price, subtotal}, ...] */
function itemsFromOrder(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function toResolverItem(raw) {
  return {
    name: raw.product_name || raw.name,
    quantity: Number(raw.quantity) || 1,
    unit: raw.unit || raw.product_unit || null,
    price: Number(raw.price) || 0,
  };
}

/** Fetch the customer's orders for a business, newest first, capped. */
async function getRecentOrders(businessId, phone, limit = 20) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, items, created_at')
    .eq('business_id', businessId)
    .eq('phone_number', phone)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[context-resolver] getRecentOrders failed:', error.message);
    return [];
  }
  return data || [];
}

// ============================================================================
// RESOLVERS
// ============================================================================

/**
 * resolveUsualOrder(businessId, phone)
 *
 * "The usual please" / "You know what I like"
 * Aggregates the most frequently ordered items from the customer's recent
 * order history (no explicit USUAL_ORDER pattern to check — see note above
 * on customer_preferences for the explicit-preference path).
 */
export async function resolveUsualOrder(businessId, phone) {
  const orders = await getRecentOrders(businessId, phone, 5);

  if (orders.length === 0) {
    return { items: [], confidence: 0, source: 'usual_order', explanation: 'No order history found' };
  }

  // Aggregate items across the last 5 orders: frequency (order count) + avg qty
  const byProduct = new Map(); // product_id -> { name, unit, price, orderCount (Set of order ids), qtySum, qtyN }
  for (const order of orders) {
    for (const raw of itemsFromOrder(order)) {
      const key = raw.product_id || raw.product_name;
      if (!key) continue;
      const entry = byProduct.get(key) || {
        name: raw.product_name, unit: raw.unit || raw.product_unit || null,
        price: Number(raw.price) || 0, orderIds: new Set(), qtySum: 0, qtyN: 0,
      };
      entry.orderIds.add(order.id);
      entry.qtySum += Number(raw.quantity) || 0;
      entry.qtyN += 1;
      byProduct.set(key, entry);
    }
  }

  const ranked = Array.from(byProduct.values())
    .map(e => ({ ...e, freq: e.orderIds.size, avgQty: e.qtyN ? e.qtySum / e.qtyN : 1 }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 10);

  if (ranked.length === 0) {
    return { items: [], confidence: 0, source: 'usual_order', explanation: 'No order history found' };
  }

  const items = ranked.map(e => ({
    name: e.name,
    quantity: Math.round(e.avgQty) || 1,
    unit: e.unit,
    price: e.price,
  }));

  return {
    items,
    confidence: 0.6,
    source: 'usual_order',
    explanation: 'Based on your most frequently ordered items',
  };
}

/**
 * resolveTimeBasedOrder(businessId, phone, timeRef)
 *
 * "Same as last week" / "Reorder from 2 weeks ago" / "Same as December"
 */
export async function resolveTimeBasedOrder(businessId, phone, timeRef) {
  const { start, end } = parseTimeWindow(timeRef);

  const { data, error } = await supabase
    .from('orders')
    .select('id, items, created_at')
    .eq('business_id', businessId)
    .eq('phone_number', phone)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { items: [], confidence: 0, source: 'date_lookup', explanation: `No orders found for "${timeRef}"` };
  }

  const order = data[0];
  const items = itemsFromOrder(order).map(toResolverItem);
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');

  return {
    items,
    confidence: 0.8,
    source: 'date_lookup',
    explanation: `Order from ${orderDate}`,
  };
}

/**
 * resolveFamilyOrder(businessId, phone, relationship)
 *
 * "My mum's order" / "Same as my wife's last order"
 * Needs a customer_relationships row linking phone → related_phone. Empty
 * table today → always returns "no data" until relationships are added.
 */
export async function resolveFamilyOrder(businessId, phone, relationship) {
  const normRel = normaliseRelationship(relationship);

  const { data: rel, error: relError } = await supabase
    .from('customer_relationships')
    .select('related_phone')
    .eq('business_id', businessId)
    .eq('customer_phone', phone)
    .eq('relationship', normRel)
    .maybeSingle();

  if (relError || !rel) {
    return { items: [], confidence: 0, source: 'family_ref', explanation: `No ${relationship}'s orders found` };
  }

  const orders = await getRecentOrders(businessId, rel.related_phone, 1);
  if (orders.length === 0) {
    return { items: [], confidence: 0, source: 'family_ref', explanation: `No ${relationship}'s orders found` };
  }

  const items = itemsFromOrder(orders[0]).map(toResolverItem);

  return {
    items,
    confidence: 0.75,
    source: 'family_ref',
    explanation: `${relationship}'s most recent order`,
  };
}

/**
 * resolveCrossCustomerOrder(businessId, referencedName)
 *
 * "Same as Mrs Adebayo's usual" — looks up a customer by name (within the
 * SAME business), returns their most recent order.
 */
export async function resolveCrossCustomerOrder(businessId, referencedName) {
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('phone, name')
    .eq('business_id', businessId)
    .ilike('name', `%${referencedName}%`)
    .limit(1)
    .maybeSingle();

  if (custError || !customer) {
    return { items: [], confidence: 0, source: 'cross_customer', explanation: `Customer "${referencedName}" not found` };
  }

  const orders = await getRecentOrders(businessId, customer.phone, 1);
  if (orders.length === 0) {
    return { items: [], confidence: 0, source: 'cross_customer', explanation: `Customer "${referencedName}" not found` };
  }

  const items = itemsFromOrder(orders[0]).map(toResolverItem);

  return {
    items,
    confidence: 0.5,
    source: 'cross_customer',
    explanation: `${customer.name}'s most recent order`,
  };
}

/**
 * resolveDayPatternOrder(businessId, phone, dayOfWeek)
 *
 * "My usual Saturday meal" — finds the most recent order placed on that
 * day of the week.
 */
export async function resolveDayPatternOrder(businessId, phone, dayOfWeek) {
  const dayNum = dayNameToNumber(dayOfWeek);
  if (dayNum === null) {
    return { items: [], confidence: 0, source: 'day_pattern', explanation: `Unknown day: ${dayOfWeek}` };
  }

  // Filter in JS — order volume per customer is small, and Postgres
  // EXTRACT(DOW) would need a raw filter the JS client can't express directly.
  const orders = await getRecentOrders(businessId, phone, 50);
  const match = orders.find(o => new Date(o.created_at).getDay() === dayNum);

  if (!match) {
    return { items: [], confidence: 0, source: 'day_pattern', explanation: `No ${dayOfWeek} orders found` };
  }

  const items = itemsFromOrder(match).map(toResolverItem);

  return {
    items,
    confidence: 0.7,
    source: 'day_pattern',
    explanation: `Your ${dayOfWeek} order`,
  };
}

/**
 * resolvePreferenceUpdate(businessId, phone, productName, feedback)
 *
 * "The rice last time was too small, get the bigger one"
 * Needs a customer_preferences row for this product. Empty table today →
 * always returns { updated: false } until preferences are recorded.
 */
export async function resolvePreferenceUpdate(businessId, phone, productName, feedback) {
  const term = productName.toLowerCase();
  const feedbackLower = feedback.toLowerCase();

  const { data: current, error: prefError } = await supabase
    .from('customer_preferences')
    .select('id, product_id, preferred_size, frequency, typical_quantity, products(name, price, category)')
    .eq('business_id', businessId)
    .eq('customer_phone', phone)
    .ilike('products.name', `%${term}%`)
    .maybeSingle();

  if (prefError || !current || !current.products) {
    return { updated: false, explanation: `No preference found for "${productName}"` };
  }

  const upgrading = /too small|too little|not enough|bigger|larger|more/.test(feedbackLower);
  const downgrading = /too big|too much|too large|smaller|less/.test(feedbackLower);

  if (!upgrading && !downgrading) {
    return { updated: false, explanation: `Couldn't interpret feedback: "${feedback}"` };
  }

  const { data: alternates, error: altError } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('business_id', businessId)
    .eq('category', current.products.category)
    .ilike('name', `%${term}%`)
    .order('price', { ascending: true });

  if (altError || !alternates) {
    return { updated: false, explanation: 'Could not find current product in alternates' };
  }

  const currentIdx = alternates.findIndex(p => p.id === current.product_id);
  if (currentIdx < 0) {
    return { updated: false, explanation: 'Could not find current product in alternates' };
  }

  const targetIdx = upgrading ? currentIdx + 1 : currentIdx - 1;
  if (targetIdx < 0 || targetIdx >= alternates.length) {
    const dir = upgrading ? 'larger' : 'smaller';
    return { updated: false, explanation: `No ${dir} size available for ${current.products.name}` };
  }

  const target = alternates[targetIdx];
  const sizeMatch = target.name.match(/(\d+(?:\.\d+)?(?:kg|g|L|l|ml))/i);
  const newSize = sizeMatch ? sizeMatch[1] : null;

  const { error: updateError } = await supabase
    .from('customer_preferences')
    .update({
      product_id: target.id,
      preferred_size: newSize || current.preferred_size,
      last_ordered: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (updateError) {
    return { updated: false, explanation: 'Failed to save preference update' };
  }

  return {
    updated: true,
    previous: { name: current.products.name, size: current.preferred_size, price: current.products.price },
    current: { name: target.name, size: newSize, price: target.price },
    source: 'preference_update',
    explanation: `Upgraded from ${current.products.name} to ${target.name}`,
  };
}

/**
 * resolveMealOrder(businessId, mealName, servings)
 *
 * "Jollof rice ingredients for 20" — looks up a meals + meal_ingredients
 * recipe, scales quantities. Empty tables today → "meal not found" until
 * recipes are seeded.
 */
export async function resolveMealOrder(businessId, mealName, servings) {
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('id, name, serves, emoji')
    .eq('business_id', businessId)
    .ilike('name', mealName)
    .maybeSingle();

  if (mealError || !meal) {
    return { items: [], confidence: 0, source: 'meal_recipe', explanation: `Meal "${mealName}" not found` };
  }

  const { data: ingredients, error: ingError } = await supabase
    .from('meal_ingredients')
    .select('quantity_per_serving, unit, notes, products(name, price)')
    .eq('meal_id', meal.id);

  if (ingError || !ingredients || ingredients.length === 0) {
    return { items: [], confidence: 0, source: 'meal_recipe', explanation: `Meal "${mealName}" not found` };
  }

  const scale = servings / (meal.serves || 4);
  const items = ingredients.map(ing => ({
    name: ing.products?.name,
    quantity: Math.round(Number(ing.quantity_per_serving) * scale * 100) / 100,
    unit: ing.unit,
    price: Number(ing.products?.price) || 0,
    notes: ing.notes || null,
  }));

  return {
    items,
    confidence: 0.9,
    source: 'meal_recipe',
    explanation: `${meal.emoji || ''} ${meal.name} for ${servings} (scaled ${scale}x from ${meal.serves} servings)`.trim(),
  };
}

/**
 * resolveBudgetOrder(businessId, phone, budgetGBP)
 *
 * "£50 worth of provisions" — fills a cart within budget using explicit
 * preferences first (customer_preferences), then order-history frequency.
 */
export async function resolveBudgetOrder(businessId, phone, budgetGBP) {
  const { data: prefs } = await supabase
    .from('customer_preferences')
    .select('frequency, typical_quantity, preferred_size, products(name, price)')
    .eq('business_id', businessId)
    .eq('customer_phone', phone);

  const orders = await getRecentOrders(businessId, phone, 5);
  const preferredProductNames = new Set((prefs || []).map(p => p.products?.name).filter(Boolean));

  const byProduct = new Map();
  for (const order of orders) {
    for (const raw of itemsFromOrder(order)) {
      if (preferredProductNames.has(raw.product_name)) continue; // preferences take priority, avoid double-counting
      const key = raw.product_id || raw.product_name;
      if (!key) continue;
      const entry = byProduct.get(key) || { name: raw.product_name, price: Number(raw.price) || 0, orderIds: new Set(), qtySum: 0, qtyN: 0 };
      entry.orderIds.add(order.id);
      entry.qtySum += Number(raw.quantity) || 0;
      entry.qtyN += 1;
      byProduct.set(key, entry);
    }
  }

  const candidates = [];

  for (const p of (prefs || [])) {
    if (!p.products) continue;
    candidates.push({
      name: p.products.name,
      price: Number(p.products.price) || 0,
      quantity: Number(p.typical_quantity) || 1,
      unit: p.preferred_size || null,
      source: 'preference',
      rank: freqRank(p.frequency),
    });
  }

  for (const e of byProduct.values()) {
    candidates.push({
      name: e.name,
      price: e.price,
      quantity: Math.round(e.qtyN ? e.qtySum / e.qtyN : 1) || 1,
      unit: null,
      source: 'history',
      rank: e.orderIds.size,
    });
  }

  candidates.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'preference' ? -1 : 1;
    return b.rank - a.rank;
  });

  const cart = [];
  let remaining = budgetGBP;

  for (const item of candidates) {
    const cost = item.price * item.quantity;

    if (cost <= remaining) {
      cart.push({ name: item.name, quantity: item.quantity, unit: item.unit, price: item.price, subtotal: Math.round(cost * 100) / 100 });
      remaining -= cost;
    } else if (item.price > 0 && item.price <= remaining) {
      const maxQty = Math.floor(remaining / item.price);
      if (maxQty > 0) {
        cart.push({ name: item.name, quantity: maxQty, unit: item.unit, price: item.price, subtotal: Math.round(item.price * maxQty * 100) / 100 });
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
      ? `£${total.toFixed(2)} of provisions based on your preferences (£${remaining.toFixed(2)} remaining)`
      : 'Could not build a cart within budget',
  };
}

// ============================================================================
// MASTER ROUTER
// ============================================================================

/**
 * resolveContext(businessId, phone, clues)
 *
 * Master router. Examines the clues object and delegates to the right
 * resolver — same routing rules as the Neo4j version.
 */
export async function resolveContext(businessId, phone, clues) {
  if (!clues || typeof clues !== 'object') {
    return { items: [], confidence: 0, source: 'unknown', explanation: 'No context clues provided' };
  }

  if (clues.references_meal) {
    return resolveMealOrder(businessId, clues.references_meal, clues.servings || 4);
  }

  if (clues.references_budget) {
    return resolveBudgetOrder(businessId, phone, clues.references_budget);
  }

  if (clues.references_person) {
    const familyTerms = [
      'mother', 'mum', 'mom', 'mama', 'ma',
      'father', 'dad', 'papa', 'pa',
      'wife', 'husband', 'spouse',
      'sister', 'brother', 'sibling',
    ];
    if (familyTerms.includes(clues.references_person.toLowerCase())) {
      return resolveFamilyOrder(businessId, phone, clues.references_person);
    }
    return resolveCrossCustomerOrder(businessId, clues.references_person);
  }

  if (clues.references_time) {
    return resolveTimeBasedOrder(businessId, phone, clues.references_time);
  }

  if (clues.references_day) {
    return resolveDayPatternOrder(businessId, phone, clues.references_day);
  }

  if (clues.feedback && clues.product) {
    return resolvePreferenceUpdate(businessId, phone, clues.product, clues.feedback);
  }

  if (clues.references_previous) {
    return resolveUsualOrder(businessId, phone);
  }

  // Default fallback: try usual order
  return resolveUsualOrder(businessId, phone);
}
