# n8n Supabase Storage Workflow Setup Guide

This guide helps you set up the Supabase Storage workflow in n8n for Apinlero.

## Prerequisites

1. n8n Cloud account or self-hosted n8n instance
2. Supabase project with storage buckets created
3. Supabase API keys

---

## Step 1: Get Your Supabase Credentials

From your Supabase dashboard (Project Settings > API):

| Credential | Where to find it | Usage |
|------------|------------------|-------|
| **Project URL** | Project Settings > API > Project URL | `SUPABASE_URL` |
| **Anon Key** | Project Settings > API > anon public | `SUPABASE_ANON_KEY` |
| **Service Role Key** | Project Settings > API > service_role | `SUPABASE_SERVICE_KEY` |

> **Security Note**: The service_role key bypasses RLS. Keep it secret and only use in n8n (server-side).

---

## Step 2: Configure n8n Environment Variables

In your n8n instance, add these environment variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key
```

### For n8n Cloud:
1. Go to Settings > Variables
2. Add each variable

### For Self-Hosted n8n:
Add to your `.env` file or Docker environment.

---

## Step 3: Import the Workflow

1. In n8n, click **Workflows** > **Add Workflow** > **Import from File**
2. Select `supabase-storage-workflow.json`
3. Click **Import**

---

## Step 4: Create Storage Buckets in Supabase

If not already created, run this SQL in Supabase SQL Editor:

```sql
-- Create buckets (or do via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('apinlero-media', 'apinlero-media', false),
  ('apinlero-documents', 'apinlero-documents', false),
  ('apinlero-products', 'apinlero-products', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for private buckets
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('apinlero-media', 'apinlero-documents'));

CREATE POLICY "Authenticated users can read own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('apinlero-media', 'apinlero-documents'));
```

---

## Step 5: Activate and Test

1. **Activate the workflow** (toggle in top-right)
2. **Copy your webhook URLs** from each webhook node
3. **Test with curl**:

```bash
# Test upload
curl -X POST https://your-n8n.app.n8n.cloud/webhook/storage-upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileData": "SGVsbG8gV29ybGQh",
    "fileType": "text/plain",
    "folder": "test"
  }'

# Test signed URL
curl -X POST https://your-n8n.app.n8n.cloud/webhook/storage-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test/test.txt",
    "expiresIn": 3600
  }'
```

---

## Step 6: Update Your .env

Add the n8n webhook base URL to your Apinlero `.env`:

```
VITE_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook
```

---

## Webhook Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/storage-upload` | POST | Upload file to Supabase |
| `/storage-signed-url` | POST | Get temporary download URL |
| `/whatsapp-media-store` | POST | Store WhatsApp media |

---

## Troubleshooting

### "Unauthorized" error
- Check your `SUPABASE_SERVICE_KEY` is correct
- Ensure the key has not been regenerated

### "Bucket not found" error
- Create the buckets in Supabase dashboard
- Check bucket names match exactly

### Workflow not triggering
- Ensure workflow is activated
- Check webhook URL is correct in your app

---

## UK GDPR Compliance Checklist

- [ ] Supabase project is in EU region (London/Frankfurt)
- [ ] Private buckets used for customer data
- [ ] Signed URLs expire appropriately (1 hour default)
- [ ] RLS policies restrict access
- [ ] Service key kept secret (server-side only)
