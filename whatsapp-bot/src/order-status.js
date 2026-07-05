/**
 * Order lifecycle — single source of truth for statuses and transitions.
 *
 * All statuses are lowercase. The DB historically had mixed casing
 * ("Pending", "Confirmed", "pending") — normalizeStatus() collapses any
 * legacy value to the canonical lowercase form.
 */

export const STATUS = {
  PENDING: 'pending',            // order created, not yet paid
  PAID: 'paid',                  // payment confirmed
  ACCEPTED: 'accepted',          // vendor accepted
  PREPARING: 'preparing',        // vendor packing it
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Allowed forward transitions (vendor/customer/system driven).
// Cancellation is allowed from any non-terminal state.
const TRANSITIONS = {
  [STATUS.PENDING]: [STATUS.PAID, STATUS.ACCEPTED, STATUS.CANCELLED],
  [STATUS.PAID]: [STATUS.ACCEPTED, STATUS.CANCELLED],
  [STATUS.ACCEPTED]: [STATUS.PREPARING, STATUS.CANCELLED],
  [STATUS.PREPARING]: [STATUS.OUT_FOR_DELIVERY, STATUS.CANCELLED],
  [STATUS.OUT_FOR_DELIVERY]: [STATUS.DELIVERED, STATUS.CANCELLED],
  [STATUS.DELIVERED]: [],
  [STATUS.CANCELLED]: [],
};

/**
 * Collapse any legacy/mixed-case status string to a canonical lowercase status.
 */
export function normalizeStatus(raw) {
  if (!raw) return STATUS.PENDING;
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, '_');
  const known = new Set(Object.values(STATUS));
  if (known.has(s)) return s;
  // Legacy aliases
  if (s === 'confirmed') return STATUS.ACCEPTED;
  if (s === 'complete' || s === 'completed') return STATUS.DELIVERED;
  if (s === 'ready') return STATUS.PREPARING;
  return STATUS.PENDING;
}

/**
 * Is a transition from → to allowed?
 */
export function canTransition(from, to) {
  const f = normalizeStatus(from);
  const t = normalizeStatus(to);
  return (TRANSITIONS[f] || []).includes(t);
}

/**
 * Human-friendly label for a status (used in vendor/customer messages).
 */
export function statusLabel(status) {
  const map = {
    [STATUS.PENDING]: 'Awaiting payment',
    [STATUS.PAID]: 'Paid',
    [STATUS.ACCEPTED]: 'Accepted',
    [STATUS.PREPARING]: 'Being prepared',
    [STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
    [STATUS.DELIVERED]: 'Delivered',
    [STATUS.CANCELLED]: 'Cancelled',
  };
  return map[normalizeStatus(status)] || 'Processing';
}

/**
 * The customer-facing WhatsApp message to send when an order ENTERS a status.
 * Returns null for statuses that don't warrant a customer ping.
 * `ctx` = { orderRef, eta, customerName }
 */
export function customerUpdateForStatus(status, ctx = {}) {
  const ref = ctx.orderRef ? `#${ctx.orderRef}` : 'your order';
  const name = ctx.customerName ? ` ${ctx.customerName}` : '';
  switch (normalizeStatus(status)) {
    case STATUS.ACCEPTED:
      return `Good news${name}! 🎉 We've got ${ref} and we're getting started on it now.`;
    case STATUS.PREPARING:
      return `👨‍🍳 We're packing ${ref} for you right now!`;
    case STATUS.OUT_FOR_DELIVERY:
      return `🛵 ${ref} is on the way to you${ctx.eta ? ` — should arrive ${ctx.eta}` : ''}! Please keep your phone handy.`;
    case STATUS.DELIVERED:
      return `✅ ${ref} has been delivered — enjoy${name}! 💚\n\nHow was everything? Your feedback helps us serve you better.`;
    case STATUS.CANCELLED:
      return `Your order ${ref} has been cancelled.${ctx.reason ? ` Reason: ${ctx.reason}.` : ''} If this was a mistake, just message us and we'll sort it out.`;
    default:
      return null;
  }
}
