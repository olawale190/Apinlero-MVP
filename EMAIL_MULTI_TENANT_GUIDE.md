# Multi-Tenant Email System Guide

**Date:** January 28, 2026
**Status:** ✅ Implemented (Option 2 - Shared Domain with Reply-To)

---

## Overview

Apinlero now supports **multi-tenant emails** where each business can send branded emails to their customers, and customer replies go directly to the business (not to Apinlero).

### How It Works

**Before (Single-Tenant):**
```
From: Apinlero <noreply@apinlero.com>
Reply-To: (none)
❌ All emails look the same
❌ No way for customers to reply
❌ Not professional for SaaS
```

**After (Multi-Tenant with Reply-To):**
```
From: "Isha's Treat" <noreply@apinlero.com>
Reply-To: info@ishastreat.com
✅ Business name shows in email
✅ Customers can reply directly to business
✅ Professional and branded
```

---

## Quick Start

### 1. Get Resend API Key (2 min)

1. Go to https://resend.com
2. Sign up (free)
3. Create API key
4. Copy key (starts with `re_`)

### 2. Add to Environment (1 min)

Edit `project/.env.local`:

```bash
VITE_RESEND_API_KEY=re_your_key_here
VITE_FROM_EMAIL=noreply@apinlero.com
VITE_BUSINESS_EMAIL=info@apinlero.com
```

### 3. Test It (2 min)

```bash
# Start dev server (if not running)
npm run dev

# Visit email settings page
# http://localhost:5174/email-settings

# Or use the skill
/email-test
```

---

## Usage in Code

### Basic Usage (Auto Multi-Tenant)

All email functions now support optional `businessEmail` and `businessName` parameters:

```typescript
import { sendOrderConfirmationEmail } from './src/lib/email.ts';

// Send order confirmation with business branding
await sendOrderConfirmationEmail({
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  orderId: 'ord_123',
  orderNumber: 'ORD-001',
  items: [{ name: 'Product', quantity: 2, price: 10.00 }],
  total: 20.00,

  // Multi-tenant fields (optional)
  businessEmail: 'info@ishastreat.com',  // ← Customer replies go here
  businessName: "Isha's Treat"           // ← Shows in From field
});
```

**Result:**
- Email appears from: `"Isha's Treat" <noreply@apinlero.com>`
- Customer clicks Reply → email goes to `info@ishastreat.com`

### Using Helper Function

For easier integration with user sessions:

```typescript
import {
  sendOrderConfirmationEmail,
  getBusinessEmailContext
} from './src/lib/email.ts';

// Get business context from current user
const businessContext = getBusinessEmailContext({
  owner_email: user.email,
  business_name: user.businessName
});

// Pass to any email function
await sendOrderConfirmationEmail({
  // ... other fields
  ...businessContext  // Automatically adds businessEmail and businessName
});
```

### All Email Types Support Multi-Tenant

```typescript
// 1. Order Confirmation
await sendOrderConfirmationEmail({
  // ...
  businessEmail: 'owner@business.com',
  businessName: 'Business Name'
});

// 2. Order Status Update
await sendOrderStatusUpdateEmail(
  'customer@example.com',
  'John Doe',
  'ORD-001',
  'confirmed',
  'Your order is confirmed!',
  'owner@business.com',  // businessEmail
  'Business Name'        // businessName
);

// 3. Welcome Email
await sendWelcomeEmail({
  customerEmail: 'new@customer.com',
  customerName: 'Jane',
  businessName: 'My Store',
  businessEmail: 'hello@mystore.com',
  storeUrl: 'https://mystore.apinlero.com'
});

// 4. Low Stock Alert (already has businessEmail/businessName)
await sendLowStockAlertEmail({
  businessEmail: 'owner@business.com',
  businessName: 'Business Name',
  productName: 'Palm Oil',
  currentStock: 3,
  threshold: 5,
  productId: 'prod_123'
});

// 5. Daily Summary (already has businessEmail/businessName)
await sendDailySummaryEmail({
  businessEmail: 'owner@business.com',
  businessName: 'Business Name',
  date: '2026-01-28',
  totalOrders: 15,
  totalRevenue: 450.00,
  lowStockProducts: [],
  topProducts: []
});
```

---

## Architecture

### Option 2: Shared Domain with Reply-To (Current)

**How it works:**
1. All emails sent from verified Apinlero domain: `noreply@apinlero.com`
2. From display name includes business name: `"Isha's Treat" <noreply@apinlero.com>`
3. Reply-To header points to business email: `info@ishastreat.com`
4. Customer clicks Reply → email goes to business

**Benefits:**
- ✅ Works immediately (no domain verification)
- ✅ Professional branding (business name visible)
- ✅ Customer replies go to business
- ✅ FREE (3,000 emails/month)
- ✅ Simple setup (5 minutes)

**Limitations:**
- ⚠️ Email technically comes from Apinlero domain
- ⚠️ Shared sender reputation
- ⚠️ Less professional than custom domain

**Cost:** FREE (Resend free tier: 3,000 emails/month)

### Option 1: Custom Domains (Future Upgrade)

**How it works:**
1. Business verifies their domain with Resend
2. Apinlero stores business Resend API key (encrypted)
3. Emails sent from: `noreply@ishastreat.com`
4. Full branding and control

**Benefits:**
- ✅ Professional (own domain)
- ✅ Independent sender reputation
- ✅ Custom SPF/DKIM records
- ✅ Full email control

**Migration Path:**

```sql
-- Add column for business Resend API keys
ALTER TABLE businesses
ADD COLUMN resend_api_key_encrypted TEXT;
```

```typescript
// Modified sendEmail function
const apiKey = business.resend_api_key || RESEND_API_KEY;
const fromEmail = business.custom_email || FROM_EMAIL;
```

**When to upgrade:**
- Business sending 1,000+ emails/month
- Professional branding critical
- Custom domain already owned

---

## Testing

### Local Testing

1. **Visit Email Settings Page:**
   ```
   http://localhost:5174/email-settings
   ```

2. **Use Email Test Skill:**
   ```bash
   /email-test
   ```

3. **Manual Test:**
   ```typescript
   import { testEmailConfiguration } from './src/lib/email.ts';

   const result = await testEmailConfiguration(
     'your-email@example.com',
     'business@example.com',
     'Test Business'
   );

   console.log(result);
   ```

### Verify Multi-Tenant Works

After receiving test email, check:

- [ ] **From field** shows: `"[Business Name]" <noreply@apinlero.com>`
- [ ] **Reply button** works and goes to business email
- [ ] **Email template** looks professional
- [ ] **Footer** says: "Email sent by [Business] via Apinlero"

**To test Reply-To:**
1. Receive test email
2. Click Reply button
3. Check recipient is business email (not noreply@apinlero.com)

---

## Production Deployment

### Step 1: Add to Vercel Environment Variables

```bash
# Option 1: Via Vercel Dashboard
# Go to: https://vercel.com/apinlero/apinlero
# Settings → Environment Variables → Add

# Option 2: Via CLI
vercel env add VITE_RESEND_API_KEY production
# Paste your key when prompted

vercel env add VITE_FROM_EMAIL production
# Enter: noreply@apinlero.com

vercel env add VITE_BUSINESS_EMAIL production
# Enter: info@apinlero.com
```

### Step 2: Deploy

```bash
# Auto-deploy (if GitHub connected)
git add .
git commit -m "feat: add multi-tenant email system"
git push origin main

# Or manual deploy
/deploy-vercel
```

### Step 3: Test Production

1. Visit: https://app.apinlero.com/email-settings
2. Send test email
3. Verify Reply-To works

---

## Code Changes Summary

### Modified Files

1. **`project/src/lib/email.ts`** (516 lines)
   - Added `EmailOptions` interface with `replyTo` and `businessName`
   - Updated `sendEmail()` to support Reply-To header
   - Added business context to all 5 email functions
   - Added `getBusinessEmailContext()` helper
   - Enhanced `testEmailConfiguration()` with multi-tenant support

2. **`project/.env.local`**
   - Added email configuration section
   - Added VITE_RESEND_API_KEY
   - Added VITE_FROM_EMAIL
   - Added VITE_BUSINESS_EMAIL

3. **`project/.claude/skills/email-test.md`** (NEW)
   - Email testing skill
   - Quick commands for testing

### Breaking Changes

None! All changes are backward compatible:
- `businessEmail` and `businessName` are **optional**
- If not provided, defaults to Apinlero branding
- Existing code continues to work

---

## FAQ

### Q: Do businesses need to verify domains?
**A:** No! With Option 2 (current), all emails come from Apinlero's verified domain.

### Q: Can customers reply to emails?
**A:** Yes! Reply-To header ensures replies go to the business email.

### Q: What appears in the From field?
**A:** Business name + Apinlero domain. Example: `"Isha's Treat" <noreply@apinlero.com>`

### Q: How many emails can we send?
**A:** 3,000/month on Resend free tier. Enough for 50-100 customers.

### Q: Can we upgrade to custom domains later?
**A:** Yes! Migration path documented above (Option 1).

### Q: What if Resend is not configured?
**A:** Emails automatically fallback to n8n webhooks (if configured).

### Q: How do we get business email for current user?
**A:** Use `getBusinessEmailContext()` helper:
```typescript
const context = getBusinessEmailContext({
  owner_email: user.email,
  business_name: user.businessName
});
```

---

## Troubleshooting

### Issue: Emails not sending

**Check configuration:**
```bash
/email-test
```

**Fix:**
1. Ensure VITE_RESEND_API_KEY is set
2. Restart dev server
3. Check Resend dashboard for errors

### Issue: Reply-To not working

**Check email headers:**
- Open email
- View source/headers
- Look for: `Reply-To: business@example.com`

**Note:** All major email clients support Reply-To header.

### Issue: Emails go to spam

**Short-term:**
1. Ask recipient to mark as "Not Spam"
2. Add Apinlero to contacts

**Long-term:**
1. Upgrade to Option 1 (custom domains)
2. Configure SPF/DKIM records
3. Warm up sender reputation

---

## Cost Breakdown

### Resend Pricing

| Tier | Emails/Month | Cost |
|------|--------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20/mo |
| Enterprise | Custom | Custom |

### Apinlero Estimates

| Customers | Emails/Month | Cost |
|-----------|--------------|------|
| 0-50 | ~250 | $0 (FREE) |
| 50-200 | ~1,000 | $0 (FREE) |
| 200-500 | ~2,500 | $0 (FREE) |
| 500-1000 | ~5,000 | $20/mo |
| 1000+ | ~10,000+ | $20/mo |

**You have 12x headroom on free tier!**

---

## Next Steps

1. ✅ Get Resend API key
2. ✅ Add to `.env.local`
3. ✅ Test locally at `/email-settings`
4. ✅ Deploy to production
5. ✅ Add to Vercel env vars
6. ✅ Test production emails

## Related Documentation

- [EMAIL_QUICK_START.md](EMAIL_QUICK_START.md) - 5-minute setup
- [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) - Complete documentation
- [EMAIL_IMPLEMENTATION_SUMMARY.md](EMAIL_IMPLEMENTATION_SUMMARY.md) - Technical details
- [CLAUDE.md](CLAUDE.md) - Project overview

---

**Last Updated:** January 28, 2026
**Version:** 1.0.0
**Implementation:** Multi-Tenant Email System (Option 2)
