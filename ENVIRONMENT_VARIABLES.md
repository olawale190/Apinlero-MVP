# Environment Variables Reference

Complete guide to all environment variables needed for Apinlero.

---

## WhatsApp Bot Environment Variables

Location: `/whatsapp-bot/.env`

### Required Variables

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone Number ID | Meta Dashboard > WhatsApp > API Setup | `123456789012345` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API Access Token | Meta Dashboard > WhatsApp > API Setup > Generate Token | `EAABsbCS1234...` |
| `WHATSAPP_VERIFY_TOKEN` | Custom webhook verification token | Create your own secure random string | `my-secret-verify-token-2024` |
| `WHATSAPP_BUSINESS_ID` | Business Manager ID | Meta Business Suite > Business Settings | `987654321098765` |
| `WHATSAPP_APP_SECRET` | App Secret for webhook verification | Meta Dashboard > App Settings > Basic | `a1b2c3d4e5f6...` |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API | `eyJhbGciOiJI...` |
| `PORT` | Server port | - | `3000` |
| `NODE_ENV` | Environment mode | - | `development` or `production` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (fallback) | - | `AC1234567890abcdef` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - | `your-auth-token` |
| `TWILIO_PHONE_NUMBER` | Twilio WhatsApp number | - | `whatsapp:+14155238886` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | - | `sk-...` |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `SENTRY_DSN` | Sentry error tracking | - | `https://...@sentry.io/...` |

---

## Frontend Environment Variables

Location: `/project/.env`

### Required Variables

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard > Settings > API | `eyJhbGciOiJI...` |

### Production Variables

| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard > Developers > API keys | `pk_live_...` or `pk_test_...` |
| `VITE_APP_NAME` | Application name | - | `Isha's Treat & Groceries` |
| `VITE_APP_URL` | Production URL | Your Vercel domain | `https://apinlero.com` |
| `VITE_API_URL` | WhatsApp bot API URL | Your Railway domain | `https://bot.railway.app` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_ENABLE_STRIPE_PAYMENTS` | Enable Stripe payments | `false` | `true` or `false` |
| `VITE_ENABLE_NOTIFICATIONS` | Enable push notifications | `false` | `true` or `false` |
| `VITE_N8N_WEBHOOK_URL` | n8n automation webhook | - | `https://n8n.cloud/webhook/...` |
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | - | `G-XXXXXXXXXX` |
| `VITE_SENTRY_DSN` | Sentry error tracking (frontend) | - | `https://...@sentry.io/...` |

---

## How to Get Each Credential

### Meta WhatsApp Credentials

#### 1. Phone Number ID
1. Go to [Meta Developers](https://developers.facebook.com)
2. Select your app
3. Click **WhatsApp** in sidebar
4. Go to **API Setup**
5. Find "Phone number ID" field
6. Copy the number

#### 2. Access Token (Temporary - for testing)
1. Same page as above
2. Click **Generate Token** button
3. Select permissions
4. Copy token
5. **Note**: Expires in 24 hours

#### 3. Access Token (Permanent - for production)
1. Go to [Meta Business Suite](https://business.facebook.com)
2. Navigate to **Business Settings**
3. Click **Users > System Users**
4. Click **Add** to create system user
5. Name it (e.g., "Apinlero Bot")
6. Click **Add Assets**
7. Add your WhatsApp Business Account
8. Click **Generate New Token**
9. Select your app
10. Check permissions:
    - `whatsapp_business_management`
    - `whatsapp_business_messaging`
11. Copy and save the token securely

#### 4. Verify Token
- **You create this yourself**
- Must be a secure random string
- Use a password generator or:
```bash
openssl rand -base64 32
```
- Keep it secret
- Use the same value in `.env` and Meta webhook config

#### 5. Business ID
1. Go to [Meta Business Suite](https://business.facebook.com)
2. Click **Business Settings**
3. Your Business ID is at the top
4. Or find in URL: `business.facebook.com/settings/info?business_id=XXXXXXXXX`

#### 6. App Secret
1. Go to [Meta Developers](https://developers.facebook.com)
2. Select your app
3. Go to **Settings > Basic**
4. Find "App Secret"
5. Click **Show**
6. Copy the secret

### Supabase Credentials

#### 1. Project URL
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > API**
4. Copy **Project URL**
5. Format: `https://your-project.supabase.co`

#### 2. Anon Key (for frontend)
1. Same page as above
2. Copy **anon** public key
3. Safe to expose in frontend
4. Starts with `eyJhbGci...`

#### 3. Service Role Key (for backend)
1. Same page as above
2. Copy **service_role** key
3. **Keep secret!** Never expose in frontend
4. Has admin access to database

### Stripe Credentials

#### Test Keys (for development)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Ensure **Test mode** is ON (top right)
3. Go to **Developers > API keys**
4. Copy **Publishable key** (starts with `pk_test_`)
5. Copy **Secret key** (starts with `sk_test_`)

#### Live Keys (for production)
1. Same dashboard
2. Toggle **Test mode** OFF (switch to Live)
3. Go to **Developers > API keys**
4. Copy **Publishable key** (starts with `pk_live_`)
5. Copy **Secret key** (starts with `sk_live_`)

#### Webhook Secret
1. Go to **Developers > Webhooks**
2. Click on your webhook endpoint
3. Click **Reveal** next to "Signing secret"
4. Copy the value (starts with `whsec_`)

---

## Environment Files Setup

### Development Setup

#### 1. WhatsApp Bot

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
cp .env.example .env
nano .env
```

Add your development credentials:

```env
# Meta WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-temp-token
WHATSAPP_VERIFY_TOKEN=my-dev-verify-token-123
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_APP_SECRET=your-app-secret

# Supabase
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3000
NODE_ENV=development
```

#### 2. Frontend

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
cp .env.example .env
nano .env
```

Add your development credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (TEST mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key

# App Config
VITE_APP_NAME="Isha's Treat & Groceries"
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# Features
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=false
```

### Production Setup

#### Railway (WhatsApp Bot)

Set variables in Railway dashboard:

```env
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-PERMANENT-token
WHATSAPP_VERIFY_TOKEN=my-prod-verify-token-456
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_APP_SECRET=your-app-secret
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=production
PORT=3000
```

#### Vercel (Frontend)

Set variables in Vercel dashboard:

```env
VITE_SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-live-key
VITE_APP_NAME=Isha's Treat & Groceries
VITE_APP_URL=https://apinlero.com
VITE_API_URL=https://your-app.railway.app
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## Security Best Practices

### DO ✅

- Use different keys for development and production
- Store sensitive keys in platform dashboards (Railway/Vercel)
- Use `.env` files locally (never commit them)
- Add `.env` to `.gitignore`
- Rotate keys periodically
- Use service role key only on backend
- Use anon key only on frontend
- Generate strong verify tokens

### DON'T ❌

- Commit `.env` files to git
- Share keys in chat/email
- Use production keys in development
- Expose service role key in frontend
- Use the same verify token as examples
- Hard-code credentials in source code
- Use expired WhatsApp tokens
- Share app secrets publicly

---

## Verification Commands

### Check Environment Variables Are Set

**Local (WhatsApp Bot):**
```bash
cd whatsapp-bot
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.startsWith('WHATSAPP') || k.startsWith('SUPABASE')))"
```

**Local (Frontend):**
```bash
cd project
node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.startsWith('VITE_')))"
```

**Railway:**
```bash
railway variables
```

**Vercel:**
```bash
vercel env ls
```

### Test Connections

**Test Supabase Connection:**
```bash
curl -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  "https://hxuzzhtjmpkhhmefajde.supabase.co/rest/v1/products?select=*&limit=1"
```

**Test WhatsApp Webhook:**
```bash
curl "http://localhost:3000/webhook/meta?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

**Test Stripe Keys:**
```bash
curl https://api.stripe.com/v1/payment_intents \
  -u YOUR_SECRET_KEY: \
  -d amount=1000 \
  -d currency=usd
```

---

## Troubleshooting

### "Environment variable not defined"

**Frontend:**
- Ensure variable starts with `VITE_`
- Restart dev server after changing `.env`
- Redeploy on Vercel after changing variables

**Backend:**
- Check `.env` file exists
- Verify `dotenv` is loaded: `require('dotenv').config()`
- Restart server after changes

### "Invalid credentials"

- Double-check you copied the entire key
- Ensure no extra spaces/newlines
- Verify you're using the right environment (test vs live)
- Check key hasn't expired (WhatsApp temp tokens)

### "Supabase connection failed"

- Verify URL format includes `https://`
- Check project isn't paused
- Ensure key matches your project
- Test connection manually (see commands above)

---

## Quick Copy Templates

### .env Template (WhatsApp Bot)

```bash
cat > .env << 'EOF'
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_BUSINESS_ID=
WHATSAPP_APP_SECRET=
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=
PORT=3000
NODE_ENV=development
EOF
```

### .env Template (Frontend)

```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_APP_NAME="Isha's Treat & Groceries"
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=false
EOF
```

---

## Resources

- **Meta Developers**: https://developers.facebook.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Railway Dashboard**: https://railway.app
- **Vercel Dashboard**: https://vercel.com

---

**Need help?** Check the main [DEPLOY_TO_PRODUCTION.md](DEPLOY_TO_PRODUCTION.md) guide.
