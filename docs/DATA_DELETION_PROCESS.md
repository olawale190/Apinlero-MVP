# Data Deletion Process

This document outlines the data deletion process for Apinlero, ensuring compliance with UK GDPR "Right to Erasure" (Article 17).

## Customer Data Deletion Request

### How Customers Can Request Deletion

1. **Email**: Send request to privacy@apinlero.com
2. **WhatsApp**: Message the business directly
3. **In-App**: Contact support through the platform

### Required Information

- Full name
- Email address or phone number associated with the account
- Reason for deletion (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Completion**: Within 30 days (as required by UK GDPR)

---

## Data Deletion Checklist

### Customer Data

| Data Type | Location | Deletion Method |
|-----------|----------|-----------------|
| Account info | `users` table | DELETE from Supabase |
| Order history | `orders` table | Anonymize or DELETE |
| Delivery addresses | `orders` table | DELETE |
| WhatsApp messages | `media_files` table | DELETE files + records |
| Uploaded images | Supabase Storage | DELETE from buckets |
| Consent preferences | localStorage | Auto-clears with account |

### Business/Merchant Data

| Data Type | Location | Deletion Method |
|-----------|----------|-----------------|
| Business profile | `businesses` table | DELETE |
| Product catalog | `products` table | DELETE |
| Product images | `apinlero-products` bucket | DELETE |
| Order data | `orders` table | Retain anonymized for tax |
| WhatsApp config | `whatsapp_configs` table | DELETE |

---

## SQL Scripts for Data Deletion

### Delete Customer Data

```sql
-- Replace {customer_email} and {customer_phone} with actual values

-- 1. Get customer ID
SELECT id FROM users WHERE email = '{customer_email}';

-- 2. Delete media files from database
DELETE FROM media_files
WHERE customer_phone = '{customer_phone}';

-- 3. Anonymize orders (keep for tax compliance, remove personal data)
UPDATE orders
SET
  customer_name = 'DELETED',
  phone_number = 'DELETED',
  email = NULL,
  delivery_address = 'DELETED',
  notes = NULL
WHERE phone_number = '{customer_phone}' OR email = '{customer_email}';

-- 4. Delete user account
DELETE FROM users WHERE email = '{customer_email}';
```

### Delete Storage Files

```sql
-- List files to delete (run before deletion)
SELECT bucket_name, file_path
FROM media_files
WHERE customer_phone = '{customer_phone}';
```

Then delete from Supabase Storage:
```javascript
// In Supabase Dashboard or via API
const { error } = await supabase.storage
  .from('apinlero-media')
  .remove(['{file_path_1}', '{file_path_2}']);
```

---

## Automated Deletion Process

### Future Implementation: Self-Service Deletion

```typescript
// Planned feature: Customer self-service deletion
async function requestAccountDeletion(userId: string) {
  // 1. Mark account for deletion (30-day grace period)
  await supabase
    .from('users')
    .update({
      deletion_requested_at: new Date().toISOString(),
      is_active: false
    })
    .eq('id', userId);

  // 2. Send confirmation email
  await sendDeletionConfirmationEmail(userId);

  // 3. Schedule deletion job (after 30 days)
  await scheduleJob('deleteUserData', { userId }, '30d');
}
```

---

## Data Retention Exceptions

Some data cannot be deleted due to legal requirements:

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Order invoices | 7 years | UK tax law (HMRC) |
| Payment records | 7 years | Financial regulations |
| Fraud-related data | As required | Legal proceedings |

**Note**: When retaining for legal purposes, personal identifiers are removed (anonymized).

---

## Deletion Verification

After deletion, verify:

1. **Database**: Run query to confirm no records exist
2. **Storage**: Check buckets for orphan files
3. **Backups**: Flag for exclusion from future restores
4. **Third parties**: Notify (Twilio, payment processor)

### Verification Query

```sql
-- Check for remaining customer data
SELECT
  (SELECT COUNT(*) FROM users WHERE email = '{email}') as user_count,
  (SELECT COUNT(*) FROM orders WHERE phone_number = '{phone}' AND customer_name != 'DELETED') as order_count,
  (SELECT COUNT(*) FROM media_files WHERE customer_phone = '{phone}') as media_count;
```

---

## Audit Log

All deletion requests are logged:

```sql
-- Deletion audit log
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(50) NOT NULL, -- 'customer', 'business'
  requester_email VARCHAR(255),
  requester_phone VARCHAR(50),
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  deleted_records JSONB, -- Summary of what was deleted
  processed_by VARCHAR(255)
);
```

---

## Contact

For data deletion requests:
- **Email**: privacy@apinlero.com
- **Response time**: Within 30 days

---

*Last Updated: January 2026*
