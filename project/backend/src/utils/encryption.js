/**
 * AES-256-GCM Encryption Utilities for Apinlero Backend
 *
 * Used to encrypt/decrypt sensitive data (Stripe keys, etc.) at the application layer.
 * Requires ENCRYPTION_KEY environment variable (min 32 chars).
 *
 * Generate a key: openssl rand -hex 32
 *
 * Format: enc_v1:<base64(iv + ciphertext + authTag)>
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_ITERATIONS = 100000;
const KEY_SALT = 'apinlero-stripe-salt-v1'; // Must match Edge Function salt
const VERSION_PREFIX = 'enc_v1:';

/**
 * Derive a 256-bit key from the encryption key string using PBKDF2.
 * Uses the same salt and parameters as the Supabase Edge Function crypto.ts.
 */
function deriveKey(keyString) {
  return crypto.pbkdf2Sync(
    keyString,
    KEY_SALT,
    KEY_ITERATIONS,
    32, // 256 bits
    'sha256'
  );
}

/**
 * Get the encryption key from environment.
 * Throws if not set or too short.
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY must be set and at least 32 characters. ' +
      'Generate with: openssl rand -hex 32'
    );
  }
  return key;
}

/**
 * Encrypt a string value using AES-256-GCM.
 *
 * @param {string} plaintext - The value to encrypt
 * @returns {string} Encrypted string in format: enc_v1:<base64>
 */
export function encrypt(plaintext) {
  const keyString = getEncryptionKey();
  const key = deriveKey(keyString);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: IV + ciphertext + authTag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return VERSION_PREFIX + combined.toString('base64');
}

/**
 * Decrypt an encrypted string.
 *
 * @param {string} encryptedValue - The encrypted string (enc_v1:... format)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedValue) {
  const keyString = getEncryptionKey();
  const key = deriveKey(keyString);

  // Handle version prefix
  let data = encryptedValue;
  if (data.startsWith(VERSION_PREFIX)) {
    data = data.slice(VERSION_PREFIX.length);
  } else if (data.startsWith('sk_')) {
    // Plaintext key (migration case) — return as-is but warn
    console.warn('WARNING: Value is stored in plaintext. Re-save to encrypt.');
    return data;
  }

  const combined = Buffer.from(data, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Encrypt a Stripe secret key specifically.
 * Validates the key format before encrypting.
 *
 * @param {string} secretKey - Stripe secret key (sk_test_... or sk_live_...)
 * @returns {string} Encrypted key
 */
export function encryptStripeKey(secretKey) {
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  return encrypt(secretKey);
}

/**
 * Decrypt a Stripe secret key.
 * Validates the decrypted value is a valid Stripe key.
 *
 * @param {string} encryptedKey - The encrypted key
 * @returns {string} Decrypted Stripe secret key
 */
export function decryptStripeKey(encryptedKey) {
  const decrypted = decrypt(encryptedKey);
  if (!decrypted.startsWith('sk_')) {
    throw new Error('Decrypted value is not a valid Stripe key');
  }
  return decrypted;
}

/**
 * Check if a value is already encrypted.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isEncrypted(value) {
  return value.startsWith(VERSION_PREFIX);
}

export default { encrypt, decrypt, encryptStripeKey, decryptStripeKey, isEncrypted };
