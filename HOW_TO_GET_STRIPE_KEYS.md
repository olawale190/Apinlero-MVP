# 🔑 How to Get Your Stripe API Keys

## If You DON'T Have a Stripe Account Yet

### Step 1: Create Your Stripe Account

1. Go to **https://stripe.com**
2. Click the **"Sign up"** button (top right)
3. Fill in your details:
   - Email address
   - Your name
   - Password
4. Click **"Create account"**

### Step 2: Skip the Onboarding (For Now)

After signing up, Stripe might ask you to:
- Add business details
- Verify your identity
- Add bank account

**YOU CAN SKIP ALL OF THIS FOR TESTING!**
- Look for "Skip" or "Do this later" buttons
- You only need to complete activation for LIVE payments
- Test mode works immediately without activation

### Step 3: Get to Your Dashboard

1. You should now be at: https://dashboard.stripe.com/test/dashboard
2. Look for the toggle in the top right that says **"Test mode"**
3. Make sure it's ON (should be blue/purple)

---

## Getting Your API Keys (Test Mode)

### Step 1: Navigate to API Keys

1. In your Stripe Dashboard, look at the left sidebar
2. Click on **"Developers"**
3. Click on **"API keys"**
4. Or go directly to: **https://dashboard.stripe.com/test/apikeys**

### Step 2: Copy Your Publishable Key

1. You'll see a section called **"Publishable key"**
2. It starts with: `pk_test_`
3. Click the copy icon or select and copy the entire key
4. **This key is already in your .env file** ✅

Example: `pk_test_51SwKJPDMxHrApO1G2BedB6p3Db336zsZLWEFsJ35eT9POakGdkRJpPmB404HOekqWLRsNbEMH00x22lslDoos6uQ00jEiUNsJB`

### Step 3: Reveal and Copy Your Secret Key

1. Below that, you'll see **"Secret key"**
2. It will be hidden (shown as `sk_test_••••••••••••••••`)
3. Click the **"Reveal test key"** button
4. The full key will appear (starts with `sk_test_`)
5. **COPY THIS ENTIRE KEY** - you'll need it for the database

Example format: `sk_test_51SwKJPDMxHrApO1G...` (will be much longer)

### Step 4: Keep These Keys Safe

⚠️ **IMPORTANT SECURITY NOTES:**

- **Publishable Key** (`pk_test_`): Safe to use in frontend/browser ✅
- **Secret Key** (`sk_test_`): NEVER share, NEVER commit to git, NEVER expose to browser ❌

The secret key is like a password to your Stripe account!

---

## What to Do With These Keys

### Publishable Key (pk_test_*)
✅ **Already configured!** It's in your `.env` file

### Secret Key (sk_test_*)
You need to add this to your database. I'll help you with that next!

---

## Visual Guide

```
┌─────────────────────────────────────────────────┐
│  Stripe Dashboard > Developers > API Keys       │
├─────────────────────────────────────────────────┤
│                                                  │
│  Standard keys                                   │
│  ─────────────                                   │
│                                                  │
│  Publishable key                                 │
│  pk_test_51SwKJ... [Copy button]               │
│  ✅ This is already in your .env                │
│                                                  │
│  Secret key                                      │
│  sk_test_•••••••••  [Reveal test key button]   │
│  ⬆️ Click this to see the full key             │
│  📋 Copy this - you'll need it!                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "I can't find the Developers menu"
- Look at the LEFT sidebar in your Stripe Dashboard
- It should be near the bottom
- If you don't see it, try refreshing the page

### "It's asking me to activate my account"
- **You don't need to!** Just click "Skip" or "Do this later"
- Test mode works without activation
- You only need to activate for real payments

### "My keys look different"
- Test keys start with: `pk_test_` and `sk_test_`
- Live keys start with: `pk_live_` and `sk_live_`
- Make sure you're in **TEST MODE** (toggle at top right)

### "I accidentally closed the revealed key"
- No problem! Just click "Reveal test key" again
- The key doesn't change

---

## Quick Checklist

- [ ] Created Stripe account or logged in
- [ ] In TEST MODE (toggle on)
- [ ] Found API keys page
- [ ] Copied publishable key (pk_test_*) - Already done ✅
- [ ] Revealed and copied secret key (sk_test_*)
- [ ] Kept secret key safe (don't share it!)

---

## Next Steps

Once you have both keys:
1. Keep them in a secure note or password manager temporarily
2. Let me know you have them
3. I'll help you add the secret key to your database (it will be encrypted automatically!)

---

**Need help?** Let me know which step you're stuck on!
