# Apinlero Security Documentation

> **Status:** Production Ready
> **Last Updated:** 2026-02-03

## Overview

This folder contains documentation for all security implementations in Apinlero.

## Security Implementations

| Feature | Status | Documentation |
|---------|--------|---------------|
| Stripe Key Encryption | ✅ Active | [encryption.md](./encryption.md) |
| Row Level Security | ✅ Active | [rls-policies.md](./rls-policies.md) |
| Rate Limiting | ✅ Active | [rate-limiting.md](./rate-limiting.md) |
| Audit Logging | ✅ Active | [audit-logging.md](./audit-logging.md) |

## Quick Links

- [Main Security Status](../../APPLY_SECURITY_FIXES.md) - Deployment status and overview
- [Supabase Functions Dashboard](https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/functions)

## Compliance Standards

These implementations support compliance with:
- **PCI-DSS** - Payment card data protection
- **GDPR** - Data isolation and audit trails
- **SOC 2** - Access controls and logging

## File Structure

```
docs/security/
├── README.md              # This file
├── encryption.md          # Stripe key encryption details
├── rls-policies.md        # Row Level Security policies
├── rate-limiting.md       # Rate limiting configuration
└── audit-logging.md       # Audit log schema and usage
```

## Key Files in Codebase

```
supabase/
├── functions/
│   ├── _shared/
│   │   ├── crypto.ts          # Encryption utilities
│   │   └── rate-limiter.ts    # Rate limiting
│   ├── create-payment-intent/
│   ├── save-stripe-config/
│   └── test-stripe-connection/
└── migrations/
    └── 20260203000001_security_rls_policies.sql
```
