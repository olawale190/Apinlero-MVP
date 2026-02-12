/**
 * Cryptographic utilities for secure data handling
 *
 * Uses AES-256-GCM for encryption with authenticated encryption
 * The encryption key should be stored as ENCRYPTION_KEY environment variable
 */

// Generate a random IV for each encryption operation
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

// Convert string to Uint8Array
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// Convert Uint8Array to base64
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Convert base64 to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a crypto key from the encryption key string
 */
async function deriveKey(keyString: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBytes(keyString),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: stringToBytes('apinlero-stripe-salt-v1'), // Static salt for deterministic key derivation
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a Stripe secret key
 *
 * @param secretKey - The Stripe secret key to encrypt (sk_test_... or sk_live_...)
 * @returns Base64 encoded encrypted string (IV + ciphertext + auth tag)
 */
export async function encryptStripeKey(secretKey: string): Promise<string> {
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set and at least 32 characters');
  }

  // Validate it looks like a Stripe key
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }

  const iv = generateIV();
  const key = await deriveKey(encryptionKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    stringToBytes(secretKey)
  );

  // Combine IV + ciphertext (includes auth tag)
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64 with prefix for versioning
  return 'enc_v1:' + bytesToBase64(combined);
}

/**
 * Decrypt a Stripe secret key
 *
 * @param encryptedKey - The encrypted key string from database
 * @returns The decrypted Stripe secret key
 */
export async function decryptStripeKey(encryptedKey: string): Promise<string> {
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set and at least 32 characters');
  }

  // Check for encryption version prefix
  if (encryptedKey.startsWith('enc_v1:')) {
    encryptedKey = encryptedKey.slice(7); // Remove prefix
  } else if (encryptedKey.startsWith('sk_')) {
    // MIGRATION: If it's still plaintext, return as-is but log warning
    console.warn('WARNING: Stripe key is stored in plaintext. Please re-save to encrypt.');
    return encryptedKey;
  }

  const combined = base64ToBytes(encryptedKey);

  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const key = await deriveKey(encryptionKey);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const secretKey = bytesToString(new Uint8Array(decrypted));

    // Validate decrypted key format
    if (!secretKey.startsWith('sk_')) {
      throw new Error('Decrypted value is not a valid Stripe key');
    }

    return secretKey;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt Stripe key. Key may be corrupted or encryption key changed.');
  }
}

/**
 * Check if a key is already encrypted
 */
export function isEncrypted(key: string): boolean {
  return key.startsWith('enc_v1:');
}
