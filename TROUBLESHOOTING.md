# Apinlero Troubleshooting Guide

This document logs all issues encountered during development and their solutions. Reference this before debugging similar problems.

---

## Quick Reference

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Storage bucket not found" | RLS blocking `listBuckets()` | Remove bucket check, upload directly |
| "Permission denied" (storage) | Storage RLS policies | Add storage policies or use service key |
| "Permission denied for table X" | Table RLS enabled | Add table policies or disable RLS |
| "Invalid JWT" | Wrong API key | Check env vars match correct Supabase project |
| Works locally, fails in prod | Vercel env vars outdated | Sync Vercel env vars and redeploy |

---

## Issue Log

### Issue #1: Storage Bucket "Not Found"

**Date**: January 22-23, 2026

**Error Message**:
```
Failed to upload image: Storage bucket "apinlero-products" not found.
Please create it in Supabase Dashboard > Storage.
```

**Symptoms**:
- Bucket exists in Supabase Dashboard
- Bucket visible when logged into Supabase
- Code reports bucket doesn't exist

**Root Cause**:
The `storage.ts` file was calling `listBuckets()` before uploading to verify the bucket exists. However, RLS policies on `storage.buckets` prevented the anon key from listing buckets.

**Original Code** (problematic):
```typescript
// This fails with anon key due to RLS
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(b => b.name === bucket);
if (!bucketExists) {
  return { success: false, error: 'Bucket not found' };
}
```

**Solution**:
Remove the bucket existence check. Upload directly and let Supabase return an error if bucket doesn't exist.

**Fixed Code**:
```typescript
// Just upload directly - Supabase will error if bucket missing
const { data, error } = await supabase.storage
  .from(bucket)
  .upload(filePath, file);
```

**File Changed**: `project/src/lib/storage.ts`

**Prevention**:
- Don't pre-check resources that RLS might block
- Let the actual operation fail with a meaningful error
- Use service role key for admin operations

---

### Issue #2: Storage Upload "Permission Denied"

**Date**: January 23, 2026

**Error Message**:
```
Failed to upload image: Permission denied. Storage RLS policies may not be configured.
```

**Symptoms**:
- Bucket exists and is public
- Upload fails even for authenticated users
- Works with service role key

**Root Cause**:
Storage RLS policies on `storage.objects` were not configured to allow uploads from authenticated users.

**Solution**:
Add storage policies for the bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apinlero-products');
```

**For Testing** (temporary, insecure):
```sql
-- Allow anyone to upload (TESTING ONLY)
CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'apinlero-products');
```

**File Changed**: SQL in Supabase Dashboard

**Prevention**:
- Always create storage policies when creating buckets
- Test uploads after bucket creation
- Document required policies in migration files

---

### Issue #3: Table "Permission Denied"

**Date**: January 23, 2026

**Error Message**:
```
Error saving product: permission denied for table products
```

**Symptoms**:
- Storage upload succeeds
- Database insert fails
- Worked before RLS was enabled

**Root Cause**:
Row Level Security (RLS) was enabled on the `products` table but no policies existed to allow inserts.

**Solution (Production)**:
Add proper RLS policies:

```sql
CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Solution (Testing)**:
Disable RLS temporarily:

```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

**Prevention**:
- Always create RLS policies when enabling RLS
- Test CRUD operations after RLS changes
- Keep a SQL file with all required policies

---

### Issue #4: Wrong Supabase Project

**Date**: January 22, 2026

**Error Message**:
Various - storage not found, data missing, etc.

**Symptoms**:
- Features work in some environments, not others
- Data visible in Supabase Dashboard doesn't appear in app
- Buckets exist in dashboard but app can't find them

**Root Cause**:
Vercel environment variables pointed to a different Supabase project than the one being used for development.

- **Local `.env.local`**: `***REMOVED***.supabase.co` (correct)
- **Vercel env vars**: `***REMOVED***.supabase.co` (wrong)

**Solution**:
1. Identify correct Supabase project URL
2. Update all environment variables to match:

```bash
# Check current Vercel env vars
npx vercel env ls production

# Remove old value
npx vercel env rm VITE_SUPABASE_URL production --yes

# Add correct value
npx vercel env add VITE_SUPABASE_URL production
# Enter: https://***REMOVED***.supabase.co

# Redeploy
npx vercel --prod --yes
```

**Prevention**:
- Add environment validation on app startup (see SECURITY_GUIDE.md)
- Document the correct Supabase project in CLAUDE.md
- Use a single source of truth for env vars

**Correct Supabase Project**: `***REMOVED***.supabase.co` (ApinleroMVP)

---

### Issue #5: WhatsApp Media Not Stored

**Date**: January 23, 2026

**Error Message**:
No error - media just wasn't being saved

**Symptoms**:
- WhatsApp bot receives image messages
- `mediaId` appears in logs
- No files in `apinlero-media` bucket
- No records in `media_files` table

**Root Cause**:
The `server.js` webhook handler extracted `mediaId` from incoming messages but never passed it to `handleIncomingMessage()`. The message handler had no access to the media ID or access token needed to download media from Meta's API.

**Solution**:
1. Update `server.js` to pass `accessToken` and `mediaId` to handler
2. Add `handleMediaMessage()` function to download and store media
3. Add `uploadMedia()` and `logMediaFile()` to supabase-client.js

**Files Changed**:
- `whatsapp-bot/src/server.js` - Pass accessToken to handler
- `whatsapp-bot/src/message-handler.js` - Add media handling
- `whatsapp-bot/src/supabase-client.js` - Add upload functions

**Prevention**:
- When adding new data fields, trace them through the entire flow
- Add logging at each step to verify data is being passed
- Test with actual WhatsApp messages, not just unit tests

---

### Issue #6: Local Changes Don't Affect Production

**Date**: January 22, 2026

**Error Message**:
N/A - confusion about why fixes weren't working

**Symptoms**:
- Fixed code locally
- Pushed to GitHub
- Production still shows old behavior

**Root Cause**:
Multiple factors:
1. Vercel env vars are separate from local `.env.local`
2. Changes to `.env.local` don't trigger Vercel redeploy
3. Browser caching old JavaScript

**Solution**:
1. Update Vercel env vars via CLI or dashboard
2. Trigger redeploy: `npx vercel --prod --yes`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Prevention**:
- Remember: Local env ≠ Production env
- Always check Vercel env vars when debugging prod issues
- Document deployment process

---

### Issue #7: RLS Blocking Service Operations

**Date**: January 23, 2026

**Error Message**:
Various permission errors on backend operations

**Symptoms**:
- WhatsApp bot can't create orders
- Backend can't update inventory
- Service role key seems ineffective

**Root Cause**:
Backend was using anon key instead of service role key.

**Solution**:
Verify backend uses service role key:

```javascript
// whatsapp-bot/src/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // NOT anon key!
);
```

**Prevention**:
- Backend/server code should always use service role key
- Frontend/browser code should always use anon key
- Add startup validation to check key type

---

## Debugging Checklist

When something isn't working, check in this order:

### 1. Environment Variables
```bash
# Local
cat .env.local | grep SUPABASE

# Vercel
npx vercel env ls production
```

### 2. Correct Supabase Project
- URL should contain: `***REMOVED***`
- Check in Supabase Dashboard which project has your data

### 3. RLS Policies
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check existing policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';
```

### 4. Storage Policies
```sql
-- Check storage policies
SELECT policyname, cmd, tablename
FROM pg_policies
WHERE schemaname = 'storage';
```

### 5. Browser Cache
- Hard refresh: Cmd+Shift+R
- Open DevTools > Network > Disable cache
- Try incognito window

### 6. Deployment Status
```bash
# Check Vercel deployment
npx vercel ls

# Check Railway logs
railway logs
```

---

## Common Patterns

### Pattern: "Works locally, fails in production"
1. Check Vercel env vars match local
2. Redeploy after env var changes
3. Hard refresh browser

### Pattern: "Permission denied"
1. Check which key is being used (anon vs service)
2. Check RLS is configured for the operation
3. Check storage policies for upload/download

### Pattern: "Resource not found"
1. Verify correct Supabase project
2. Check if RLS is blocking visibility
3. Verify resource actually exists in dashboard

### Pattern: "Data not saving"
1. Check browser console for errors
2. Check Supabase logs
3. Verify RLS allows INSERT
4. Check for missing required fields

---

## Useful Diagnostic Commands

```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  "https://***REMOVED***.supabase.co/rest/v1/products?limit=1"

# Check Railway bot status
curl https://web-production-63e51.up.railway.app/health

# View Railway logs
railway logs --tail

# Test storage upload (browser console)
const { data, error } = await supabase.storage
  .from('apinlero-products')
  .upload('test.txt', new Blob(['test']), { contentType: 'text/plain' });
console.log({ data, error });
```

---

## Contact & Escalation

If you've tried everything in this guide:
1. Check Supabase status: https://status.supabase.com
2. Check Vercel status: https://vercel.com/status
3. Review recent commits for breaking changes
4. Ask in the team chat with:
   - Error message
   - Steps to reproduce
   - What you've already tried

---

*Last Updated: January 23, 2026*
*Add new issues as they're discovered and solved*
