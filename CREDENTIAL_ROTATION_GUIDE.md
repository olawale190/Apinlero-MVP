# Credential Rotation Guide

This guide helps you rotate compromised credentials and set up ongoing security protection.

---

## Quick Reference

| Service | Dashboard Link | Update Locations |
|---------|---------------|------------------|
| **Resend** | [resend.com/api-keys](https://resend.com/api-keys) | `.env.local`, Vercel |
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) | Railway, `.env` files |
| **Twilio** | [console.twilio.com](https://console.twilio.com) | Railway |
| **Stripe** | [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) | `.env.local`, Vercel |
| **Neo4j** | [console.neo4j.io](https://console.neo4j.io) | Railway, `.env` files |

---

## 1. Resend API Key (Email Service)

### Rotate the Key

1. Visit [resend.com/api-keys](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it: `apinlero-production-v2`
4. Copy the new key (starts with `re_`)
5. **Delete the old key** from the list

### Update Locally

```bash
# Update .env.local
cd Apinlero_MVP/project
nano .env.local  # or use your editor
# Update: VITE_RESEND_API_KEY=re_NEW_KEY_HERE
```

### Update Vercel (Production)

**Option 1: Via CLI**
```bash
cd Apinlero_MVP/project

# Remove old value
npx vercel env rm VITE_RESEND_API_KEY production --yes

# Add new value
npx vercel env add VITE_RESEND_API_KEY production
# When prompted, paste the new key

# Redeploy
npx vercel --prod --yes
```

**Option 2: Via Dashboard**
1. Go to [vercel.com](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Find `VITE_RESEND_API_KEY`
5. Click Edit → Update value
6. Redeploy from Deployments tab

### Verify

```bash
# Test locally
cd Apinlero_MVP/project
npm run dev
# Go to http://localhost:5173/email-settings
# Click "Test Email Connection"
```

---

## 2. Supabase Service Key

### Rotate the Key

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project: **ApinleroMVP** (`gafoezdpaotwvpfldyhc`)
3. Settings → API
4. Under "Project API keys", find **service_role** key
5. Click **"Generate new service_role key"**
6. Copy the new key (starts with `eyJ`)

### Update Railway (WhatsApp Bot)

1. Go to [railway.app](https://railway.app)
2. Select your WhatsApp bot project
3. Go to Variables tab
4. Find `SUPABASE_SERVICE_KEY`
5. Click Edit → Paste new key → Save
6. Railway will auto-redeploy

### Update Local Files

```bash
# WhatsApp bot
cd Apinlero_MVP/whatsapp-bot
nano .env
# Update: SUPABASE_SERVICE_KEY=eyJ_NEW_KEY_HERE

# Knowledge graph (if exists)
cd ../project/knowledge-graph
nano .env
# Update: SUPABASE_SERVICE_KEY=eyJ_NEW_KEY_HERE
```

### Verify

```bash
# Test WhatsApp bot locally
cd Apinlero_MVP/whatsapp-bot
npm run dev
# Should see: "✓ Connected to Supabase"
```

---

## 3. Twilio Auth Token

### Rotate the Token

1. Go to [console.twilio.com](https://console.twilio.com)
2. Account → API keys & tokens
3. Under "Auth Tokens":
   - Click **"Create secondary token"**
   - Copy the new token
   - Click **"Promote to Primary"**
   - Delete the old secondary token

### Update Railway

1. Go to Railway dashboard
2. WhatsApp bot project → Variables
3. Update `TWILIO_AUTH_TOKEN` with new value
4. Save (auto-redeploys)

### Update Locally

```bash
cd Apinlero_MVP/whatsapp-bot
nano .env
# Update: TWILIO_AUTH_TOKEN=new_token_here
```

### Verify

```bash
# Test WhatsApp bot
cd Apinlero_MVP/whatsapp-bot
npm run dev
# Send test message to +1 415 523 8886
```

---

## 4. Stripe API Keys

### Rotate the Keys

1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Click **"Create restricted key"**
3. Name: `Apinlero Production v2`
4. Select permissions:
   - Payments: Write
   - Customers: Write
   - Checkout: Write
5. Create key
6. Copy both:
   - Publishable key (`pk_...`)
   - Secret key (`sk_...`)
7. Delete old keys

### Update Locally

```bash
cd Apinlero_MVP/project
nano .env.local
# Update:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_NEW_KEY
# (Secret key goes in Vercel only, not in frontend)
```

### Update Vercel

```bash
# Remove old keys
npx vercel env rm VITE_STRIPE_PUBLISHABLE_KEY production --yes
npx vercel env rm STRIPE_SECRET_KEY production --yes

# Add new keys
npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_SECRET_KEY production

# Redeploy
npx vercel --prod --yes
```

### Verify

```bash
# Test payment flow
# Go to https://app.apinlero.com
# Add items to cart → Checkout → Test payment
```

---

## 5. Neo4j Password

**Note:** Neo4j Aura Free Tier doesn't support password rotation.

**Options:**
1. **Keep current instance** (low risk - only product aliases)
2. **Create new instance** (free):
   - Go to [console.neo4j.io](https://console.neo4j.io)
   - Create new Aura instance
   - Export data from old instance
   - Import to new instance
   - Update credentials

### Update Locations (if rotating)

```bash
# Railway
# Update: NEO4J_URI, NEO4J_PASSWORD

# Local
cd Apinlero_MVP/whatsapp-bot
nano .env
# Update: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
```

---

## 6. PostgreSQL Direct Connection (Optional)

If you need direct database access:

1. Go to Supabase Dashboard
2. Settings → Database
3. Click **"Reset database password"**
4. Copy new password
5. Update connection string in tools like:
   - pgAdmin
   - DBeaver
   - psql
   - Database GUI tools

---

## Security Verification Checklist

After rotating all credentials:

### 1. Pre-commit Hook Test

```bash
cd Apinlero_MVP

# Test that secrets are blocked
echo "RESEND_API_KEY=re_test123" > test-secret.txt
git add test-secret.txt
git commit -m "test"
# Should see: 🚫 Commit blocked due to potential secrets

# Clean up
rm test-secret.txt
git reset HEAD test-secret.txt
```

### 2. Service Tests

```bash
# Test frontend
cd project
npm run dev
# Visit http://localhost:5173
# Test login, email, Stripe

# Test WhatsApp bot
cd ../whatsapp-bot
npm run dev
# Send test message
```

### 3. Production Tests

```bash
# Deploy to production
cd Apinlero_MVP/project
npx vercel --prod --yes

# Test live site
# Visit: https://app.apinlero.com
# Verify: Login, email, checkout
```

### 4. Check .gitignore

```bash
cd Apinlero_MVP
cat .gitignore | grep ".env"
# Should see:
# .env
# .env.local
# .env.*.local
```

---

## Ongoing Security Best Practices

### 1. Enable Git Hooks Globally

The pre-commit hook is already set up locally. To enable it for ALL your Git repos:

```bash
# Create global template
mkdir -p ~/.git-templates/hooks
cp Apinlero_MVP/.git/hooks/pre-commit ~/.git-templates/hooks/

# Configure Git to use template
git config --global init.templateDir ~/.git-templates

# Apply to existing repos
cd Apinlero_MVP
git init  # Safe - just refreshes hooks
```

### 2. Regular Security Audits

```bash
# Check for vulnerable dependencies
cd Apinlero_MVP/project
npm audit

# Fix non-breaking vulnerabilities
npm audit fix

# Review manual fixes needed
npm audit fix --force  # Use with caution
```

### 3. Environment Variable Review

Run monthly:

```bash
cd Apinlero_MVP
/check-credentials  # Claude Code skill

# Or manually check
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" .env* 2>/dev/null || echo "No .env files found (good!)"
```

### 4. Rotate Credentials Quarterly

Set calendar reminders to rotate:
- **Monthly**: Twilio auth token (if heavily used)
- **Quarterly**: All other API keys
- **Annually**: Database passwords

### 5. Monitor for Exposure

- Enable GitHub secret scanning (Settings → Security → Secret scanning)
- Sign up for [haveibeenpwned.com](https://haveibeenpwned.com) alerts
- Monitor Vercel deployment logs for suspicious activity

---

## What NOT to Do

Never:
- Commit `.env` files (even by accident)
- Share API keys via Slack/email/text
- Use production keys in development
- Store credentials in code comments
- Use `git commit --no-verify` unless absolutely necessary
- Push directly to `main` without review

---

## Emergency Response

If you discover exposed credentials:

```bash
# 1. Immediate rotation (use this guide)
# 2. Check git history
git log --all --full-history -- "**/.env*"

# 3. If found in history, contact:
# - GitHub Support (to purge history)
# - Or use BFG Repo Cleaner (advanced)

# 4. Force push (after backup)
git push --force-with-lease
```

---

## Support Resources

- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

*Last Updated: February 4, 2026*
