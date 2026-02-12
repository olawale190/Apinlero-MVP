# Client Onboarding - Stripe Payment Setup

This folder contains everything you need to onboard clients and set up their Stripe payment processing.

## 📁 Files in This Folder

| File | Purpose |
|------|---------|
| [STRIPE_KEYS_REQUEST_EMAIL.md](STRIPE_KEYS_REQUEST_EMAIL.md) | Professional email template to request Stripe keys from clients |
| [VISUAL_GUIDE_STRIPE_KEYS.md](VISUAL_GUIDE_STRIPE_KEYS_MD) | Step-by-step visual guide to help clients find their Stripe keys |
| [setup-stripe-for-client.sh](setup-stripe-for-client.sh) | Script to add client's Stripe keys to the database |
| README.md | This file - overview and instructions |

---

## 🚀 Quick Start Guide

### Step 1: Request Stripe Keys from Client

1. Open [STRIPE_KEYS_REQUEST_EMAIL.md](STRIPE_KEYS_REQUEST_EMAIL.md)
2. Copy the email template
3. Send it to your client (e.g., Isha's Treat)
4. Include the [VISUAL_GUIDE_STRIPE_KEYS.md](VISUAL_GUIDE_STRIPE_KEYS.md) as an attachment or link

### Step 2: Receive Keys Securely

When the client sends you their keys, they should send:
- **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
- **Secret Key** (starts with `sk_test_...` or `sk_live_...`)

Via one of these secure methods:
- Password-protected document (email + WhatsApp password)
- Encrypted email
- WhatsApp direct message

### Step 3: Add Keys to Database

Once you receive the keys:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/client-onboarding
./setup-stripe-for-client.sh
```

The script will:
1. Prompt you for the business slug (e.g., `ishas-treat`)
2. Prompt you for the Publishable Key
3. Prompt you for the Secret Key
4. Validate the keys
5. Add them to the database
6. Show you next steps

### Step 4: Test Payment Flow

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
npm run dev
```

Then:
1. Go to the client's store (e.g., `http://localhost:5173?business=ishas-treat`)
2. Add items to cart
3. Go to checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete the payment
6. Verify payment appears in their Stripe dashboard

### Step 5: Notify Client

Send them a confirmation:
```
Subject: ✅ Payment Processing is Now Live!

Hi Isha's Treat Team,

Great news! Your Stripe payment integration is now complete and tested.

Your customers can now make secure payments on your store:
https://ishas-treat.apinlero.com

What you can do:
1. View payments in your Stripe dashboard: https://dashboard.stripe.com
2. Check your order dashboard: https://ishas-treat.apinlero.com/dashboard
3. Payments will be deposited to your bank account (as configured in Stripe)

If you have any questions, feel free to reach out!

Best regards,
Apinlero Team
```

---

## 📋 Complete Workflow Example

### For Isha's Treat:

**1. Initial Request (Day 1)**
- Send [STRIPE_KEYS_REQUEST_EMAIL.md](STRIPE_KEYS_REQUEST_EMAIL.md) to Info@ishastreatandgroceriescom.uk
- Include visual guide
- Wait for their response

**2. Receive Keys (Day 2-3)**
- Client creates/logs into Stripe account
- Client sends you keys via password-protected document or WhatsApp
- You save keys securely

**3. Setup (Day 3)**
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/client-onboarding
./setup-stripe-for-client.sh

# When prompted:
# Business slug: ishas-treat
# Publishable Key: pk_test_[their key]
# Secret Key: sk_test_[their key]
```

**4. Test (Day 3)**
- Run local dev server
- Test payment with `4242 4242 4242 4242`
- Verify payment in their Stripe dashboard
- Verify order appears in Apinlero

**5. Go Live (Day 3 or later)**
- If using test keys initially, request live keys when ready
- Run setup script again with live keys
- Inform client they can now accept real payments

---

## 🔒 Security Best Practices

### When Receiving Keys:
- ✅ **DO** use password-protected documents with password sent separately
- ✅ **DO** use encrypted email (ProtonMail, etc.)
- ✅ **DO** use WhatsApp for quick transfer (delete after saving)
- ❌ **DON'T** accept keys via plain email
- ❌ **DON'T** accept keys via SMS
- ❌ **DON'T** store keys in plain text files on your computer

### After Setup:
- ✅ **DO** delete any temporary files with keys
- ✅ **DO** delete WhatsApp messages after saving
- ✅ **DO** confirm with client that setup is complete
- ✅ **DO** advise client to regenerate keys if they suspect compromise

### In the Future:
- ⚠️ **TODO**: Implement encryption for `stripe_secret_key_encrypted` column
- ⚠️ **TODO**: Set up key rotation reminders
- ⚠️ **TODO**: Add keys to Token Manager

---

## 🛠️ Troubleshooting

### "Business not found" error
```bash
# Check if business exists
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
supabase db execute -c "SELECT id, slug, name FROM businesses WHERE slug = 'ishas-treat';"
```

### "Invalid key format" error
- Make sure publishable key starts with `pk_test_` or `pk_live_`
- Make sure secret key starts with `sk_test_` or `sk_live_`
- Both keys must be test OR both must be live (can't mix)

### Payment fails in test
- Check Edge Function logs: `supabase functions logs create-payment-intent`
- Verify keys are correctly saved in database
- Test with Stripe test card: `4242 4242 4242 4242`

### Client can't find their keys
- Send them the [VISUAL_GUIDE_STRIPE_KEYS.md](VISUAL_GUIDE_STRIPE_KEYS.md)
- Offer to do a screen-share call
- Check if they have the correct Stripe account permissions

---

## 📊 Track Client Setup Status

### Recommended: Add to Token Manager

After setting up Stripe keys for a client:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/token-manager
node check-tokens.js --add
```

When prompted:
- **Token name**: `Isha's Treat Stripe Keys`
- **Service**: `Stripe`
- **Type**: `API Keys`
- **Expiration date**: `2099-12-31` (Stripe keys don't expire, set far future)
- **Notify days**: `365`
- **Notes**: `Test keys - upgrade to live when ready`

---

## 📞 Client Contact Information

### Isha's Treat
- **Email**: Info@ishastreatandgroceriescom.uk
- **Phone**: +44 7935 238972
- **Business Slug**: `ishas-treat`
- **Store URL**: https://ishas-treat.apinlero.com
- **Status**: Pending Stripe setup

---

## ✅ Checklist Per Client

For each new client:

- [ ] Send Stripe keys request email
- [ ] Receive keys securely
- [ ] Run `setup-stripe-for-client.sh`
- [ ] Test payment flow locally
- [ ] Add keys to Token Manager
- [ ] Confirm with client
- [ ] Setup Stripe webhook (if not done)
- [ ] Test live transaction (if using live keys)
- [ ] Send completion confirmation to client

---

## 📚 Additional Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Apinlero Security Deployment Guide](../SECURITY_FIXES_COMPLETED.md)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Edge Function logs: `supabase functions logs create-payment-intent`
2. Verify database connection: `supabase db execute -c "SELECT * FROM businesses WHERE slug = 'client-slug';"`
3. Test with Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
4. Review security fixes documentation

---

**Last Updated**: February 3, 2026
