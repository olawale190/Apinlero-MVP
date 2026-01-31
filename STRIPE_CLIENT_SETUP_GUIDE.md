# Accept Card Payments with Stripe
## Setup Guide for Isha's Treat & Groceries

---

## What is This?

This guide will help you set up **online card payments** for your customers. Once complete, customers can pay for their orders using credit or debit cards directly on your website.

**Time needed:** 15-20 minutes
**Cost:** Free to set up (Stripe charges 1.4% + 20p per transaction)

---

## What You'll Need

- Business email address
- Business bank account details (for receiving payments)
- Government-issued ID (for verification)
- Your business information (address, company number if applicable)

---

## Step-by-Step Setup

### Step 1: Create Your Stripe Account

1. **Go to Stripe's website**
   - Visit: [https://stripe.com](https://stripe.com)
   - Click the **"Start now"** or **"Sign up"** button

2. **Enter your email and create a password**
   - Use your business email address
   - Choose a strong password

3. **Fill in your business information**
   - Business name: **Isha's Treat & Groceries**
   - Business type: Select **Retail** or **E-commerce**
   - Country: **United Kingdom**
   - Currency: **GBP (£)**

4. **Verify your email**
   - Check your inbox for a verification email from Stripe
   - Click the verification link

---

### Step 2: Complete Business Verification

Stripe needs to verify your business to comply with UK regulations.

1. **Add your business address**
   - Enter your registered business address
   - This must match your business registration

2. **Add bank account details**
   - Account number
   - Sort code
   - This is where you'll receive customer payments (usually within 2-3 business days)

3. **Provide Tax Information**
   - If you have a Company Registration Number, enter it
   - If you're a sole trader, provide your UTR (Unique Taxpayer Reference)

4. **Verify your identity**
   - Upload a government-issued ID (passport or driving license)
   - This is a one-time requirement for security

**Note:** Stripe may approve you instantly or may take 1-2 business days to review.

---

### Step 3: Get Your API Keys

Once your account is verified:

1. **Log into Stripe Dashboard**
   - Go to: [https://dashboard.stripe.com](https://dashboard.stripe.com)

2. **Navigate to Developers section**
   - Click **"Developers"** in the top menu
   - Click **"API keys"**

3. **You'll see two types of keys:**

   **Test Keys (for testing):**
   - Publishable key: starts with `pk_test_...`
   - Secret key: starts with `sk_test_...`

   **Live Keys (for real payments):**
   - Publishable key: starts with `pk_live_...`
   - Secret key: starts with `sk_live_...`

4. **Start with TEST keys first**
   - Click "Reveal test key" next to the Secret key
   - Copy both test keys to a safe place (like a password manager)

---

### Step 4: Connect Stripe to Your Apinlero Dashboard

1. **Log into your Apinlero dashboard**
   - Go to your dashboard URL
   - Log in with your credentials

2. **Navigate to Settings**
   - Click the **"Settings"** tab in the navigation menu

3. **Find the Stripe Payment section**
   - You should see "Connect Your Stripe Account"

4. **Enter your Stripe API keys**
   - **Publishable Key:** Paste your `pk_test_...` key
   - **Secret Key:** Paste your `sk_test_...` key

5. **Test the connection**
   - Click **"Test Connection"** button
   - Wait for the success message
   - You should see your Stripe account details

6. **Save your configuration**
   - Click **"Save Configuration"**
   - You'll see a success message

**Important:** Keep your Secret Key private! Never share it with anyone except when entering it in secure systems like Apinlero.

---

### Step 5: Test Your Payment Setup

Before accepting real payments, test that everything works:

1. **Place a test order**
   - Go to your website
   - Add items to cart
   - Go to checkout

2. **Use Stripe's test card**
   - Card number: `4242 4242 4242 4242`
   - Expiry date: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Postcode: Any valid UK postcode (e.g., `SW1A 1AA`)

3. **Complete the payment**
   - The payment should succeed
   - You should receive an order confirmation

4. **Verify in Stripe Dashboard**
   - Go to [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
   - You should see your test payment listed

**If the test works, you're ready for real payments!**

---

### Step 6: Go Live with Real Payments

Once you've tested successfully:

1. **Get your LIVE API keys**
   - Go to Stripe Dashboard → Developers → API keys
   - Find your **Live** keys section
   - Copy both live keys (`pk_live_...` and `sk_live_...`)

2. **Update Apinlero with live keys**
   - Go back to Apinlero → Settings
   - Replace the test keys with live keys
   - Click "Test Connection"
   - Click "Save Configuration"

3. **Make a small test payment**
   - Place a real order for a small amount (e.g., £1)
   - Use your own card to test
   - Check that money arrives in your bank account in 2-3 days

4. **Start accepting customer payments!**
   - You're now ready to accept real card payments
   - Customers can checkout with their credit/debit cards
   - Money will be deposited into your bank account automatically

---

## Understanding Stripe Fees

Stripe charges the following fees for UK card payments:

| Payment Type | Fee |
|--------------|-----|
| UK card | 1.4% + 20p |
| European card | 2.5% + 20p |
| Non-European card | 2.9% + 20p |

**Example:**
- Customer pays: £50.00
- Stripe fee: £0.90 (1.4% + 20p)
- You receive: £49.10

**Note:** These fees are deducted automatically. The remaining amount is deposited to your bank account.

---

## When Do I Get Paid?

- **First payment:** 7-14 days after your first transaction (Stripe's standard verification period)
- **Subsequent payments:** 2-3 business days after the transaction
- **Payout schedule:** You can set this to Daily, Weekly, or Monthly in Stripe Dashboard

**To check payouts:**
- Go to Stripe Dashboard → Balance → Payouts
- You'll see all scheduled and completed payouts

---

## Test vs Live Mode

Stripe has two modes:

### Test Mode (for testing)
- Uses test API keys (`pk_test_...` and `sk_test_...`)
- No real money involved
- Use test cards (4242 4242 4242 4242)
- Perfect for making sure everything works

### Live Mode (for real payments)
- Uses live API keys (`pk_live_...` and `sk_live_...`)
- Real money transactions
- Customer cards are charged
- Always test in Test Mode first!

**Important:** You can toggle between Test and Live mode in your Stripe Dashboard using the toggle switch in the top left.

---

## Common Questions

### Q: Is my money safe with Stripe?
**A:** Yes! Stripe is used by millions of businesses worldwide, including Amazon, Google, and Shopify. They are fully regulated and licensed in the UK.

### Q: What cards can customers use?
**A:** Customers can use:
- Visa
- Mastercard
- American Express
- UK debit cards
- Most international cards

### Q: What if a customer disputes a payment?
**A:** Stripe handles disputes through their dashboard. You'll be notified and can provide evidence. Most disputes are resolved within 2-3 weeks.

### Q: Can I issue refunds?
**A:** Yes! You can issue full or partial refunds directly from your Stripe Dashboard or through your Apinlero dashboard.

### Q: What happens if a payment fails?
**A:** The customer will see an error message and can try again with a different card. You won't be charged for failed payments.

### Q: Do I need a business bank account?
**A:** Stripe recommends using a business bank account, but you can use a personal account if you're a sole trader.

---

## Need Help?

### Stripe Support
- **Help Center:** [https://support.stripe.com](https://support.stripe.com)
- **Email:** support@stripe.com
- **Phone:** Available in Stripe Dashboard (UK support available)

### Apinlero Support
- Contact your Apinlero account manager
- Email: support@apinlero.com
- Documentation: Check your Apinlero dashboard

---

## Security Reminders

✅ **DO:**
- Keep your Secret Key private
- Use strong passwords
- Enable two-factor authentication on your Stripe account
- Regularly check your Stripe Dashboard for unusual activity
- Start with Test Mode before going live

❌ **DON'T:**
- Share your Secret Key with anyone
- Post your API keys online or in public forums
- Give your Stripe login credentials to anyone
- Skip the testing phase

---

## Quick Reference Card

**Stripe Dashboard:** [dashboard.stripe.com](https://dashboard.stripe.com)

**Test Card:**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
```

**Your API Keys:**
- Test Publishable: pk_test_... (get from Stripe Dashboard)
- Test Secret: sk_test_... (get from Stripe Dashboard)
- Live Publishable: pk_live_... (use when ready to go live)
- Live Secret: sk_live_... (use when ready to go live)

**Fees:** 1.4% + 20p per UK card transaction

**Payout Time:** 2-3 business days

---

## Checklist

Use this checklist to track your progress:

- [ ] Created Stripe account
- [ ] Verified email address
- [ ] Completed business verification
- [ ] Added bank account details
- [ ] Uploaded ID verification
- [ ] Got Test API keys from Stripe Dashboard
- [ ] Logged into Apinlero dashboard
- [ ] Entered Test API keys in Apinlero Settings
- [ ] Tested connection (success)
- [ ] Saved configuration
- [ ] Placed test order with test card (4242 4242 4242 4242)
- [ ] Verified test payment in Stripe Dashboard
- [ ] Got Live API keys from Stripe Dashboard
- [ ] Updated Apinlero with Live API keys
- [ ] Made small real payment test
- [ ] Started accepting customer payments!

---

## Next Steps After Setup

Once you're accepting payments:

1. **Monitor your payments**
   - Check Stripe Dashboard regularly
   - Review successful payments
   - Handle any failed payments

2. **Set up email notifications**
   - Stripe can email you for each payment
   - Configure in Stripe Dashboard → Settings → Emails

3. **Review your finances**
   - Download monthly reports from Stripe
   - Track your revenue and fees
   - Keep records for tax purposes

4. **Consider additional features**
   - Apple Pay / Google Pay (can be enabled in Stripe)
   - Subscription billing (for regular customers)
   - Invoice payments (for business customers)

---

**Congratulations!** 🎉

You're now ready to accept online card payments and grow your business!

**Questions?** Contact your Apinlero account manager or Stripe support.

---

*This guide is for Isha's Treat & Groceries | Powered by Apinlero | Payments by Stripe*
