# Email System - Quick Start

**Setup Time**: 5 minutes | **Status**: Production Ready ✅

---

## 🚀 Quick Setup (3 Steps)

### 1. Get Resend API Key
```bash
# Go to: https://resend.com
# Sign up → Get API Key (starts with "re_")
```

### 2. Add to .env
```bash
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_FROM_EMAIL=noreply@apinlero.com
VITE_BUSINESS_EMAIL=info@apinlero.com
```

### 3. Test It
```bash
npm run dev
# Visit: http://localhost:5173/email-settings
# Enter your email → Click "Send Basic Test"
```

✅ Done! All 5 email types are now working.

---

## 📧 Email Types Available

| Email | Trigger | Recipient |
|-------|---------|-----------|
| **Order Confirmation** | New order | Customer |
| **Status Update** | Order status change | Customer |
| **Low Stock Alert** | Manual (inventory) | Business owner |
| **Daily Summary** | Scheduled/Manual | Business owner |
| **Welcome Email** | New signup | New customer |

---

## 🧪 Test All Emails

Visit: `/email-settings`

1. Enter your email address
2. Click each template button:
   - Order Confirmation
   - Low Stock Alert
   - Daily Summary
   - Welcome Email
3. Check your inbox

---

## 📍 Where Emails Are Sent From

**OrdersTable.tsx** (Lines 22-73):
- Order confirmations
- Status updates
- Manual email buttons

**InventoryManager.tsx** (Lines 161-193):
- Low stock alerts (mail icon)

**SignupForm.tsx** (Lines 31-51):
- Welcome emails

---

## 🔧 Troubleshooting

**Emails not sending?**
1. Check `.env` has `VITE_RESEND_API_KEY`
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Test at `/email-settings`

**Emails in spam?**
- Verify domain at Resend (production only)
- Free tier uses Resend's domain (safe)

**Need help?**
- Full guide: [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)
- Resend docs: https://resend.com/docs

---

## 🎨 Email Preview

All emails have:
- ✅ Navy blue gradient header
- ✅ Responsive design (mobile + desktop)
- ✅ Professional layout
- ✅ Clear CTAs
- ✅ Apinlero branding

---

## 💰 Cost

**Free Tier**: 3,000 emails/month (plenty for MVP)

Apinlero needs ~250 emails/month (50 customers × 5 emails)

**You're good to go with free tier! 🎉**

---

## 📦 Production Deployment

### Vercel
```bash
vercel env add VITE_RESEND_API_KEY production
# Paste your API key when prompted
vercel --prod
```

### Verify
1. Visit: https://app.apinlero.com/email-settings
2. Send test email
3. ✅ Done!

---

## 🔗 Useful Links

- **Email Settings UI**: `/email-settings`
- **Setup Guide**: [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)
- **Implementation Details**: [EMAIL_IMPLEMENTATION_SUMMARY.md](EMAIL_IMPLEMENTATION_SUMMARY.md)
- **Get Resend Key**: https://resend.com/api-keys

---

**Status**: All 5 email types working ✅
**Time to setup**: 5 minutes ⏱️
**Monthly cost**: Free (3K emails) 💰
