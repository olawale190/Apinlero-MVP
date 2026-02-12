# Deploy to Production - Complete Guide

This guide covers deploying your WhatsApp bot to Railway and your frontend to Vercel.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy WhatsApp Bot to Railway](#deploy-whatsapp-bot-to-railway)
3. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
4. [Configure Production Credentials](#configure-production-credentials)
5. [Testing Production](#testing-production)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Tested locally with ngrok successfully
- ✅ Products populated in Supabase
- ✅ GitHub account
- ✅ Railway account (sign up at railway.app)
- ✅ Vercel account (sign up at vercel.com)
- ✅ Production credentials ready:
  - Meta WhatsApp permanent access token
  - Supabase service key
  - Stripe live API keys

---

## Deploy WhatsApp Bot to Railway

Railway is a modern platform that makes deploying Node.js apps simple. We'll deploy your WhatsApp bot here.

### Step 1: Push Code to GitHub

First, ensure your code is in a GitHub repository:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: WhatsApp bot"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/apinlero-whatsapp-bot.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **Login** > Sign in with GitHub
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Choose your `apinlero-whatsapp-bot` repository
6. Railway will auto-detect it's a Node.js project

### Step 3: Configure Environment Variables

In Railway dashboard:

1. Click on your service
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add each variable:

```env
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-permanent-access-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_APP_SECRET=your-app-secret
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
NODE_ENV=production
PORT=3000
```

**Important:**
- Use a **permanent access token** from Meta (not the 24-hour temporary one)
- Keep the same verify token you used in testing
- Use your Supabase **service role key** (not anon key)

### Step 4: Generate Permanent WhatsApp Access Token

The temporary token from testing expires in 24 hours. Here's how to get a permanent one:

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Go to **Business Settings**
3. Click **Users > System Users**
4. Click **Add** to create a new system user
5. Name it: "Apinlero Bot"
6. Role: **Admin**
7. Click **Add Assets**
8. Select your WhatsApp Business Account
9. Check **Manage WhatsApp Business Account**
10. Click **Generate New Token**
11. Select your app
12. Check permissions:
    - `whatsapp_business_management`
    - `whatsapp_business_messaging`
13. Copy the token - this is your permanent access token!

### Step 5: Deploy

Railway will automatically deploy. You can:

1. Watch the build logs in real-time
2. Wait for "Deployment successful" message
3. Note the deployment URL (e.g., `https://your-app.up.railway.app`)

### Step 6: Set Up Custom Domain (Optional)

1. In Railway dashboard, go to **Settings**
2. Click **Generate Domain** for a free Railway subdomain
3. Or add your own custom domain

**Your bot URL will be:**
```
https://apinlero-bot-production.up.railway.app
```

### Step 7: Update Meta Webhook URL

1. Go to [Meta Developers](https://developers.facebook.com)
2. Select your app
3. Go to **WhatsApp > Configuration**
4. Update **Callback URL** to:
```
https://your-railway-url.up.railway.app/webhook/meta
```
5. Use the same verify token
6. Click **Verify and Save**

---

## Deploy Frontend to Vercel

Vercel is optimized for React apps and provides automatic deployments.

### Step 1: Push Frontend to GitHub

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: Apinlero frontend"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/apinlero-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New... > Project**
3. Import your `apinlero-frontend` repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Step 3: Configure Environment Variables

Click on **Environment Variables** and add:

```env
# Supabase
VITE_SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe (Use LIVE keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# App Configuration
VITE_APP_NAME=Isha's Treat & Groceries
VITE_APP_URL=https://your-domain.vercel.app

# Backend API
VITE_API_URL=https://your-railway-url.up.railway.app

# Features
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=true
```

**Where to get Stripe Live keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Live mode** (top right - switch from Test)
3. Go to **Developers > API keys**
4. Copy **Publishable key** (starts with `pk_live_`)

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (usually 2-3 minutes)
3. Vercel will provide a URL like: `https://apinlero-frontend.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings > Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (can take up to 48 hours)

### Step 6: Update App URL

Go back to Vercel > **Settings > Environment Variables**:

Update `VITE_APP_URL` to your actual Vercel URL or custom domain:
```
VITE_APP_URL=https://apinlero.com
```

Then **Redeploy** for changes to take effect.

---

## Configure Production Credentials

### Stripe Webhooks

For production Stripe payments, you need to configure webhooks:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live mode**
3. Go to **Developers > Webhooks**
4. Click **Add endpoint**
5. Enter endpoint URL:
```
https://your-vercel-url.vercel.app/api/stripe-webhook
```
6. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Vercel environment variables:
```
VITE_STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Supabase RLS Policies

Ensure Row Level Security is enabled:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication > Policies**
4. Verify RLS is enabled for all tables:
   - products
   - orders
   - customers
   - businesses
   - messages

Your migrations should have already created these policies. Verify by running:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'orders', 'customers', 'businesses', 'messages');
```

All should show `rowsecurity = true`.

### Environment Security Checklist

- [ ] No `.env` files committed to git
- [ ] `.env` added to `.gitignore`
- [ ] All production keys are different from test keys
- [ ] Supabase service key is only in Railway (server-side)
- [ ] Supabase anon key is in Vercel (client-side)
- [ ] Stripe webhook secret is set
- [ ] Meta app secret is set
- [ ] No hardcoded credentials in code

---

## Testing Production

### Test WhatsApp Bot

1. **Send a message** to your production WhatsApp number
2. **Expected**: Bot responds within 2-3 seconds
3. **Try**: "Show me products"
4. **Check**: Order placement flow works

**Monitor Railway logs:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Test Frontend

1. **Visit** your Vercel URL
2. **Create account** / Login
3. **Browse products** - should load from Supabase
4. **Add to cart** - check cart functionality
5. **Place order** - verify order creation
6. **Check payment** - test Stripe integration

**Monitor Vercel logs:**
- Go to Vercel Dashboard > Your Project > Deployments
- Click on latest deployment
- View **Function Logs** and **Build Logs**

### Test End-to-End Flow

1. Customer messages bot: "I want rice"
2. Bot shows products
3. Customer orders via WhatsApp
4. Order appears in admin dashboard
5. Admin processes order
6. Customer receives update

### Check Database

Go to Supabase Dashboard:

1. **Table Editor > orders** - verify new orders
2. **Table Editor > customers** - check customer records
3. **Table Editor > messages** - see WhatsApp message logs
4. **API Logs** - check for any errors

---

## Troubleshooting

### Railway Issues

**Build fails:**
- Check `package.json` has correct start script
- Verify all dependencies are in `package.json`
- Check build logs for specific errors
- Ensure Node version matches local (add `"engines"` field)

**Bot not responding:**
- Check environment variables are set correctly
- View logs: `railway logs`
- Verify webhook URL in Meta Dashboard
- Check Supabase connection

**Port binding errors:**
- Ensure you're using `process.env.PORT`
- Railway assigns port dynamically

### Vercel Issues

**Build fails:**
- Check build command is correct
- Verify all dependencies are installed
- Check Vite config is correct
- Review build logs for errors

**Environment variables not working:**
- Must prefix with `VITE_` for client-side
- Redeploy after changing variables
- Check variables are set for Production environment

**404 errors:**
- Add `vercel.json` for SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### WhatsApp Issues

**Webhook verification fails:**
- Verify URL is accessible publicly
- Check verify token matches exactly
- Ensure Railway deployment is successful
- Test webhook endpoint manually

**Messages not received:**
- Check webhook is subscribed to 'messages' field
- Verify access token is valid (permanent token)
- Check Railway logs for incoming requests
- Test with Meta's test phone number first

### Stripe Issues

**Payments fail:**
- Verify using LIVE keys (not test keys)
- Check webhook is configured
- Verify webhook secret is correct
- Check Stripe dashboard for error details

---

## Post-Deployment Checklist

### Immediate

- [ ] WhatsApp bot responds to messages
- [ ] Frontend loads correctly
- [ ] Products display in catalog
- [ ] Login/signup works
- [ ] Orders can be created
- [ ] Payments process (if enabled)

### Within 24 Hours

- [ ] Monitor error rates
- [ ] Check database for test orders
- [ ] Verify email notifications (if configured)
- [ ] Test from multiple devices
- [ ] Review logs for warnings

### Within 1 Week

- [ ] Set up monitoring/alerts (Sentry, LogRocket)
- [ ] Configure backups for Supabase
- [ ] Add custom domain
- [ ] Set up SSL certificate
- [ ] Performance optimization
- [ ] Load testing

---

## Scaling & Monitoring

### Add Monitoring

**Sentry (Error Tracking):**
1. Sign up at [sentry.io](https://sentry.io)
2. Create project
3. Add to Railway and Vercel:
```env
SENTRY_DSN=your-sentry-dsn
```

**LogRocket (Session Replay):**
1. Sign up at [logrocket.com](https://logrocket.com)
2. Add to Vercel frontend
3. Install SDK: `npm install logrocket`

### Set Up Alerts

**Railway:**
- Configure notifications in Settings
- Set up health checks
- Monitor resource usage

**Vercel:**
- Enable deployment notifications
- Set up performance alerts
- Monitor bandwidth usage

### Database Backups

**Supabase:**
1. Go to **Settings > Backups**
2. Enable daily backups
3. Configure retention period
4. Test restore process

---

## Maintenance

### Update Dependencies

```bash
# WhatsApp Bot
cd whatsapp-bot
npm update
npm audit fix

# Frontend
cd project
npm update
npm audit fix
```

### Renew Tokens

- Meta access token: Never expires (system user)
- Supabase keys: Don't expire, but rotate periodically
- Stripe keys: Don't expire, but rotate if compromised

### Monitor Costs

- **Railway**: Check usage dashboard, free tier has limits
- **Vercel**: Monitor bandwidth and function invocations
- **Supabase**: Check database size and API requests
- **Stripe**: Review transaction fees

---

## Support Resources

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **Meta WhatsApp**: https://developers.facebook.com/docs/whatsapp
- **Stripe**: https://stripe.com/docs
- **Supabase**: https://supabase.com/docs

---

## Quick Commands Reference

```bash
# Railway
railway login
railway link
railway logs
railway status
railway variables

# Vercel
vercel login
vercel link
vercel logs
vercel env ls
vercel --prod  # Redeploy

# Check deployments
curl https://your-railway-url.up.railway.app/health
curl https://your-vercel-url.vercel.app

# Monitor logs
railway logs --follow
vercel logs --follow
```

---

**Congratulations! Your app is now live in production! 🎉**

Next: Set up monitoring, add custom domains, and start onboarding customers!
