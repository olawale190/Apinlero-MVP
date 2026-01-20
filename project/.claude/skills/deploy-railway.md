# Àpínlẹ̀rọ Deploy Railway

## Purpose
Deploy the Apinlero WhatsApp bot and backend services to Railway.

## Usage
```
/deploy-railway
```

## Prerequisites
- Railway account connected to GitHub
- Railway CLI installed (`npm i -g @railway/cli`)
- Project linked to Railway

## Commands

| Command | Description |
|---------|-------------|
| `/deploy-railway` | Deploy all services |
| `/deploy-railway bot` | Deploy WhatsApp bot only |
| `/deploy-railway backend` | Deploy backend API only |
| `/deploy-railway status` | Check deployment status |
| `/deploy-railway logs` | View deployment logs |
| `/deploy-railway rollback` | Rollback to previous deployment |

## Railway Services

| Service | Directory | URL |
|---------|-----------|-----|
| WhatsApp Bot | `whatsapp-bot/` | `web-production-63e51.up.railway.app` |
| Backend API | `project/backend/` | `backend-xxx.up.railway.app` |
| Knowledge Graph | `project/knowledge-graph/` | `knowledge-xxx.up.railway.app` |

## Configuration

### WhatsApp Bot Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
PORT=3000
```

### Backend API Environment Variables
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_xxx
```

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
# Login to Railway
railway login

# Link to project (first time)
railway link

# Deploy current directory
railway up

# Deploy with specific service
railway up --service whatsapp-bot
```

### Step 3: Deploy via Git Push (Automatic)
Railway auto-deploys when you push to main if connected to GitHub.

## Railway CLI Commands

### Login
```bash
railway login
```

### Link Project
```bash
railway link
# Select your project from the list
```

### Deploy
```bash
# Deploy from current directory
railway up

# Deploy specific service
railway up --service whatsapp-bot
```

### View Logs
```bash
# Real-time logs
railway logs

# Logs for specific service
railway logs --service whatsapp-bot
```

### Environment Variables
```bash
# List variables
railway variables

# Add variable
railway variables set KEY=value

# Open variables in browser
railway variables --open
```

### Open Dashboard
```bash
railway open
```

### Run Command in Service
```bash
railway run npm test
```

## Pre-Deployment Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Code committed | `git status` | Clean working tree |
| Dependencies up to date | `npm install` | No errors |
| Local test passes | `npm start` | Server starts |
| Env vars set | Railway Dashboard | All vars configured |

## Post-Deployment Verification

### 1. Check Health Endpoint
```bash
curl https://web-production-63e51.up.railway.app/health
```

Expected:
```json
{
  "status": "ok",
  "version": "3.0.0 (Multi-Tenant)"
}
```

### 2. Check Logs
```bash
railway logs --service whatsapp-bot
```

### 3. Test Webhook
```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{"from":"test","content":"hello"}'
```

## Troubleshooting

### Build fails - npm ci error
**Cause:** Missing package-lock.json
**Solution:**
```bash
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Service not starting
**Cause:** Missing env vars or wrong start command
**Solution:**
1. Check Railway logs for specific error
2. Verify all required env vars are set
3. Check Procfile or railway.json start command

### Port binding error
**Cause:** Hardcoded port instead of using PORT env var
**Solution:** Use `process.env.PORT` in your server:
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
```

### Supabase connection timeout
**Cause:** Missing SUPABASE_SERVICE_KEY or wrong URL
**Solution:**
1. Check SUPABASE_URL and SUPABASE_SERVICE_KEY are set
2. Use service role key, not anon key (for server-side)
3. Verify Supabase project is active

### Neo4j connection fails
**Cause:** Wrong URI format or credentials
**Solution:**
1. Use `neo4j+s://` prefix for Aura
2. Verify NEO4J_PASSWORD is correct
3. Check Neo4j Aura instance is running

## Railway Dashboard
- [Dashboard](https://railway.app/dashboard)
- [Project Settings](https://railway.app/project/[project-id]/settings)
- [Deployments](https://railway.app/project/[project-id]/deployments)

## Rollback Procedure

1. Go to Railway Dashboard
2. Select your service
3. Click on Deployments tab
4. Find the previous working deployment
5. Click "Redeploy" on that deployment

Or via CLI:
```bash
railway open
# Navigate to Deployments and redeploy previous version
```

## Related Skills
- `/deploy-vercel` - Deploy frontend
- `/env-sync` - Sync environment variables
- `/test-webhook` - Test after deployment

---
*Apinlero Deploy Railway Skill v1.0*
