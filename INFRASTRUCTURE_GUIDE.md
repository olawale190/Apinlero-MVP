# Apinlero Infrastructure & Scaling Guide

This document outlines the optimized infrastructure setup for Apinlero, designed to scale as you build a steady customer base while maintaining cost efficiency.

---

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APINLERO INFRASTRUCTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              CUSTOMERS
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ WhatsApp │  │   Web    │  │  Phone   │
              │          │  │  Store   │  │  Orders  │
              └────┬─────┘  └────┬─────┘  └────┬─────┘
                   │             │             │
                   ▼             ▼             │
              ┌──────────┐  ┌──────────┐       │
              │  TWILIO  │  │  VERCEL  │       │
              │ WhatsApp │  │ Frontend │       │
              │   API    │  │ Hosting  │       │
              └────┬─────┘  └────┬─────┘       │
                   │             │             │
                   ▼             ▼             ▼
              ┌────────────────────────────────────┐
              │            RAILWAY                  │
              │  ┌────────────┐  ┌──────────────┐  │
              │  │ WhatsApp   │  │   Backend    │  │
              │  │    Bot     │  │     API      │  │
              │  └─────┬──────┘  └──────┬───────┘  │
              └────────┼────────────────┼──────────┘
                       │                │
                       ▼                ▼
              ┌────────────────────────────────────┐
              │            SUPABASE                 │
              │  ┌────────────┐  ┌──────────────┐  │
              │  │ PostgreSQL │  │   Storage    │  │
              │  │  Database  │  │   Buckets    │  │
              │  └────────────┘  └──────────────┘  │
              │  ┌────────────┐  ┌──────────────┐  │
              │  │    Auth    │  │  Real-time   │  │
              │  └────────────┘  └──────────────┘  │
              └────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐      ┌────────────────┐
              │   NEO4J AURA   │      │      N8N       │
              │ Knowledge Graph│      │  Automation    │
              │ Product Aliases│      │  - Storage     │
              └────────────────┘      │  - Emails      │
                                      │  - Reports     │
                                      │  - Backups     │
                                      └────────────────┘
```

---

## Service Breakdown & Costs

### Current Monthly Costs (Minimum Setup)

| Service | Tier | Monthly Cost | Purpose |
|---------|------|--------------|---------|
| **Supabase** | Free | £0 | Database, Storage, Auth |
| **Railway** | Hobby | £5 | WhatsApp Bot, Backend API |
| **Vercel** | Hobby | £0 | Frontend Hosting |
| **Neo4j Aura** | Free | £0 | Product Knowledge Graph |
| **Twilio** | Pay-as-you-go | ~£10-50 | WhatsApp Messaging |
| **n8n** | Self-hosted/Cloud | £0-20 | Automation |
| **TOTAL** | | **£15-75/month** | |

### Scaling Costs (As You Grow)

| Customers | Supabase | Railway | Twilio | Total/Month |
|-----------|----------|---------|--------|-------------|
| 0-50 | Free (£0) | Hobby (£5) | ~£20 | **£25** |
| 50-200 | Free (£0) | Hobby (£5) | ~£50 | **£55** |
| 200-500 | Pro (£25) | Pro (£20) | ~£100 | **£145** |
| 500-1000 | Pro (£25) | Pro (£20) | ~£200 | **£245** |
| 1000+ | Pro+ (£50+) | Pro (£20+) | ~£400+ | **£470+** |

---

## n8n Storage Orchestration System

n8n acts as the central orchestrator managing all storage and automation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    N8N STORAGE ORCHESTRATION                     │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │     N8N      │
                         │  Workflows   │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   STORAGE     │      │   SCHEDULED   │      │    ALERTS     │
│   WORKFLOWS   │      │    TASKS      │      │  & REPORTS    │
├───────────────┤      ├───────────────┤      ├───────────────┤
│ • File Upload │      │ • Daily 6 AM  │      │ • Low Stock   │
│ • WhatsApp    │      │   Reports     │      │ • Expiry      │
│   Media Store │      │ • Nightly     │      │   Warning     │
│ • Receipt     │      │   Backups     │      │ • Storage     │
│   Generation  │      │ • Cleanup     │      │   Limit Alert │
│ • Signed URLs │      │   Old Files   │      │ • Order       │
└───────┬───────┘      └───────┬───────┘      │   Confirm     │
        │                      │              └───────┬───────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                      ┌────────────────┐
                      │    SUPABASE    │
                      │    STORAGE     │
                      ├────────────────┤
                      │ apinlero-media │ ← WhatsApp images
                      │ apinlero-docs  │ ← Receipts, Reports
                      │ apinlero-prods │ ← Product images
                      └────────────────┘
```

### Available n8n Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Unified Storage** | `unified-storage-orchestrator.json` | Webhook | Central file management |
| **Daily Operations** | `daily-operations-workflow.json` | Schedule | Reports, backups, alerts |
| **Email Automation** | `supabase-storage-workflow.json` | Webhook | Order confirmations |

### n8n Webhook Endpoints

```
POST /storage/upload          → Upload any file
POST /storage/whatsapp-media  → Store WhatsApp media
POST /storage/generate-receipt → Create PDF receipt
POST /storage/backup          → Trigger manual backup
GET  /storage/stats           → Get storage statistics
POST /manual-order-email      → Send order confirmation
POST /manual-stock-alert      → Low stock notification
POST /manual-expiry-alert     → Expiry warning
POST /manual-daily-summary    → Daily business report
```

---

## Storage Strategy

### Bucket Organization

| Bucket | Visibility | Contents | Retention |
|--------|------------|----------|-----------|
| `apinlero-media` | Private | WhatsApp images, voice notes | 90 days |
| `apinlero-documents` | Private | Receipts, invoices, reports | 2 years |
| `apinlero-products` | Public | Product catalog images | Permanent |

### Storage Limits & Optimization

**Free Tier Limits:**
- Supabase: 1GB storage
- Estimated capacity: ~10,000 images or ~500 hours of voice notes

**Optimization Strategies:**
1. Compress images before upload (max 500KB)
2. Auto-delete WhatsApp media after 90 days
3. Generate thumbnails for large images
4. Use signed URLs (expire in 1 hour) for private files

---

## Scaling Milestones

### Phase 1: Launch (0-50 Customers)
**Cost: ~£25/month**

```
✅ Current Setup - No changes needed
- Supabase Free (500MB DB, 1GB storage)
- Railway Hobby (£5/month)
- Vercel Free
- Neo4j Free (50K nodes)
```

**Actions:**
- [ ] Ensure Supabase is in EU region
- [ ] Set up storage buckets
- [ ] Activate n8n workflows
- [ ] Configure daily backups

### Phase 2: Growth (50-200 Customers)
**Cost: ~£55/month**

```
⚠️ Watch for:
- Supabase project pausing (7-day inactivity)
- Storage approaching 1GB limit
- WhatsApp message volume
```

**Actions:**
- [ ] Set up uptime monitoring (ping Supabase every 6 hours)
- [ ] Implement image compression
- [ ] Consider Supabase Pro if hitting limits

### Phase 3: Scaling (200-500 Customers)
**Cost: ~£145/month**

```
🔄 Upgrades Needed:
- Supabase Pro (£25/month) - Required for 24/7 uptime
- Railway Pro (£20/month) - Better performance
- Consider dedicated Twilio number
```

**Actions:**
- [ ] Upgrade Supabase to Pro
- [ ] Apply for Twilio verified business
- [ ] Set up advanced analytics
- [ ] Consider CDN for product images

### Phase 4: Scale (500+ Customers)
**Cost: £250+/month**

```
🚀 Enterprise Considerations:
- Supabase Team/Enterprise
- Multiple Railway services
- Dedicated WhatsApp Business API
- Custom domain emails
```

---

## Environment Variables Checklist

### Required for All Services

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...  # Server-side only!

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxxxx

# Stripe (when ready)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# n8n
N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook

# App
VITE_APP_URL=https://apinlero.vercel.app
VITE_API_URL=https://your-backend.railway.app
```

---

## UK GDPR Compliance Checklist

### Data Storage
- [ ] Supabase project in EU region (London/Frankfurt)
- [ ] Private buckets for customer data
- [ ] Signed URLs expire appropriately
- [ ] Service keys kept server-side only

### Data Processing
- [ ] Privacy Policy created
- [ ] Customer consent mechanism
- [ ] Data deletion process documented
- [ ] Data Processing Agreement with Supabase (Pro plan)

### Security
- [ ] RLS enabled on all tables
- [ ] API rate limiting configured
- [ ] HTTPS everywhere
- [ ] Regular backups (automated via n8n)

---

## Monitoring & Alerts

### Set Up These Monitors

| What to Monitor | Tool | Alert Threshold |
|-----------------|------|-----------------|
| Railway uptime | UptimeRobot (free) | Down > 1 min |
| Supabase DB size | n8n scheduled check | > 400MB |
| Storage usage | n8n scheduled check | > 800MB |
| API response time | Vercel Analytics | > 2s |
| Error rates | Railway logs | > 5/hour |

### n8n Alert Workflow

The daily operations workflow includes:
- Low stock alerts (products below threshold)
- Expiry warnings (products expiring in 7 days)
- Storage usage alerts (approaching limits)

---

## Quick Reference Commands

### Deploy Updates

```bash
# Frontend (Vercel - auto deploys from git)
git push origin main

# WhatsApp Bot (Railway)
cd whatsapp-bot && railway up

# Run database migration
# Copy SQL from supabase_storage_migration.sql to Supabase SQL Editor
```

### Test Services

```bash
# Test WhatsApp bot health
curl https://your-bot.railway.app/health

# Test n8n webhook
curl -X POST https://your-n8n.cloud/webhook/storage/stats

# Test Supabase connection
curl https://xxxxx.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `project/src/lib/storage.ts` | Enhanced storage functions with tracking |
| `project/src/lib/n8n-storage.ts` | n8n webhook triggers |
| `project/n8n-workflows/unified-storage-orchestrator.json` | Central storage workflow |
| `project/n8n-workflows/daily-operations-workflow.json` | Scheduled tasks |
| `project/n8n-workflows/SETUP_GUIDE.md` | n8n setup instructions |
| `project/supabase_storage_migration.sql` | Database tables for tracking |
| `INFRASTRUCTURE_GUIDE.md` | This document |

---

## Next Steps

1. **Immediate (This Week)**
   - [ ] Check Supabase region (must be EU)
   - [ ] Create storage buckets in Supabase
   - [ ] Run `supabase_storage_migration.sql`
   - [ ] Import n8n workflows

2. **Short Term (This Month)**
   - [ ] Activate n8n cloud or self-host
   - [ ] Test WhatsApp media storage flow
   - [ ] Set up daily backup workflow
   - [ ] Create privacy policy

3. **Medium Term (3 Months)**
   - [ ] Monitor usage patterns
   - [ ] Optimize based on actual data
   - [ ] Plan for Supabase Pro upgrade
   - [ ] Consider dedicated WhatsApp number

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **n8n Docs**: https://docs.n8n.io
- **Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **UK ICO GDPR Guide**: https://ico.org.uk/for-organisations/guide-to-data-protection/

---

*Last Updated: January 2026*
*Version: 1.0*
