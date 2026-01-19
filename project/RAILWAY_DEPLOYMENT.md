# Àpínlẹ̀rọ Railway Deployment Guide

## Project Structure

```
project/
├── src/                    # Frontend React application
├── backend/                # Backend Express.js API
│   ├── src/
│   │   └── index.js       # Main API server
│   ├── package.json
│   ├── railway.json       # Backend Railway config
│   └── .env.example
├── railway.json            # Frontend Railway config
└── package.json
```

## Step-by-Step Railway Deployment

### Prerequisites
1. Create a Railway account at https://railway.app
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

### Step 1: Create Railway Project

```bash
# Create a new Railway project
railway init

# Or link to existing project
railway link
```

### Step 2: Deploy Backend Service

```bash
cd backend

# Initialize as a separate Railway service
railway init --name apinlero-backend

# Set environment variables
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=your_supabase_url
railway variables set SUPABASE_ANON_KEY=your_supabase_anon_key
railway variables set STRIPE_SECRET_KEY=your_stripe_secret_key
railway variables set FRONTEND_URL=https://your-frontend.railway.app

# Deploy
railway up
```

### Step 3: Deploy Frontend Service

```bash
cd ..  # Back to project root

# Initialize as frontend service
railway init --name apinlero-frontend

# Set environment variables
railway variables set VITE_SUPABASE_URL=your_supabase_url
railway variables set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
railway variables set VITE_API_URL=https://your-backend.railway.app

# Deploy
railway up
```

### Step 4: Configure Custom Domains (Optional)

1. Go to Railway Dashboard
2. Select your service
3. Go to Settings → Domains
4. Add custom domain or use Railway-provided domain

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (optional) | `eyJ...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.railway.app` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `VITE_API_URL` | Backend API URL | `https://your-backend.railway.app` |
| `VITE_APP_NAME` | App display name | `Isha's Treat` |

## Alternative: Single Command Deployment

Using Railway's monorepo support, you can deploy both services from a single repository:

1. Create a `railway.toml` in root:

```toml
[build]
builder = "nixpacks"

[[services]]
name = "frontend"
rootDir = "."
buildCommand = "npm install && npm run build"
startCommand = "npx serve dist -s -l $PORT"

[[services]]
name = "backend"
rootDir = "./backend"
buildCommand = "npm install"
startCommand = "npm start"
```

## Stripe Webhook Setup

After deployment:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.railway.app/api/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret
5. Add to Railway: `railway variables set STRIPE_WEBHOOK_SECRET=whsec_...`

## Monitoring

- Railway Dashboard: View logs, metrics, deployments
- Backend health: `https://your-backend.railway.app/health`

## Troubleshooting

### CORS Errors
Ensure `FRONTEND_URL` is set correctly in backend environment variables.

### Build Failures
1. Check Node version compatibility (requires Node 18+)
2. Verify all dependencies are listed in package.json
3. Check Railway build logs for specific errors

### Database Connection Issues
1. Verify Supabase credentials are correct
2. Check Supabase project status is active
3. Ensure RLS policies allow API access

## Support

For deployment issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
