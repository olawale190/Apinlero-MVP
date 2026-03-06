/**
 * Currency conversion utilities
 *
 * Supabase stores prices in pence (integer).
 * These helpers convert between pence and pounds for display.
 */

/**
 * Convert pence to pounds
 * @param {number} pence - Price in pence (e.g. 899)
 * @returns {number} Price in pounds (e.g. 8.99)
 */
export function penceToPounds(pence) {
  return pence / 100;
}

/**
 * Convert pounds to pence
 * @param {number} pounds - Price in pounds (e.g. 8.99)
 * @returns {number} Price in pence (e.g. 899)
 */
export function poundsToPence(pounds) {
  return Math.round(pounds * 100);
}
