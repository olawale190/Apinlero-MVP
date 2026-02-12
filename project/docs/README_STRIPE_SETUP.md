# Stripe Integration Setup - Complete Package

## 🎯 What's Ready for You

All the code and security is already set up! You just need to add the Stripe API keys from Isha Treat.

---

## 📚 Documentation Files

We've created several guides for you:

### 1. **[ADD_STRIPE_KEYS_HERE.md](./ADD_STRIPE_KEYS_HERE.md)** ⭐ START HERE
   - **Use this first!**
   - Shows exactly where to paste the keys
   - Step-by-step with visual guides
   - Includes troubleshooting

### 2. **[STRIPE_QUICK_START.md](./STRIPE_QUICK_START.md)**
   - Quick reference card
   - What to ask Isha Treat for
   - Test card numbers

### 3. **[STRIPE_SECURITY_SETUP.md](../STRIPE_SECURITY_SETUP.md)**
   - Complete security details
   - How encryption works
   - Production deployment guide

---

## 🛠️ Test Scripts Available

Three scripts to help you test:

### 1. Validate Keys
```bash
node scripts/validate-stripe-keys.js
```
**What it does:**
- ✅ Checks if keys are present
- ✅ Validates key format
- ✅ Tests Stripe API connection
- ✅ Shows account details

### 2. Test Payment Creation
```bash
node scripts/test-payment.js
```
**What it does:**
- 💳 Creates a test £10 payment
- 📝 Shows client secret
- 🎯 Provides test card numbers

### 3. Full Integration Test
```bash
node scripts/test-stripe-integration.js
```
**What it does:**
- 🔍 Database schema check
- 🚀 Edge functions check
- 🔐 Security verification
- 💰 Payment intent creation

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Get Keys from Isha Treat
Ask them for:
- `pk_test_...` (Publishable key)
- `sk_test_...` (Secret key)

From: https://dashboard.stripe.com/apikeys

### Step 2: Add Keys
- **Publishable key** → `.env` file: `VITE_STRIPE_PUBLISHABLE_KEY=`
- **Secret key** → `backend/.env` file: `STRIPE_SECRET_KEY=`
- Enable payments → `.env` file: `VITE_ENABLE_STRIPE_PAYMENTS=true`

### Step 3: Validate
```bash
node scripts/validate-stripe-keys.js
```

---

## 🔒 Security Features (Already Implemented)

You don't need to do anything - these are already working:

✅ **File Security**
- `.env` files secured with 600 permissions
- Both files in `.gitignore`
- Won't be committed to git

✅ **Database Security**
- AES-256 encryption for secret keys
- Row Level Security (RLS) enabled
- Automatic encryption on save
- Audit logging

✅ **Access Control**
- Customers isolated from each other
- Business owners can only access their business
- Frontend has NO access to secret keys

---

## 🧪 Test Cards

Use these when testing payments:

| Card Number         | What Happens   |
|---------------------|----------------|
| 4242 4242 4242 4242 | ✅ Success     |
| 4000 0000 0000 0002 | ❌ Declined    |
| 4000 0025 0000 3155 | 🔐 3D Secure   |

**Additional Details:**
- Expiry: Any future date (12/34)
- CVC: Any 3 digits (123)
- ZIP: Any 5 digits (12345)

---

## 📂 File Locations

### Configuration Files (Where to add keys):
```
project/
├── .env                          👈 Add VITE_STRIPE_PUBLISHABLE_KEY here
└── backend/
    └── .env                      👈 Add STRIPE_SECRET_KEY here
```

### Documentation:
```
project/
├── docs/
│   ├── ADD_STRIPE_KEYS_HERE.md   👈 Start here!
│   ├── STRIPE_QUICK_START.md
│   └── README_STRIPE_SETUP.md    👈 You are here
└── STRIPE_SECURITY_SETUP.md
```

### Test Scripts:
```
project/
└── scripts/
    ├── validate-stripe-keys.js    👈 Run this first
    ├── test-payment.js
    └── test-stripe-integration.js
```

### Integration Code (Already implemented):
```
project/
├── src/
│   ├── lib/stripe.ts              (Frontend Stripe logic)
│   ├── components/
│   │   └── StripePaymentForm.tsx  (Payment form component)
│   └── pages/
│       ├── Checkout.tsx           (Checkout page)
│       └── StripeSettings.tsx     (Admin settings)
└── backend/
    └── src/
        └── index.js               (Backend API with Stripe)
```

---

## 🚀 Workflow

### Testing Phase (Use TEST keys)

1. **Get test keys** from Isha Treat (`pk_test_*`, `sk_test_*`)
2. **Add keys** to `.env` files
3. **Validate** with script: `node scripts/validate-stripe-keys.js`
4. **Start app** and test checkout
5. **Use test cards** (4242 4242 4242 4242)
6. **Verify** in Stripe Dashboard (test mode)

### Production Phase (Use LIVE keys)

1. **Test thoroughly** with test keys first
2. **Get live keys** from Isha Treat (`pk_live_*`, `sk_live_*`)
3. **Update `.env` files** with live keys
4. **Deploy** to production (Vercel/Railway)
5. **Add keys** to deployment environment variables
6. **Test** with small real payment
7. **Go live!** 🎉

---

## ❓ Common Questions

### Q: Do I need to write any code?
**A:** No! All code is already written. Just add the keys.

### Q: Is it safe to test payments?
**A:** Yes! Test mode (`pk_test_*`, `sk_test_*`) doesn't charge real money.

### Q: What if the keys don't work?
**A:** Run `node scripts/validate-stripe-keys.js` to diagnose the issue.

### Q: How do I know if it's working?
**A:** The validation script will show ✅ if everything is correct.

### Q: Can customers use real credit cards in test mode?
**A:** No, only test card numbers work in test mode.

### Q: When should I switch to live keys?
**A:** Only after thoroughly testing with test keys.

---

## 🆘 Troubleshooting

### Problem: "Key validation failed"
**Solution:**
- Check key format (pk_test_ or sk_test_)
- Make sure both keys are from same account
- Verify no extra spaces when pasting

### Problem: "Cannot connect to Stripe API"
**Solution:**
- Check internet connection
- Verify keys are correct
- Try running validation script again

### Problem: "Payments not showing in dashboard"
**Solution:**
- Make sure you're in correct mode (Test vs Live)
- Check Stripe Dashboard at: https://dashboard.stripe.com/test/payments

### Problem: "Frontend can't load Stripe"
**Solution:**
- Check `VITE_ENABLE_STRIPE_PAYMENTS=true`
- Restart dev server after adding keys
- Verify publishable key in `.env`

---

## 📞 Support Flow

1. **Read** [ADD_STRIPE_KEYS_HERE.md](./ADD_STRIPE_KEYS_HERE.md)
2. **Run** `node scripts/validate-stripe-keys.js`
3. **Check** output for specific error messages
4. **Refer** to troubleshooting section above
5. **Review** [STRIPE_SECURITY_SETUP.md](../STRIPE_SECURITY_SETUP.md) for detailed info

---

## ✅ Checklist

Before going live, verify:

- [ ] Both keys added to `.env` files
- [ ] Validation script passes all checks
- [ ] Test payment successful
- [ ] Checkout flow works in browser
- [ ] Order confirmation emails sent
- [ ] Stripe Dashboard shows test payments
- [ ] Customer can see order history
- [ ] Test with all test cards (success, decline, 3D secure)
- [ ] Security setup reviewed
- [ ] Ready to switch to live keys

---

## 🎉 You're All Set!

Everything is ready. Just add the keys from Isha Treat and test!

**Start Here:** [ADD_STRIPE_KEYS_HERE.md](./ADD_STRIPE_KEYS_HERE.md)

---

*Last Updated: February 3, 2026*
*Apinlero SaaS Platform - Stripe Integration v1.0*
