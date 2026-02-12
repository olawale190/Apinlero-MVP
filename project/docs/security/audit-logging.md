# Audit Logging

> **Status:** ✅ Active in Production
> **Table:** `security_audit_log`

## Overview

The audit log tracks sensitive operations for security monitoring, compliance, and debugging.

## Table Schema

```sql
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_audit_log_user` | `user_id` | Find all actions by user |
| `idx_audit_log_event` | `event_type` | Filter by event type |
| `idx_audit_log_created` | `created_at` | Time-based queries |

## Event Types

| Event Type | Description | When Logged |
|------------|-------------|-------------|
| `stripe_key_saved` | Stripe configuration updated | save-stripe-config |
| `stripe_key_accessed` | Stripe key decrypted | create-payment-intent |
| `stripe_connection_test` | Connection test attempted | test-stripe-connection |
| `login_attempt` | User login | Auth events |
| `permission_denied` | Access denied by RLS | Failed queries |

## Access Control

Only the service role can read/write audit logs:

```sql
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages audit log"
  ON security_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');
```

This prevents users from:
- Viewing their own audit trail
- Modifying or deleting audit entries
- Discovering what's being logged

## Logging from Edge Functions

```typescript
import { createClient } from '@supabase/supabase-js';

async function logAuditEvent(
  eventType: string,
  details: object,
  req: Request
) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabase.from('security_audit_log').insert({
    event_type: eventType,
    ip_address: req.headers.get('x-forwarded-for'),
    details: details,
    created_at: new Date().toISOString()
  });
}

// Usage:
await logAuditEvent('stripe_key_saved', {
  business_id: businessId,
  key_type: 'live' // or 'test'
}, request);
```

## Querying Audit Logs

### Recent events:
```sql
SELECT * FROM security_audit_log
ORDER BY created_at DESC
LIMIT 100;
```

### Events by user:
```sql
SELECT * FROM security_audit_log
WHERE user_email = 'user@example.com'
ORDER BY created_at DESC;
```

### Failed access attempts:
```sql
SELECT * FROM security_audit_log
WHERE event_type = 'permission_denied'
AND created_at > NOW() - INTERVAL '24 hours';
```

### Stripe key access:
```sql
SELECT
  user_email,
  ip_address,
  created_at,
  details->>'business_id' as business_id
FROM security_audit_log
WHERE event_type IN ('stripe_key_saved', 'stripe_key_accessed')
ORDER BY created_at DESC;
```

## Retention Policy

Consider implementing automatic cleanup for old entries:

```sql
-- Delete entries older than 90 days
DELETE FROM security_audit_log
WHERE created_at < NOW() - INTERVAL '90 days';
```

Or create a scheduled job in Supabase:

```sql
-- Create a cron job (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 0 * * 0', -- Weekly on Sunday
  $$DELETE FROM security_audit_log WHERE created_at < NOW() - INTERVAL '90 days'$$
);
```

## Compliance Notes

### GDPR
- Audit logs may contain personal data (email, IP)
- Include in data subject access requests
- Respect right to erasure (with exceptions for legal requirements)

### PCI-DSS
- Log all access to cardholder data environment
- Retain logs for at least 1 year
- Make logs immediately available for 3 months

### SOC 2
- Log access to sensitive systems
- Maintain integrity of log data
- Alert on suspicious patterns

## Alerting (Future Enhancement)

Consider setting up alerts for:
- Multiple failed access attempts from same IP
- Stripe key access outside business hours
- Unusual number of configuration changes

Integration options:
- Supabase Database Webhooks
- Custom Edge Function with email/Slack
- Third-party SIEM integration
