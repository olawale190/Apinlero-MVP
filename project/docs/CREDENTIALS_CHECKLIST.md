# Complete Credentials Checklist for Apinlero

**Last Audit:** 2026-02-11
**Run `npm run check-env` to validate automatically.**

---

## Current Status Overview

| Environment | Configured | Issues | Missing |
|-------------|-----------|--------|---------|
| Frontend (.env) | 7 | 1 placeholder | 2 optional |
| Backend (backend/.env) | 6 | 1 wrong format | 1 critical |
| Knowledge Graph | 4 | 1 wrong URL | - |
| Supabase Edge Functions | 2 auto | 3 need verification | - |

---

## Frontend (.env)

| Variable | Status | Notes |
|----------|--------|-------|
| `VITE_SUPABASE_URL` | ✅ Set | `https://gafoezdpaotwvpfldyhc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set | JWT token configured |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ Set | `pk_test_51SwKJP...` (test mode) |
| `VITE_ENABLE_STRIPE_PAYMENTS` | ✅ Set | `true` |
| `VITE_RESEND_API_KEY` | ✅ Set | `re_ZP6YnEgp...` |
| `VITE_FROM_EMAIL` | ✅ Set | `onboarding@resend.dev` |
| `VITE_BUSINESS_EMAIL` | ✅ Set | `info@apinlero.com` |
| `VITE_APP_NAME` | ❌ Missing | Optional - add `"Isha's Treat & Groceries"` |
| `VITE_APP_URL` | ❌ Missing | Optional - add `https://apinlero.com` |
| `VITE_N8N_WEBHOOK_URL` | ❌ Missing | Optional - n8n automation |
| `VITE_SENTRY_DSN` | ❌ Missing | Optional - error tracking |
| `ANTHROPIC_API_KEY` | ⚠️ Placeholder | Set to `sk-ant-your_api_key_here` - replace or remove |

## Backend (backend/.env)

| Variable | Status | Notes |
|----------|--------|-------|
| `PORT` | ✅ Set | `3001` |
| `NODE_ENV` | ✅ Set | `development` |
| `FRONTEND_URL` | ✅ Set | `http://localhost:5173` |
| `SUPABASE_URL` | ✅ Set | Correct project URL |
| `SUPABASE_ANON_KEY` | ✅ Set | JWT token configured |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Wrong | `sbp_` prefix = access token, NOT service role key |
| `STRIPE_SECRET_KEY` | ✅ Set | `sk_test_51SwKJP...` (test mode) |
| `STRIPE_WEBHOOK_SECRET` | ❌ Empty | Critical for webhook verification |

## Knowledge Graph (knowledge-graph/.env)

| Variable | Status | Notes |
|----------|--------|-------|
| `NEO4J_URI` | ✅ Set | `neo4j+s://9b149521...` |
| `NEO4J_USER` | ✅ Set | `neo4j` |
| `NEO4J_PASSWORD` | ✅ Set | Configured |
| `SUPABASE_URL` | ⚠️ Wrong | Points to wrong project (`hxuzzhtjmpkhhmefajde`) |
| `SUPABASE_SERVICE_KEY` | ✅ Set | Service role JWT configured |

## Supabase Edge Functions

| Variable | Status | Notes |
|----------|--------|-------|
| `SUPABASE_URL` | ✅ Auto | Provided by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto | Provided by Supabase runtime |
| `STRIPE_SECRET_KEY` | ❓ Verify | Run `supabase secrets list` |
| `STRIPE_WEBHOOK_SECRET` | ❓ Verify | Run `supabase secrets list` |
| `ENCRYPTION_KEY` | ❓ Verify | Run `supabase secrets list` |

---

## Issues to Fix (Priority Order)

### 1. CRITICAL: Backend service role key is wrong

The `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` is set to an access token (`sbp_...`), not a service role key. Service role keys are JWTs starting with `eyJ...`.

**Fix:** Go to https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/api and copy the `service_role` key.

### 2. CRITICAL: Stripe webhook secret is empty

`STRIPE_WEBHOOK_SECRET` in `backend/.env` is empty. Webhooks cannot be verified without it.

**Fix:** Go to https://dashboard.stripe.com/webhooks, click your endpoint, copy the Signing secret (`whsec_...`).

### 3. WARNING: Knowledge graph has wrong Supabase URL

`SUPABASE_URL` in `knowledge-graph/.env` points to a different project.

**Fix:** Change to `https://gafoezdpaotwvpfldyhc.supabase.co`

### 4. WARNING: Anthropic API key is placeholder

Only matters if using AI features. Get from https://console.anthropic.com/settings/keys

### 5. INFO: Verify Supabase Edge Function secrets

Run: `supabase secrets list` to confirm `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `ENCRYPTION_KEY` are set.

---

## Where to Get Each Credential

| Credential | Source |
|------------|--------|
| Supabase URL | https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/api |
| Supabase Anon Key | Same page - `anon` `public` key |
| Supabase Service Role Key | Same page - `service_role` key |
| Stripe Publishable Key | https://dashboard.stripe.com/apikeys |
| Stripe Secret Key | Same page - reveal Secret key |
| Stripe Webhook Secret | https://dashboard.stripe.com/webhooks - endpoint - Signing secret |
| Resend API Key | https://resend.com/api-keys |
| Anthropic API Key | https://console.anthropic.com/settings/keys |
| Neo4j Credentials | https://console.neo4j.io |

---

## Stakeholder Request Template

```
Hi,

To complete the Apinlero setup, I need these credentials:

From Stripe Dashboard (dashboard.stripe.com):
1. Webhook Signing Secret (whsec_*) - from Webhooks section

From Supabase Dashboard (supabase.com/dashboard):
2. Service Role Key (eyJ...) - from Settings > API > service_role

Please send both together. These are server-side secrets and will not be
exposed in any frontend code.

Thanks!
```

---

## Security Reminders

1. NEVER commit `.env` files to git (verified: all .env files are in .gitignore)
2. NEVER expose secret keys (`sk_*`, `service_role`, `whsec_*`) in frontend code
3. Use `VITE_` prefix ONLY for values safe to expose in the browser
4. Rotate keys if you suspect they were exposed
5. Use `supabase secrets set` for Edge Function secrets (not .env files)
