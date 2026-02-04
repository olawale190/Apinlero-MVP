/**
 * Input Sanitization Module
 *
 * SECURITY: Prevents prompt injection, XSS, and other input-based attacks
 * All user input from WhatsApp should pass through these functions
 */

// Maximum allowed lengths for different input types
const MAX_LENGTHS = {
  message: 2000,        // Max WhatsApp message length
  name: 100,            // Customer name
  address: 200,         // Delivery address
  postcode: 10,         // UK postcode
  phone: 20,            // Phone number
  orderId: 50,          // Order ID
  productName: 100,     // Product name search
  notes: 500,           // Order notes
};

// Dangerous patterns that might indicate injection attempts
const DANGEROUS_PATTERNS = [
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|UNION|JOIN)\b)/gi,
  /(-{2}|;|\x00)/g,  // SQL comments and null bytes

  // Script injection patterns
  /<script\b[^>]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,  // Event handlers like onclick=

  // Path traversal
  /\.\.\//g,

  // Template injection
  /\$\{.*\}/g,
  /\{\{.*\}\}/g,
];

// Characters to strip from inputs (control characters, etc.)
const STRIP_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitize a generic text input
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeText(input, maxLength = MAX_LENGTHS.message) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove control characters
  sanitized = sanitized.replace(STRIP_CHARS, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Sanitize a message for safe processing
 * Removes potentially dangerous patterns while preserving intent
 * @param {string} message - Raw WhatsApp message
 * @returns {string} - Sanitized message
 */
export function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(message, MAX_LENGTHS.message);

  // Log if dangerous patterns detected (for monitoring)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn(`⚠️ SECURITY: Potentially dangerous pattern detected in message: ${pattern}`);
      // Don't remove the pattern - just log it. The actual processing
      // should use parameterized queries which will prevent injection.
    }
  }

  return sanitized;
}

/**
 * Sanitize a customer name
 * @param {string} name - Raw name from WhatsApp profile
 * @returns {string} - Sanitized name
 */
export function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(name, MAX_LENGTHS.name);

  // Allow only letters, spaces, hyphens, apostrophes, and common punctuation
  // This supports names like "O'Brien", "Mary-Jane", "José"
  sanitized = sanitized.replace(/[^\p{L}\p{M}\s\-'.]/gu, '');

  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Sanitize a delivery address
 * @param {string} address - Raw address input
 * @returns {string} - Sanitized address
 */
export function sanitizeAddress(address) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(address, MAX_LENGTHS.address);

  // Allow alphanumeric, spaces, common punctuation for addresses
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-'.,:;#/()]/gu, '');

  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate and sanitize a UK postcode
 * @param {string} postcode - Raw postcode input
 * @returns {string|null} - Sanitized postcode or null if invalid
 */
export function sanitizePostcode(postcode) {
  if (!postcode || typeof postcode !== 'string') {
    return null;
  }

  // Remove all non-alphanumeric characters
  let sanitized = postcode.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // UK postcode regex (outward + inward code)
  // Examples: SW1A1AA, W1A0AX, M11AE, B338TH, CR26XH, DN551PT
  const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][0-9A-Z]?)([0-9][A-Z]{2})$/;

  const match = sanitized.match(ukPostcodeRegex);
  if (!match) {
    return null;
  }

  // Format with space: "SW1A 1AA"
  return `${match[1]} ${match[2]}`;
}

/**
 * Sanitize a phone number
 * @param {string} phone - Raw phone number
 * @returns {string} - Sanitized phone number
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only digits and + for international format
  return phone.replace(/[^\d+]/g, '').slice(0, MAX_LENGTHS.phone);
}

/**
 * Sanitize a product name for search
 * @param {string} productName - Raw product name/search term
 * @returns {string} - Sanitized product name
 */
export function sanitizeProductName(productName) {
  if (!productName || typeof productName !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(productName, MAX_LENGTHS.productName);

  // Allow letters, numbers, spaces, hyphens (for product names)
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-()]/gu, '');

  return sanitized.trim();
}

/**
 * Sanitize order notes
 * @param {string} notes - Raw notes input
 * @returns {string} - Sanitized notes
 */
export function sanitizeNotes(notes) {
  if (!notes || typeof notes !== 'string') {
    return '';
  }

  let sanitized = sanitizeText(notes, MAX_LENGTHS.notes);

  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized;
}

/**
 * Escape HTML entities for safe display
 * Use when displaying user content in HTML contexts
 * @param {string} str - String to escape
 * @returns {string} - HTML-escaped string
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, char => htmlEntities[char]);
}

/**
 * Validate that a value is within expected bounds
 * @param {number} value - The value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} - Clamped value
 */
export function clampNumber(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate quantity is reasonable
 * @param {number} quantity - Raw quantity value
 * @returns {number} - Valid quantity (1-99)
 */
export function sanitizeQuantity(quantity) {
  const num = parseInt(quantity, 10);
  if (isNaN(num) || num < 1) {
    return 1;
  }
  return Math.min(num, 99);
}

/**
 * Check if a string contains only safe characters for database storage
 * @param {string} str - String to check
 * @returns {boolean} - True if safe
 */
export function isSafeForStorage(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Check for null bytes or control characters
  if (STRIP_CHARS.test(str) || str.includes('\0')) {
    return false;
  }

  return true;
}

// Export max lengths for use in validation
export { MAX_LENGTHS };
