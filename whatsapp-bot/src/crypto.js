/**
 * Stripe secret-key decryption for the bot.
 *
 * MUST stay byte-for-byte compatible with the frontend edge function at
 * project/supabase/functions/_shared/crypto.ts — same AES-256-GCM scheme,
 * same PBKDF2 params (static salt 'apinlero-stripe-salt-v1', 100k iters,
 * SHA-256), same 'enc_v1:' prefix and IV-prepended layout. If you change
 * one, change the other.
 *
 * Backward compatible: a plaintext 'sk_...' value is returned as-is (with a
 * warning), exactly like the frontend decrypt — so the bot works whether the
 * key is encrypted or not.
 */

import { webcrypto } from 'node:crypto';
const subtle = webcrypto.subtle;

const SALT = new TextEncoder().encode('apinlero-stripe-salt-v1');

function base64ToBytes(b64) {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}
function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

async function deriveKey(keyString) {
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(keyString),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Decrypt a stored Stripe secret key.
 * - 'enc_v1:...'  → AES-256-GCM decrypt using ENCRYPTION_KEY
 * - 'sk_...'      → legacy plaintext, returned as-is
 * @param {string} stored - the value from businesses.stripe_secret_key_encrypted
 * @returns {Promise<string|null>} the plaintext sk_ key, or null on failure
 */
export async function decryptStripeKey(stored) {
  if (!stored) return null;

  // Legacy plaintext — still supported so nothing breaks pre-migration
  if (stored.startsWith('sk_')) {
    console.warn('[crypto] Stripe key is PLAINTEXT — re-save via dashboard to encrypt.');
    return stored;
  }

  if (!stored.startsWith('enc_v1:')) {
    console.warn('[crypto] Unrecognized Stripe key format');
    return null;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length < 32) {
    console.error('[crypto] ENCRYPTION_KEY must be set and at least 32 chars to decrypt Stripe key');
    return null;
  }

  try {
    const combined = base64ToBytes(stored.slice(7)); // drop 'enc_v1:'
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await deriveKey(encryptionKey);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const secretKey = new TextDecoder().decode(new Uint8Array(decrypted));
    if (!secretKey.startsWith('sk_')) {
      console.error('[crypto] decrypted value is not a valid Stripe key');
      return null;
    }
    return secretKey;
  } catch (err) {
    console.error('[crypto] Stripe key decryption failed:', err.message);
    return null;
  }
}

export function isEncrypted(key) {
  return typeof key === 'string' && key.startsWith('enc_v1:');
}
