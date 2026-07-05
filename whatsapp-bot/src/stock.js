/**
 * Stock / availability management.
 *
 * Source of truth: products.stock_quantity (integer, matches the dashboard).
 * Threshold:       products.low_stock_alert (integer).
 *
 * Availability states (as defined by the vendor's model — customers buy
 * whatever the vendor has stocked, no per-order confirmation needed):
 *   - 'available'    : stock_quantity > low_stock_alert
 *   - 'low'          : 0 < stock_quantity <= low_stock_alert   (still sells; vendor alerted)
 *   - 'out_of_stock' : stock_quantity <= 0                     (cannot be ordered)
 *
 * Stock is decremented on order CONFIRMATION (reserveStock), atomically via
 * a Postgres RPC so two customers can't oversell the last unit. If the order
 * is never paid, releaseStock puts it back.
 */

import { supabase } from './supabase-client.js';

export const AVAILABILITY = {
  AVAILABLE: 'available',
  LOW: 'low',
  OUT: 'out_of_stock',
};

/**
 * Compute the availability state for a product row.
 */
export function availabilityState(product) {
  const qty = Number(product?.stock_quantity ?? 0);
  const threshold = Number(product?.low_stock_alert ?? 0);
  if (qty <= 0) return AVAILABILITY.OUT;
  if (qty <= threshold) return AVAILABILITY.LOW;
  return AVAILABILITY.AVAILABLE;
}

/**
 * Check whether `requestedQty` of a product can be fulfilled.
 * Returns { ok, available, state, cappedQty } where cappedQty is how many
 * we can actually give (0 if out of stock).
 */
export async function checkStock(productId, requestedQty = 1) {
  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity, low_stock_alert')
    .eq('id', productId)
    .single();

  if (error || !data) {
    // If we can't read stock, fail open (allow the order) rather than block a sale.
    console.warn('[stock] checkStock read failed, allowing:', error?.message);
    return { ok: true, available: null, state: AVAILABILITY.AVAILABLE, cappedQty: requestedQty };
  }

  const available = Number(data.stock_quantity ?? 0);
  const state = availabilityState(data);
  const cappedQty = Math.max(0, Math.min(requestedQty, available));

  return {
    ok: available >= requestedQty && available > 0,
    available,
    state,
    cappedQty,
  };
}

/**
 * Atomically decrement stock for a list of order items on confirmation.
 * Uses the decrement_stock RPC (see stock RPC SQL). Falls back to a
 * best-effort per-item update if the RPC is unavailable.
 *
 * @param {Array<{product_id: string, quantity: number}>} items
 * @returns {Promise<{ok: boolean, lowStock: Array, failed: Array}>}
 *   lowStock = products that crossed into 'low' after this reservation
 *   failed   = items that could not be reserved (insufficient stock)
 */
export async function reserveStock(items) {
  const lowStock = [];
  const failed = [];

  for (const item of items) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity) || 1;

    try {
      const { data, error } = await supabase.rpc('apl_decrement_stock', {
        p_product_id: item.product_id,
        p_qty: qty,
      });

      if (error) throw error;

      // RPC returns the new row (or null if it couldn't decrement)
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        failed.push({ ...item, reason: 'insufficient_stock' });
        continue;
      }
      if (availabilityState(row) === AVAILABILITY.LOW) {
        lowStock.push({
          product_id: item.product_id,
          name: row.name,
          remaining: row.stock_quantity,
        });
      }
    } catch (err) {
      // Fallback: non-atomic guarded update (still checks current qty)
      console.warn('[stock] decrement_stock RPC failed, using fallback:', err.message);
      const fb = await fallbackDecrement(item.product_id, qty);
      if (!fb.ok) failed.push({ ...item, reason: 'insufficient_stock' });
      else if (fb.low) lowStock.push({ product_id: item.product_id, name: fb.name, remaining: fb.remaining });
    }
  }

  return { ok: failed.length === 0, lowStock, failed };
}

/**
 * Put stock back (e.g. abandoned unpaid order, cancellation).
 * Uses the atomic apl_increment_stock RPC when present, otherwise a
 * read-then-write fallback (mirrors reserveStock's fallback path).
 */
export async function releaseStock(items) {
  for (const item of items) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity) || 1;
    try {
      const { error } = await supabase.rpc('apl_increment_stock', {
        p_product_id: item.product_id,
        p_qty: qty,
      });
      if (error) throw error;
    } catch (err) {
      // RPC missing/failed → non-atomic fallback so stock still returns
      console.warn('[stock] apl_increment_stock failed, using fallback:', err.message);
      await fallbackIncrement(item.product_id, qty);
    }
  }
}

/**
 * Non-atomic fallback increment used only if the RPC is missing.
 */
async function fallbackIncrement(productId, qty) {
  try {
    const { data } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();
    if (!data) return;
    const next = Number(data.stock_quantity ?? 0) + qty;
    await supabase.from('products').update({ stock_quantity: next }).eq('id', productId);
  } catch (err) {
    console.warn('[stock] fallbackIncrement failed for', productId, err.message);
  }
}

/**
 * Non-atomic fallback used only if the RPC is missing. Reads then writes;
 * acceptable because it still guards against negative stock, and the RPC
 * is the normal path.
 */
async function fallbackDecrement(productId, qty) {
  const { data } = await supabase
    .from('products')
    .select('name, stock_quantity, low_stock_alert')
    .eq('id', productId)
    .single();
  if (!data) return { ok: true }; // fail open
  const current = Number(data.stock_quantity ?? 0);
  if (current < qty) return { ok: false };
  const next = current - qty;
  await supabase.from('products').update({ stock_quantity: next }).eq('id', productId);
  return {
    ok: true,
    name: data.name,
    remaining: next,
    low: next > 0 && next <= Number(data.low_stock_alert ?? 0),
  };
}
