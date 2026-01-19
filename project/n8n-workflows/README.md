# Apinlero n8n Workflow Templates

This folder contains n8n workflow JSON files that you can import directly into your n8n instance.

## Quick Setup

1. Deploy n8n on Railway (see instructions below)
2. Import each workflow JSON file
3. Configure credentials (Resend, Supabase)
4. Set up Supabase webhooks
5. Test each workflow

## Workflows Included

| File | Purpose | Trigger |
|------|---------|---------|
| `01-order-confirmation.json` | Send order confirmation email to customer | Supabase webhook (order INSERT) |
| `02-order-status-update.json` | Notify customer of status changes | Supabase webhook (order UPDATE) |
| `03-new-order-alert.json` | Alert owner of new orders | Supabase webhook (order INSERT) |
| `04-low-stock-alert.json` | Alert owner when stock < 5 | Supabase webhook (product UPDATE) |
| `05-daily-summary.json` | Daily sales report at 6 PM | Scheduled (cron) |
| `06-manual-triggers.json` | Handle manual button clicks from dashboard | Webhook (from Apinlero UI) |

## Deploy n8n on Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy a Template"
4. Search "n8n" → Select official template → Deploy
5. Wait 2-3 minutes
6. Add environment variables:
   - `WEBHOOK_URL` = your Railway URL
   - `N8N_ENCRYPTION_KEY` = random 32-character string

## Import Workflows

1. Open your n8n instance
2. Go to Workflows → Import from File
3. Select each JSON file
4. Configure credentials when prompted

## Required Credentials

### Resend (Email)
- Get API key from [resend.com](https://resend.com)
- In n8n: Credentials → Add → Search "HTTP Request" (or use custom node)

### Supabase
- Project URL: Your Supabase project URL
- Service Role Key: Found in Project Settings → API

## Supabase Webhook Setup

In Supabase Dashboard → Database → Webhooks:

| Name | Table | Events | URL |
|------|-------|--------|-----|
| order-created | orders | INSERT | `https://your-n8n.up.railway.app/webhook/order-created` |
| order-updated | orders | UPDATE | `https://your-n8n.up.railway.app/webhook/order-updated` |
| product-updated | products | UPDATE | `https://your-n8n.up.railway.app/webhook/product-updated` |

## Update Apinlero .env

After deploying n8n, update your Apinlero `.env`:

```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.up.railway.app/webhook
```
