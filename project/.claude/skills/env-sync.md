# Àpínlẹ̀rọ Env Sync

## Purpose
Synchronize environment variables across all Apinlero services (Vercel, Railway, local development).

## Usage
```
/env-sync
```

## Prerequisites
- Access to Vercel, Railway, and Supabase dashboards
- Local `.env` file for development

## Commands

| Command | Description |
|---------|-------------|
| `/env-sync` | Show all required env vars |
| `/env-sync check` | Verify all services have required vars |
| `/env-sync export` | Export current vars to file |
| `/env-sync import` | Import vars from file |

## Environment Variables Master List

### Supabase (All Services)
| Variable | Required By | Description |
|----------|-------------|-------------|
| `SUPABASE_URL` | All | Supabase project URL |
| `SUPABASE_ANON_KEY` | Frontend | Public anon key |
| `SUPABASE_SERVICE_KEY` | Backend, Bot | Service role key (secret) |

### Stripe (Backend, Frontend)
| Variable | Required By | Description |
|----------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Backend | Stripe API secret key |
| `STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe public key |
| `STRIPE_WEBHOOK_SECRET` | Backend | Webhook signing secret |

### WhatsApp/Twilio (Bot)
| Variable | Required By | Description |
|----------|-------------|-------------|
| `TWILIO_ACCOUNT_SID` | Bot | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Bot | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Bot | WhatsApp phone number |

### Neo4j (Bot)
| Variable | Required By | Description |
|----------|-------------|-------------|
| `NEO4J_URI` | Bot | Neo4j Aura connection URI |
| `NEO4J_USER` | Bot | Neo4j username |
| `NEO4J_PASSWORD` | Bot | Neo4j password |

### n8n (Workflows)
| Variable | Required By | Description |
|----------|-------------|-------------|
| `N8N_WEBHOOK_URL` | Frontend | n8n webhook base URL |
| `WHATSAPP_BOT_URL` | n8n | Bot URL for forwarding |

## Service-Specific Configuration

### Vercel (Frontend)
Location: Vercel Dashboard → Project Settings → Environment Variables

```bash
# Required (prefix with VITE_ for Vite)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://backend.railway.app
VITE_N8N_WEBHOOK_URL=https://n8n.railway.app
```

### Railway - WhatsApp Bot
Location: Railway Dashboard → Service → Variables

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
PORT=3000
```

### Railway - Backend API
Location: Railway Dashboard → Service → Variables

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_xxx
```

### n8n (on Railway)
Location: Railway Dashboard → n8n Service → Variables

```bash
# Required
WHATSAPP_BOT_URL=https://web-production-63e51.up.railway.app
N8N_ENCRYPTION_KEY=xxx
WEBHOOK_URL=https://n8n.railway.app
```

### Local Development
Location: `project/.env.local` and `whatsapp-bot/.env`

```bash
# project/.env.local (Frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001

# whatsapp-bot/.env (Bot)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
PORT=3000
```

## Sync Checklist

### When Adding a New Variable

1. **Add to local .env first**
   ```bash
   echo "NEW_VAR=value" >> .env
   ```

2. **Add to Vercel** (if frontend needs it)
   ```bash
   vercel env add VITE_NEW_VAR production
   ```

3. **Add to Railway** (if backend/bot needs it)
   ```bash
   railway variables set NEW_VAR=value
   ```

4. **Document in this file**

### Verification Script
```bash
#!/bin/bash
# Check if required vars are set

REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_SERVICE_KEY"
  "NEO4J_URI"
  "NEO4J_PASSWORD"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "MISSING: $var"
  else
    echo "OK: $var"
  fi
done
```

## Export/Import Commands

### Export from Railway
```bash
railway variables > railway-vars.txt
```

### Export from Vercel
```bash
vercel env pull .env.production
```

### Import to Railway
```bash
# From file
cat vars.txt | while read line; do
  railway variables set "$line"
done
```

## Security Notes

| DO | DON'T |
|----|-------|
| Use service role key for backend | Expose service key in frontend |
| Store secrets in env vars | Commit .env files to git |
| Use test keys in development | Use production keys locally |
| Rotate keys periodically | Share keys in plain text |

## Common Issues

### "Invalid API Key" errors
**Cause:** Using wrong key type or environment
**Solution:**
- Frontend: Use anon key (public)
- Backend: Use service role key (secret)
- Check if using test vs live keys

### "CORS error" in browser
**Cause:** API URL mismatch or missing config
**Solution:**
- Verify VITE_API_URL matches actual backend URL
- Check Supabase URL matches project

### "Connection refused" locally
**Cause:** Service not running or wrong port
**Solution:**
- Check PORT env var matches service port
- Ensure service is actually running

## Where to Find Keys

| Key | Location |
|-----|----------|
| Supabase URL | Supabase → Settings → API |
| Supabase Anon Key | Supabase → Settings → API |
| Supabase Service Key | Supabase → Settings → API |
| Stripe Keys | Stripe Dashboard → Developers → API Keys |
| Neo4j URI | Neo4j Aura → Instance → Connect |
| Twilio SID/Token | Twilio Console → Account Info |

## Related Skills
- `/deploy-vercel` - Deploy frontend
- `/deploy-railway` - Deploy backend/bot

---
*Apinlero Env Sync Skill v1.0*
