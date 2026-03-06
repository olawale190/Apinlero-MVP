/**
 * Intent Normalizer
 *
 * Maps Claude AI classifier lowercase intents to the bot's canonical uppercase intent names.
 */

export const INTENTS = {
  NEW_ORDER: 'NEW_ORDER',
  PRICE_CHECK: 'PRICE_CHECK',
  MODIFY_ORDER: 'MODIFY_ORDER',
  MEAL_ORDER: 'MEAL_ORDER',
  BUDGET_ORDER: 'BUDGET_ORDER',
  RUNNING_TOTAL: 'RUNNING_TOTAL',
  QUANTITY_ESTIMATE: 'QUANTITY_ESTIMATE',
  ADDRESS_UPDATE: 'ADDRESS_UPDATE',
  GENERAL_INQUIRY: 'GENERAL_INQUIRY',
  GREETING: 'GREETING',
  REORDER: 'REORDER',
};

const INTENT_MAP = {
  new_order: INTENTS.NEW_ORDER,
  price_enquiry: INTENTS.PRICE_CHECK,
  modify_order: INTENTS.MODIFY_ORDER,
  meal_order: INTENTS.MEAL_ORDER,
  budget_order: INTENTS.BUDGET_ORDER,
  running_total: INTENTS.RUNNING_TOTAL,
  quantity_estimate: INTENTS.QUANTITY_ESTIMATE,
  address_update: INTENTS.ADDRESS_UPDATE,
  general_query: INTENTS.GENERAL_INQUIRY,
  greeting: INTENTS.GREETING,
  reorder: INTENTS.REORDER,
};

/**
 * Normalize a raw intent string to canonical uppercase format.
 * Handles Claude lowercase → bot uppercase mapping, pass-through for already-uppercase,
 * and null/undefined → GENERAL_INQUIRY fallback.
 */
export function normalizeIntent(rawIntent) {
  if (!rawIntent) return INTENTS.GENERAL_INQUIRY;

  const trimmed = String(rawIntent).trim();

  // Check lowercase mapping first
  if (INTENT_MAP[trimmed]) return INTENT_MAP[trimmed];

  // Pass-through if already uppercase and valid
  const upper = trimmed.toUpperCase();
  const validIntents = new Set(Object.values(INTENTS));
  if (validIntents.has(upper)) return upper;

  return INTENTS.GENERAL_INQUIRY;
}
