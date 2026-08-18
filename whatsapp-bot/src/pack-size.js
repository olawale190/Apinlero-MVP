/**
 * Pack-size reconciliation.
 *
 * THE BUG THIS EXISTS TO FIX
 * --------------------------
 * "2kg rice" was parsed as quantity=2 and then multiplied against whatever
 * product matched "rice" — which is "Aani Rice 10kg" at £20. The customer was
 * quoted £40 for 20kg of rice when they wanted about £4 worth.
 *
 * The mistake is treating a MEASURE as a COUNT. "2 bags" is a count: two of
 * the thing. "2kg" is an amount: it has to be reconciled against how the shop
 * actually sells the product. Isha's catalogue keeps that size in the product
 * NAME ("Aani Rice 10kg", "Tilda Basmati Rice 5kg"), sometimes in the unit
 * column ("5kg bag"), so both are read here.
 *
 * Rules applied, in order:
 *   1. A variant exists at exactly the requested size  -> that variant, qty 1
 *   2. The request is a whole multiple of a variant    -> that variant, qty N
 *   3. Neither                                         -> DO NOT multiply; ask
 *
 * Rule 3 is the important one. Silently charging for the nearest pack is how a
 * customer gets a £40 bill for £4 of rice and stops trusting the shop.
 */

// Units that describe an amount of product, as opposed to a number of packs.
const MEASURE_UNITS = new Set(['kg', 'g', 'l', 'ml', 'litre', 'litres', 'liter', 'liters']);

/** Convert any measure to a canonical base unit so sizes can be compared. */
function toBase(value, unit) {
  const u = String(unit || '').toLowerCase();
  if (u === 'g') return { value: value / 1000, unit: 'kg' };
  if (u === 'ml') return { value: value / 1000, unit: 'l' };
  if (u.startsWith('lit') || u === 'l') return { value, unit: 'l' };
  if (u === 'kg') return { value, unit: 'kg' };
  return null;
}

/** True when the customer gave an amount ("2kg") rather than a count ("2 bags"). */
export function isMeasureUnit(unit) {
  return MEASURE_UNITS.has(String(unit || '').toLowerCase().trim());
}

/**
 * Pull the pack size out of a product name or unit string.
 * "Aani Rice 10kg" -> { value: 10, unit: 'kg' }
 * "Palm Oil 1 litre" -> { value: 1, unit: 'l' }
 * Returns null when the product carries no size (e.g. "Crayfish Pack").
 */
export function parsePackSize(...sources) {
  for (const source of sources) {
    if (!source) continue;
    // Last match wins: "Tilda Basmati Rice 10kg Premium" and "5kg bag" both end
    // up with the size we want, and a leading brand number won't hijack it.
    const matches = [...String(source).matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|litres?|liters?)\b/gi)];
    if (!matches.length) continue;
    const m = matches[matches.length - 1];
    const base = toBase(parseFloat(m[1]), m[2]);
    if (base && base.value > 0) return base;
  }
  return null;
}

/**
 * Reconcile a requested amount against the sizes a shop actually sells.
 *
 * @param {number} amount   - how much the customer asked for (2, for "2kg")
 * @param {string} unit     - the measure they used ('kg')
 * @param {Array}  variants - candidate catalogue products (same product family)
 * @returns {{product: Object, quantity: number}                 // resolved
 *          |{sizeMismatch: true, requested: string, options: Array}  // must ask
 *          |null}                                               // not applicable
 */
export function reconcilePackSize(amount, unit, variants) {
  const want = toBase(Number(amount), unit);
  if (!want || !Array.isArray(variants) || variants.length === 0) return null;

  const sized = variants
    .map(p => ({ product: p, size: parsePackSize(p.name, p.unit) }))
    .filter(v => v.size && v.size.unit === want.unit);

  // No variant declares a comparable size — leave it to the caller's normal path.
  if (!sized.length) return null;

  // 1. Exact match on a single pack.
  const exact = sized.find(v => Math.abs(v.size.value - want.value) < 1e-9);
  if (exact) return { product: exact.product, quantity: 1 };

  // 2. Whole multiple of a pack. Prefer the largest pack that divides evenly,
  //    so 20kg is 2x10kg rather than 4x5kg.
  const multiples = sized
    .map(v => ({ ...v, times: want.value / v.size.value }))
    .filter(v => v.times >= 2 && Number.isInteger(Number(v.times.toFixed(6))))
    .sort((a, b) => b.size.value - a.size.value);
  if (multiples.length) {
    return { product: multiples[0].product, quantity: Math.round(multiples[0].times) };
  }

  // 3. Nothing fits. Ask rather than guess.
  //    One entry per distinct size, cheapest of each — offering the customer
  //    "5kg, 5kg, 10kg" because two brands share a size is just noise.
  const cheapestBySize = new Map();
  for (const v of sized) {
    const key = `${v.size.value}${v.size.unit}`;
    const seen = cheapestBySize.get(key);
    if (!seen || (v.product.price ?? Infinity) < (seen.product.price ?? Infinity)) {
      cheapestBySize.set(key, v);
    }
  }

  const options = [...cheapestBySize.values()]
    .sort((a, b) => a.size.value - b.size.value)
    .map(v => ({ product: v.product, size: `${v.size.value}${v.size.unit}` }));

  return { sizeMismatch: true, requested: `${want.value}${want.unit}`, options };
}
