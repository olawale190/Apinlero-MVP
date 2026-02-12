# Security Quick Start

## Your Pre-commit Hook is Already Active! ✅

The security system is already protecting your repo. Here's proof:

```bash
cd Apinlero_MVP
echo "FAKE_KEY=sk_test_123" > test.txt
git add test.txt
git commit -m "test"
# 🚫 Will be blocked!
```

---

## What's Already Protected

Your repo has **3 layers** of secret detection:

### 1. Custom Pre-commit Hook (Active)
Location: `.git/hooks/pre-commit`

**Blocks:**
- `.env` files (except `.env.example`)
- Twilio auth tokens
- Supabase service keys
- Neo4j passwords
- Resend API keys
- Any JWT tokens
- Generic API keys with 20+ characters

### 2. Gitleaks Config
Location: `.gitleaks.toml`

**Configured for:**
- Twilio patterns
- Supabase JWT patterns
- Neo4j credentials
- Resend API keys
- Generic API key patterns

### 3. Pre-commit Framework
Location: `.pre-commit-config.yaml`

**Features:**
- Industry-standard Gitleaks integration
- Automated `.env` file detection
- Can be extended with more hooks

---

## Rotate Credentials (Step-by-Step)

### Priority 1: Resend API Key (Email)

```bash
# 1. Create new key at: resend.com/api-keys
# 2. Update locally
nano Apinlero_MVP/project/.env.local
# Change: VITE_RESEND_API_KEY=re_NEW_KEY

# 3. Update Vercel
npx vercel env rm VITE_RESEND_API_KEY production --yes
npx vercel env add VITE_RESEND_API_KEY production
# Paste new key when prompted

# 4. Deploy
npx vercel --prod --yes
```

### Priority 2: Supabase Service Key

```bash
# 1. Generate at: supabase.com/dashboard
#    → Settings → API → Generate new service_role key

# 2. Update Railway (WhatsApp bot)
#    → Variables → SUPABASE_SERVICE_KEY → Paste new key

# 3. Update local files
nano Apinlero_MVP/whatsapp-bot/.env
# Change: SUPABASE_SERVICE_KEY=eyJ_NEW_KEY
```

### Priority 3: Twilio Auth Token

```bash
# 1. Create secondary at: console.twilio.com
#    → Account → API keys & tokens → Create secondary token

# 2. Promote to primary

# 3. Update Railway
#    → Variables → TWILIO_AUTH_TOKEN → Paste new token

# 4. Update locally
nano Apinlero_MVP/whatsapp-bot/.env
# Change: TWILIO_AUTH_TOKEN=new_token
```

---

## Test Everything Works

```bash
# 1. Test pre-commit hook
cd Apinlero_MVP
echo "SECRET_KEY=test123" > test.txt
git add test.txt && git commit -m "test"
# Should be BLOCKED ✅
rm test.txt && git reset HEAD test.txt

# 2. Test frontend
cd project
npm run dev
# Visit: http://localhost:5173/email-settings
# Test email connection

# 3. Test WhatsApp bot
cd ../whatsapp-bot
npm run dev
# Send test message to bot

# 4. Deploy to production
cd ../project
npx vercel --prod --yes
# Visit: https://app.apinlero.com
```

---

## Daily Security Habits

### Before Every Commit
```bash
git status  # Check what you're committing
git diff    # Review changes
# Pre-commit hook runs automatically
git commit -m "your message"
```

### Weekly Check
```bash
cd Apinlero_MVP/project
npm audit  # Check for vulnerabilities
```

### Monthly Rotation
Set a calendar reminder to rotate credentials quarterly.

---

## What Files Are Safe vs. Dangerous

### ✅ SAFE to commit
- `.env.example` - Template files
- `package.json` - No secrets here
- Source code files (`.ts`, `.tsx`, `.js`)
- Config files (`vite.config.ts`, `tailwind.config.js`)

### 🚫 NEVER commit
- `.env` - Contains real secrets
- `.env.local` - Local secrets
- `.env.production` - Production secrets
- Any file with `API_KEY=actual_value`

---

## Emergency: "I Committed a Secret!"

```bash
# 1. IMMEDIATELY rotate the exposed credential (see guide above)

# 2. Check if pushed to GitHub
git log --all -- "**/.env*"

# 3. If not pushed yet
git reset HEAD~1  # Undo commit
git rm --cached .env  # Remove from staging
# Add to .gitignore if not already there

# 4. If already pushed
# - Rotate credentials immediately
# - Contact GitHub Support to purge from history
# - Or use BFG Repo Cleaner (advanced)
```

---

## Quick Links

| Service | Rotate Credentials | Docs |
|---------|-------------------|------|
| Resend | [resend.com/api-keys](https://resend.com/api-keys) | See CREDENTIAL_ROTATION_GUIDE.md |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) | Settings → API |
| Twilio | [console.twilio.com](https://console.twilio.com) | Account → API keys |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) | Developers → API keys |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | Settings → Environment Variables |
| Railway | [railway.app](https://railway.app) | Project → Variables |

---

## Full Documentation

For complete step-by-step instructions, see:
- [CREDENTIAL_ROTATION_GUIDE.md](CREDENTIAL_ROTATION_GUIDE.md) - Full rotation guide
- [CLAUDE.md](CLAUDE.md) - Project overview
- [SECURITY_GUIDE.md](SECURITY_GUIDE.md) - Security best practices

---

*Your security system is active and protecting you! 🛡️*
