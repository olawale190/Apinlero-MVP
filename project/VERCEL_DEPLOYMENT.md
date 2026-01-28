# Vercel Deployment Guide

## Required Environment Variables

To successfully deploy to Vercel, you **MUST** set these environment variables in your Vercel project settings:

### 1. Supabase Configuration (REQUIRED)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Stripe Configuration (REQUIRED for payments)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
```

### 3. Application Configuration (REQUIRED)
```
VITE_APP_NAME=Apinlero
VITE_APP_URL=https://project-apinlero.vercel.app
```

### 4. Optional Configuration
```
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_SENTRY_DSN=your-sentry-dsn (optional, for error tracking)
VITE_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook (optional)
VITE_API_URL=https://your-backend.railway.app (optional)
```

## How to Set Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project (Apinlero-MVP)
3. Go to **Settings** → **Environment Variables**
4. Add each variable one by one:
   - Variable Name: `VITE_SUPABASE_URL`
   - Value: Your actual Supabase URL
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**
5. Repeat for all required variables

### Method 2: Via Vercel CLI
```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# ... add all other variables
```

## Deployment Configuration

The project is configured with:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x (specified in package.json engines field)

## Troubleshooting Common Deployment Failures

### Build Fails with "Missing environment variables"
**Solution**: Make sure ALL required `VITE_*` variables are set in Vercel dashboard

### Build Fails with TypeScript errors
**Solution**: Run `npm run typecheck` locally to identify and fix type errors before pushing

### Build Succeeds but App Shows Blank Page
**Solution**: Check browser console for errors. Usually means:
- Missing Supabase credentials
- CORS issues with Supabase
- Check that Supabase URL and anon key are correct

### Deployment Shows "Internal Server Error"
**Solution**: 
- Check Vercel function logs
- Ensure all environment variables are set correctly
- Verify Supabase database migrations have been run

## Post-Deployment Checklist

After successful deployment:

1. ✅ **Run Database Migrations** (if not done yet):
   ```bash
   # Connect to your production Supabase instance and run:
   # - 20260127000000_add_business_id_to_core_tables.sql
   # - 20260127000001_backfill_business_id.sql
   # - 20260127000002_enable_rls_policies.sql
   # - 20260127010000_add_stripe_encryption.sql
   ```

2. ✅ **Test Critical Features**:
   - User registration/login
   - Password reset flow
   - Stripe payment integration
   - Product catalog loading
   - Category filtering

3. ✅ **Set Up Stripe Webhook** (for production):
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://project-apinlero.vercel.app/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.failed`
   - Copy webhook secret to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

4. ✅ **Enable Custom Domain** (optional):
   - Vercel Dashboard → Domains
   - Add your custom domain (e.g., app.apinlero.com)
   - Update DNS records as instructed

## Quick Redeploy

To trigger a new deployment after fixing issues:

```bash
git add .
git commit -m "fix: update deployment configuration"
git push origin main
```

Vercel will automatically detect the push and start a new deployment.

## View Deployment Logs

```bash
# Via CLI (if installed)
vercel logs --prod

# Via Dashboard
https://vercel.com/apinlero/project/deployments
```

## Support

If deployment continues to fail:
1. Check Vercel deployment logs for specific errors
2. Verify all environment variables are correctly set
3. Test build locally: `npm run build`
4. Ensure Node.js version matches (18.x)
