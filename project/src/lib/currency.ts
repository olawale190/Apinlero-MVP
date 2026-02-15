/**
 * Currency utility functions for price conversion
 * Prices are stored in pence (smallest unit) in the database
 * and need to be converted to pounds for display
 */

/**
 * Convert pence to pounds for display
 * @param pence - Price in pence (e.g., 1299)
 * @returns Price in pounds (e.g., 12.99)
 */
export function penceToPounds(pence: number): number {
  return pence / 100;
}

/**
 * Convert pounds to pence for database storage
 * @param pounds - Price in pounds (e.g., 12.99)
 * @returns Price in pence (e.g., 1299)
 */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Format price in pounds with currency symbol
 * @param pence - Price in pence
 * @param currency - Currency symbol (default: '£')
 * @returns Formatted price string (e.g., '£12.99')
 */
export function formatPrice(pence: number, currency: string = '£'): string {
  const pounds = penceToPounds(pence);
  return `${currency}${pounds.toFixed(2)}`;
}
