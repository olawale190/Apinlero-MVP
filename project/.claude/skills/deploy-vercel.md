# Àpínlẹ̀rọ Deploy Vercel

## Purpose
Deploy the Apinlero frontend (Next.js/Vite React app) to Vercel.

## Usage
```
/deploy-vercel
```

## Prerequisites
- Vercel account connected to GitHub
- Vercel CLI installed (`npm i -g vercel`)
- Project linked to Vercel

## Commands

| Command | Description |
|---------|-------------|
| `/deploy-vercel` | Deploy to production |
| `/deploy-vercel preview` | Create preview deployment |
| `/deploy-vercel status` | Check deployment status |
| `/deploy-vercel logs` | View deployment logs |
| `/deploy-vercel rollback` | Rollback to previous deployment |

## Configuration

### Required Environment Variables (in Vercel Dashboard)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-backend.railway.app
```

### Project Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `project`

## Deployment Steps

### Step 1: Ensure Code is Committed
```bash
git status
git add .
git commit -m "Deploy: [description]"
git push origin main
```

### Step 2: Deploy via CLI
```bash
cd project

# Production deployment
vercel --prod

# Preview deployment
vercel
```

### Step 3: Deploy via Git Push (Automatic)
Vercel auto-deploys when you push to main:
```bash
git push origin main
# Vercel automatically deploys
```

## Vercel CLI Commands

### Link Project
```bash
cd project
vercel link
```

### Check Deployments
```bash
vercel ls
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote [deployment-url]
```

### Environment Variables
```bash
# Add env var
vercel env add VITE_API_URL production

# Pull env vars locally
vercel env pull .env.local

# List env vars
vercel env ls
```

## Pre-Deployment Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Build succeeds | `npm run build` | No errors |
| TypeScript valid | `npm run typecheck` | No type errors |
| Lint passes | `npm run lint` | No lint errors |
| Env vars set | Vercel Dashboard | All vars configured |

## Post-Deployment Verification

### 1. Check Deployment URL
```bash
curl -I https://apinlero.vercel.app
# Should return 200 OK
```

### 2. Test Key Pages
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] API calls succeed

### 3. Check Browser Console
- No JavaScript errors
- No failed network requests
- Supabase connection working

## Troubleshooting

### Build fails with missing dependencies
**Cause:** package.json dependencies not installed
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment variables not working
**Cause:** Vars not prefixed with VITE_ or not set for environment
**Solution:**
1. Frontend vars MUST be prefixed with `VITE_`
2. Check vars are set for Production/Preview/Development
3. Redeploy after adding vars

### 404 on page refresh
**Cause:** SPA routing not configured
**Solution:** Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Supabase connection fails
**Cause:** CORS or wrong API URL
**Solution:**
1. Check Supabase URL in env vars
2. Verify Supabase project allows your Vercel domain
3. Check browser console for specific error

## Vercel Dashboard Links
- [Deployments](https://vercel.com/dashboard)
- [Project Settings](https://vercel.com/[team]/[project]/settings)
- [Environment Variables](https://vercel.com/[team]/[project]/settings/environment-variables)

## Related Skills
- `/deploy-railway` - Deploy backend/bot
- `/env-sync` - Sync environment variables

---
*Apinlero Deploy Vercel Skill v1.0*
