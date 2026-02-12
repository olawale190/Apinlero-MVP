# Stripe Key Encryption

> **Algorithm:** AES-256-GCM
> **Key Derivation:** PBKDF2 (100,000 iterations, SHA-256)
> **Status:** ✅ Active in Production

## Overview

All Stripe secret keys are encrypted before storage using AES-256-GCM authenticated encryption. This ensures:
- **Confidentiality** - Keys are unreadable without the encryption key
- **Integrity** - Any tampering is detected via GCM authentication tag
- **Forward Compatibility** - Version prefix allows future algorithm changes

## How It Works

### Encryption Flow

```
User enters sk_live_xxx
        │
        ▼
┌─────────────────────────────┐
│   save-stripe-config        │
│   Edge Function             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   crypto.ts                 │
│   encryptStripeKey()        │
│                             │
│   1. Validate key format    │
│   2. Generate random IV     │
│   3. Derive key via PBKDF2  │
│   4. Encrypt with AES-GCM   │
│   5. Combine IV + ciphertext│
│   6. Base64 encode          │
│   7. Add version prefix     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Database Storage          │
│   enc_v1:base64string...    │
└─────────────────────────────┘
```

### Decryption Flow

```
Edge Function needs key
        │
        ▼
┌─────────────────────────────┐
│   crypto.ts                 │
│   decryptStripeKey()        │
│                             │
│   1. Check version prefix   │
│   2. Base64 decode          │
│   3. Extract IV (12 bytes)  │
│   4. Derive key via PBKDF2  │
│   5. Decrypt with AES-GCM   │
│   6. Validate result format │
└──────────────┬──────────────┘
               │
               ▼
        sk_live_xxx
        (in memory only)
```

## Implementation Details

### File Location
`supabase/functions/_shared/crypto.ts`

### Key Functions

```typescript
// Encrypt a Stripe secret key
export async function encryptStripeKey(secretKey: string): Promise<string>

// Decrypt a Stripe secret key
export async function decryptStripeKey(encryptedKey: string): Promise<string>

// Check if a key is already encrypted
export function isEncrypted(key: string): boolean
```

### Environment Variable

The `ENCRYPTION_KEY` must be set as a Supabase secret:
```bash
supabase secrets set ENCRYPTION_KEY=$(openssl rand -hex 32)
```

Requirements:
- Minimum 32 characters
- Stored securely in Supabase secrets
- Never exposed to frontend

### Encrypted Key Format

```
enc_v1:base64_encoded_data
│      │
│      └── IV (12 bytes) + ciphertext + auth tag
│
└── Version prefix for future migrations
```

## Backward Compatibility

The decryption function handles legacy plaintext keys:

```typescript
if (encryptedKey.startsWith('sk_')) {
  console.warn('WARNING: Stripe key is stored in plaintext. Please re-save to encrypt.');
  return encryptedKey;
}
```

This allows gradual migration without breaking existing integrations.

## Security Considerations

1. **Key Rotation** - To rotate the encryption key:
   - Set new `ENCRYPTION_KEY`
   - Re-save all Stripe configurations
   - Old encrypted values will fail to decrypt (by design)

2. **Key Storage** - The encryption key:
   - Lives only in Supabase secrets
   - Is never logged or exposed
   - Is not accessible from frontend

3. **Memory Safety** - Decrypted keys:
   - Exist only in Edge Function memory
   - Are never stored in variables longer than needed
   - Are never returned to frontend

## Testing

To verify encryption is working:

1. Save a Stripe key via the dashboard
2. Check the database directly:
   ```sql
   SELECT stripe_secret_key_encrypted
   FROM businesses
   WHERE id = 'your-business-id';
   ```
3. Value should start with `enc_v1:` not `sk_`
