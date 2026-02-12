# 🔑 Add Your Stripe Keys Here

## Quick Setup (3 Simple Steps)

Once you get the Stripe API keys from Isha Treat, follow these steps:

---

## Step 1: Add Publishable Key to Frontend

**File to edit:** `.env` (in the main project folder)

**Location:** `/Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/.env`

**What to add:**
```bash
# Find this line:
VITE_STRIPE_PUBLISHABLE_KEY=

# Replace it with (paste the pk_test_ or pk_live_ key):
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_FROM_ISHA_TREAT_HERE
```

**Also change this line:**
```bash
# Find:
VITE_ENABLE_STRIPE_PAYMENTS=false

# Change to:
VITE_ENABLE_STRIPE_PAYMENTS=true
```

---

## Step 2: Add Secret Key to Backend

**File to edit:** `backend/.env` (in the backend folder)

**Location:** `/Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/backend/.env`

**What to add:**
```bash
# Find this line:
STRIPE_SECRET_KEY=

# Replace it with (paste the sk_test_ or sk_live_ key):
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_FROM_ISHA_TREAT_HERE
```

⚠️ **IMPORTANT**: This is the SECRET key - NEVER share it or commit it to git!

---

## Step 3: Test Your Setup

After adding both keys, run this command to verify everything works:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
node scripts/validate-stripe-keys.js
```

This will:
- ✅ Check that both keys are present
- ✅ Validate the key format
- ✅ Test connection to Stripe API
- ✅ Show you the Stripe account details

---

## Visual Guide

### Frontend .env File Structure

```bash
VITE_SUPABASE_URL=https://gafoezdpaotwvpfldyhc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration (Frontend - Publishable Key Only)
# Get from Isha Treat: pk_test_... or pk_live_...
# IMPORTANT: Only the PUBLISHABLE key goes here, NEVER the secret key!
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_HERE    👈 PASTE PUBLISHABLE KEY HERE
VITE_ENABLE_STRIPE_PAYMENTS=true                   👈 CHANGE TO true

# Resend Email Configuration
VITE_RESEND_API_KEY=re_ZP6YnEgp_G9NqZXrxN9tx5y4Eo6vzMGf2
...
```

### Backend .env File Structure

```bash
# Àpínlẹ̀rọ Backend Environment Variables
# SECURITY: This file should NEVER be committed to version control!

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://gafoezdpaotwvpfldyhc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Configuration
# IMPORTANT: The SECRET key (sk_test_* or sk_live_*) goes here - NEVER in frontend!
# Get from Isha Treat or Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_PASTE_HERE              👈 PASTE SECRET KEY HERE
# Webhook secret (get after setting up webhook endpoint in Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=
```

---

## After Adding Keys

### Test the Integration

Run the validation script:
```bash
node scripts/validate-stripe-keys.js
```

If successful, you'll see:
```
✅ All checks passed! Your Stripe keys are configured correctly.
```

### Create a Test Payment

Test payment creation:
```bash
node scripts/test-payment.js
```

This creates a test payment intent and shows you:
- Payment Intent ID
- Client Secret
- Test card numbers to use

### Start Your Application

```bash
# Start the frontend
npm run dev

# In another terminal, start the backend
cd backend
npm start
```

---

## Test Cards to Use

Once everything is running, use these test card numbers:

| Card Number         | Result         |
|---------------------|----------------|
| 4242 4242 4242 4242 | ✅ Success     |
| 4000 0000 0000 0002 | ❌ Declined    |
| 4000 0025 0000 3155 | 🔐 3D Secure   |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

---

## Troubleshooting

### Keys Not Working?

1. **Check the key format:**
   - Publishable key should start with `pk_test_` or `pk_live_`
   - Secret key should start with `sk_test_` or `sk_live_`

2. **Make sure both keys match:**
   - Both should be TEST (`_test_`) or both LIVE (`_live_`)
   - Don't mix test and live keys!

3. **Verify the keys are from the same Stripe account:**
   - Get both keys from the same place: https://dashboard.stripe.com/apikeys

4. **Run the validation script:**
   ```bash
   node scripts/validate-stripe-keys.js
   ```

### Still Having Issues?

Check:
- [ ] Keys are pasted correctly (no extra spaces)
- [ ] `.env` file is saved after editing
- [ ] Application was restarted after adding keys
- [ ] Backend server is running
- [ ] No firewall blocking Stripe API

---

## Security Reminders

✅ **DO:**
- Use test keys first before live keys
- Keep secret keys in backend only
- Restart app after adding keys
- Test with test cards before real cards

❌ **DON'T:**
- Commit `.env` files to git (already in .gitignore ✓)
- Share secret keys with anyone
- Use secret keys in frontend code
- Mix test and live keys

---

## Next Steps After Setup

1. ✅ Keys added and validated
2. ✅ Test payment successful
3. ✅ App running with Stripe enabled
4. 📱 Test the full checkout flow
5. 📧 Verify order confirmation emails
6. 🎉 Ready for Isha Treat customers!

---

**Need Help?** Check the full documentation:
- [STRIPE_SECURITY_SETUP.md](../STRIPE_SECURITY_SETUP.md) - Complete security guide
- [STRIPE_QUICK_START.md](./STRIPE_QUICK_START.md) - Quick reference

**Test Scripts:**
- `node scripts/validate-stripe-keys.js` - Validate key configuration
- `node scripts/test-payment.js` - Create test payment
- `node scripts/test-stripe-integration.js` - Full integration test
