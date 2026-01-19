# Apinlero MVP - Complete Setup Guide

## Quick Setup (5 Steps)

### Step 1: Seed Products to Database

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `***REMOVED***`
3. Go to **SQL Editor**
4. Copy and paste the contents of `seed-isha-treat-products.sql`
5. Click **Run** to add 70+ products

### Step 2: Set Up Authentication

1. In Supabase SQL Editor, run `setup-auth-and-test-user.sql`
2. Go to **Authentication** > **Users**
3. Click **Add User** > **Create New User**
4. Enter:
   - Email: `isha@ishastreat.co.uk`
   - Password: `IshaTest123!`
   - Check "Auto Confirm User"
5. Click **Create User**

### Step 3: Deploy WhatsApp Bot

```bash
# Navigate to WhatsApp bot folder
cd /Users/user/Downloads/Apinlero_MVP/project/whatsapp-bot

# Deploy to Vercel
npx vercel --prod

# Note the URL (e.g., https://apinlero-whatsapp-bot.vercel.app)
```

After deployment, add environment variables in Vercel Dashboard:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Step 4: Configure Meta Webhook

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Navigate to WhatsApp > Configuration > Webhook
3. Enter:
   - Callback URL: `https://YOUR-VERCEL-URL/webhook`
   - Verify Token: `apinlero-whatsapp-verify-2024`
4. Subscribe to `messages` webhook field

### Step 5: Test the App

```bash
# Start the main app
cd /Users/user/Downloads/Apinlero_MVP/project
npm run dev
```

Open http://localhost:5173

---

## Test Checklist

### Customer Flow (Storefront)
- [ ] Browse products at http://localhost:5173
- [ ] Add items to cart
- [ ] Complete checkout with delivery details
- [ ] See order confirmation

### Owner Flow (Dashboard)
- [ ] Click "Dashboard" or go to login
- [ ] Sign up with `isha@ishastreat.co.uk` / `IshaTest123!`
- [ ] View orders in dashboard
- [ ] See AI insights and analytics

### WhatsApp Flow
- [ ] Send message to WhatsApp Business number
- [ ] Order products via chat
- [ ] Confirm order appears in dashboard

---

## Credentials Summary

| Service | Email/User | Password |
|---------|-----------|----------|
| Owner Login | isha@ishastreat.co.uk | IshaTest123! |
| Supabase | Your account | Your password |
| WhatsApp Verify Token | - | apinlero-whatsapp-verify-2024 |

---

## Files Created

| File | Purpose |
|------|---------|
| `seed-isha-treat-products.sql` | 70+ African/Caribbean grocery products |
| `setup-auth-and-test-user.sql` | Authentication and RLS policies |
| `SETUP_COMPLETE.md` | This guide |

---

## Troubleshooting

### Products not showing?
- Check Supabase > Table Editor > products
- Ensure `is_active` is `true` for products

### Can't log in?
- Make sure you created the user in Supabase Auth
- Check email matches exactly: `isha@ishastreat.co.uk`

### WhatsApp not working?
- Verify webhook URL is correct in Meta dashboard
- Check Vercel logs for errors
- Ensure environment variables are set

### Orders not appearing in dashboard?
- Check browser console for errors
- Verify RLS policies allow reading orders

---

## Next Steps After Testing

1. **Add real product images** - Upload to Supabase Storage
2. **Configure Stripe** - Add payment keys for card payments
3. **Custom domain** - Set up buybizfashion.com or similar
4. **Add more staff** - Create additional user accounts
5. **Go live** - Switch to production WhatsApp credentials

---

## Support

For issues, check:
- Supabase logs: Dashboard > Logs
- Vercel logs: vercel.com/dashboard > Your project > Deployments
- Browser console: F12 > Console tab
