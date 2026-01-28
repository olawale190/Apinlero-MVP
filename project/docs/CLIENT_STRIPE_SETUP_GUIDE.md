# Stripe Payment Setup Guide for Apinlero

**Version:** 1.0
**Last Updated:** January 27, 2026
**Time Required:** 15-20 minutes

---

## Overview

### What is Stripe?

Stripe is a secure payment processing platform that lets your business accept card payments online. When you connect Stripe to your Apinlero store, your customers can pay with credit and debit cards, and the money goes directly into your business bank account.

### Why Connect Stripe to Your Apinlero Store?

✅ **Accept payments 24/7** - Your customers can pay online anytime
✅ **100% of revenue is yours** - You receive all payment proceeds (minus Stripe's fees)
✅ **Secure and compliant** - Stripe handles all card security (PCI DSS Level 1)
✅ **Professional checkout** - Give customers a smooth payment experience
✅ **Automated processing** - No manual card entry or payment tracking needed
✅ **One dashboard** - Track all payments in both Stripe and Apinlero

### What You'll Achieve After Setup

By the end of this guide, you'll have:
- Your own Stripe account connected to your Apinlero store
- The ability to accept test payments (practice mode)
- Knowledge of how to switch to live payments (real money)
- Understanding of how to manage payments in both dashboards

### How Much Does Stripe Cost?

**Stripe Fees (standard UK pricing):**
- 1.5% + 20p per successful UK card payment
- 2.9% + 20p per non-UK/international card payment

**Example:** A £100 order costs £1.70 in Stripe fees. You receive £98.30.

**Important:** Apinlero does not take a cut of your payment revenue. You receive 100% of the order total (minus Stripe's processing fees). Your Apinlero subscription is separate.

### How Long Does Setup Take?

- **Initial setup with test mode:** 15-20 minutes (this guide)
- **Business verification (for live payments):** 1-5 business days (Stripe reviews your documents)
- **Going live:** 5-10 minutes (switching from test to live keys)

---

## Before You Begin

Make sure you have everything ready before starting:

### Prerequisites Checklist

- [ ] **Active Apinlero account** - You should already be logged into your Apinlero dashboard
- [ ] **Business registration details** - Your registered business name and address
- [ ] **Business bank account** - Bank account in your business name (for receiving payouts)
- [ ] **Government-issued ID** - Passport or driver's license (for business verification)
- [ ] **15-20 minutes** - Time to complete initial setup without interruptions

### What You'll Need Later (For Going Live)

- Business registration certificate or proof of incorporation
- Recent bank statement showing business name and account details
- Tax registration document (VAT certificate, UTR number, etc.)

> ℹ️ **Note:** You don't need these documents right now. You can practice in test mode first, then submit verification documents when you're ready to accept real payments.

---

## Step 1: Create Your Stripe Account

### 1.1 Visit Stripe Website

1. Open your web browser
2. Go to [https://stripe.com](https://stripe.com)
3. In the top right corner, click the **"Sign up"** button (it's usually blue or purple)

### 1.2 Enter Your Email and Create Password

You'll see a sign-up form:

| Field | What to Enter |
|-------|---------------|
| **Email address** | Your business email (you'll use this to log into Stripe) |
| **Full name** | Your full legal name |
| **Country** | Where your business is registered (e.g., United Kingdom) |
| **Password** | Strong password (at least 8 characters) |

4. Click **"Create account"** button

### 1.3 Verify Your Email

1. Check your email inbox for a message from Stripe
2. Look for subject line like "Verify your Stripe email address"
3. Click the **"Verify email address"** link in the email
4. This will take you back to Stripe and confirm your email

### 1.4 Enter Your Business Details

After verifying your email, Stripe will ask about your business:

#### Business Information:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Business name** | Your registered business name | "Isha's Treat & Groceries" |
| **Business type** | Type of business you run | Individual, Company, Non-profit |
| **Industry** | What you sell | Retail, Food & Beverage, etc. |
| **Business description** | Brief description | "Local grocery and treat shop" |

#### Business Address:

Enter your business's registered address exactly as it appears on official documents.

| Field | What to Enter |
|-------|---------------|
| **Street address** | Business street address |
| **City** | Business city |
| **Postal code** | Business postcode |
| **Country** | United Kingdom (or your country) |

5. Click **"Continue"** or **"Next"**

### 1.5 Add Your Phone Number

1. Enter your mobile phone number (with country code)
2. Choose verification method: **SMS** or **Voice call**
3. Enter the 6-digit code you receive
4. Click **"Verify"**

### 1.6 Skip Optional Steps (For Now)

Stripe may ask you to add:
- Bank account details
- Product information
- Payment methods

**You can skip these for now.** We just need to get your API keys first. You'll complete the full setup when you're ready to go live.

Look for text like **"I'll do this later"** or **"Skip"** and click it.

### 1.7 Welcome to Stripe!

🎉 Congratulations! You now have a Stripe account.

You should see your **Stripe Dashboard** - this is the main page where you'll manage payments. You can always access this at [https://dashboard.stripe.com](https://dashboard.stripe.com).

---

## Step 2: Get Your Test API Keys

API keys are like passwords that let Apinlero communicate with your Stripe account. You need two keys: a **Publishable Key** (safe to share) and a **Secret Key** (keep private).

### 2.1 Navigate to API Keys Page

1. Look at the **left sidebar** in your Stripe Dashboard
2. Click on **"Developers"** (it has a code icon `</>` next to it)
3. In the submenu that appears, click **"API keys"**

**Can't find it?** The Developers section is usually near the bottom of the left sidebar.

### 2.2 Understanding Test Mode vs Live Mode

At the top right of your Stripe Dashboard, you'll see a toggle switch:

- **Test mode** = Practice with fake cards, no real money (switch is usually grey or blue)
- **Live mode** = Real payments with real money (switch is usually orange or green)

> ⚠️ **Important:** Make sure you're in **TEST MODE** first (the switch should show "Test mode" or "Viewing test data"). We'll use test mode to practice before accepting real payments.

If you see "Live mode", click the toggle to switch to test mode.

### 2.3 Copy Your Publishable Key

On the API keys page, you'll see a section called **"Standard keys"** or **"API keys"**.

#### Publishable Key:

1. Find the key labeled **"Publishable key"**
2. It starts with `pk_test_` (the "test" part means it's a test key)
3. The full key looks like: `pk_test_51AbC1234dEf5678GhIjKlMnOpQrStUvWxYz...`
4. Click the **copy icon** (📋) next to it, or select the text and copy it

> ℹ️ **Safe to share:** The publishable key is safe to expose. Customers' browsers will use it, but it can't access sensitive data.

**Keep this copied!** You'll need to paste it into Apinlero in a few minutes. Consider pasting it into a notepad temporarily.

### 2.4 Reveal and Copy Your Secret Key

#### Secret Key:

1. Scroll down to find **"Secret key"**
2. It will show as hidden: `sk_test_••••••••••••••••••••••••••••••••`
3. Click **"Reveal test key token"** or the small link that says "Reveal"
4. The key will appear - it starts with `sk_test_`
5. The full key looks like: `sk_test_51AbC1234dEf5678GhIjKlMnOpQrStUvWxYz...`
6. Click the **copy icon** (📋) or select and copy the text

> ⚠️ **KEEP SECRET!** Your secret key is like your bank password. **NEVER share it with anyone.** Don't email it, don't post it online, don't commit it to code repositories. Treat it like your ATM PIN.

**Keep this copied too!** You'll paste it into Apinlero next.

### 2.5 API Keys Checklist

Before moving to the next step, confirm you have:

- [ ] Publishable key copied (starts with `pk_test_`)
- [ ] Secret key copied (starts with `sk_test_`)
- [ ] Both keys are TEST keys (both have `_test_` in them)

> ⚠️ **Important:** Both keys must match modes. If one is test (`_test_`) and one is live (`_live_`), the connection will fail.

---

## Step 3: Connect Stripe to Your Apinlero Store

Now let's connect your Stripe account to your Apinlero store by entering those API keys.

### 3.1 Log Into Apinlero Dashboard

1. Open a new browser tab (keep Stripe open in the other tab)
2. Go to your Apinlero dashboard URL
3. If you're not logged in, enter your email and password
4. Click **"Sign In"**

### 3.2 Navigate to Stripe Settings

Once logged in:

1. Look at the **dashboard navigation tabs** at the top or left side
2. Find and click the **"Settings"** tab
   - It may have a gear icon (⚙️) or settings icon next to it
3. You'll see a settings page with Stripe configuration options

**Alternative navigation:**
- Some dashboards have a sidebar menu - look for **"Settings"** there
- Or look for **"Integrations"** → **"Stripe Payments"**

### 3.3 Find Stripe Configuration Section

On the Settings page, you should see a section called:
- **"Stripe Settings"**
- Or **"Payment Configuration"**
- Or **"Stripe Integration"**

This section has form fields for entering your API keys.

### 3.4 Enter Your Publishable Key

1. Find the field labeled **"Publishable Key"**
   - It has help text that says: "Starts with pk_test_ (testing) or pk_live_ (production)"
2. **Paste your publishable key** (the one starting with `pk_test_`)
3. Make sure there are no extra spaces before or after the key

### 3.5 Enter Your Secret Key

1. Find the field labeled **"Secret Key"**
   - It may be a password field (shows dots instead of text for security)
   - Help text says: "Keep this secret! Never share or commit to version control"
2. **Paste your secret key** (the one starting with `sk_test_`)
3. Make sure there are no extra spaces before or after the key

> 💡 **Tip:** Some fields have a "show/hide" toggle (eye icon 👁️) next to the Secret Key field. Click it to see the text you pasted and verify it's correct.

### 3.6 Leave Optional Fields Empty (For Now)

You may see additional fields:

- **Account ID** - Leave blank (it will auto-populate after testing)
- **Webhook Secret** - Leave blank (optional, we'll cover this in Step 10)

### 3.7 Test Connection Before Saving

**This is the most important step!** Before saving, let's verify the keys work.

1. Look for a button labeled **"Test Connection"** or **"Verify Keys"**
2. Click it
3. Wait a few seconds while Apinlero validates your keys

#### What Happens During Test:

Apinlero sends a secure request to Stripe with your keys to verify:
- ✅ Both keys are valid
- ✅ Both keys are in the same mode (both test or both live)
- ✅ The keys have the correct permissions
- ✅ Stripe can be reached from your Apinlero account

#### Success Message:

If the test succeeds, you'll see a **green success message** like:
- ✅ "Stripe connection successful!"
- ✅ "Connected to Stripe account: [Your Business Name]"
- ✅ "Test passed - ready to save"

The **Account ID** field should auto-fill with something like `acct_1AbC2DeF3GhI4JkL`.

#### Error Message:

If the test fails, you'll see a **red error message** like:
- ❌ "Invalid secret key"
- ❌ "Keys must be in the same mode (both test or both live)"
- ❌ "Could not connect to Stripe"

**If you see an error,** see the [Troubleshooting section](#troubleshooting) below.

### 3.8 Save Configuration

Once the test connection succeeds:

1. Click the **"Save Configuration"** or **"Save Settings"** button
2. You'll see a confirmation message like "Stripe settings saved successfully"
3. The page may show a **connection status badge**:
   - ✅ **Connected** (green)
   - The badge may also say **Test Mode** (to indicate you're using test keys)

🎉 **Congratulations!** Your Stripe account is now connected to Apinlero!

### 3.9 Connection Status

After saving, you should see:

| Status Indicator | Meaning |
|-----------------|---------|
| ✅ **Connected** | Stripe is linked and working |
| 🧪 **Test Mode** | You're using test keys (practice mode) |
| 🔴 **Not Connected** | No Stripe keys configured yet |
| ⚠️ **Connection Error** | Keys configured but not working (check troubleshooting) |

---

## Step 4: Test Your Payment Setup

Before going live with real money, let's make sure everything works in test mode.

### 4.1 Use Stripe Test Cards

In test mode, you must use special test card numbers. **Real cards will not work in test mode.**

#### Test Card Numbers:

| Card Number | Purpose | Expected Result |
|-------------|---------|----------------|
| `4242 4242 4242 4242` | Successful payment | Payment succeeds every time ✅ |
| `4000 0025 0000 3155` | Requires 3D Secure | Triggers authentication prompt |
| `4000 0000 0000 9995` | Declined card | Payment fails (insufficient funds) ❌ |
| `4000 0000 0000 0002` | Declined card | Payment fails (card declined) ❌ |

**For most tests, use:** `4242 4242 4242 4242`

#### Test Card Details:

When entering test card information, use these details:

| Field | Value |
|-------|-------|
| **Card number** | `4242 4242 4242 4242` |
| **Expiry date** | Any future date (e.g., 12/28) |
| **CVC** | Any 3 digits (e.g., 123) |
| **Postal code** | Any postal code (e.g., SW1A 1AA) |
| **Cardholder name** | Any name (e.g., Test Customer) |

> ℹ️ **Important:** These test cards only work in test mode. Once you switch to live mode, you'll need real cards.

### 4.2 Place a Test Order

1. Open your Apinlero storefront (the page your customers see)
   - You can find the link in your dashboard, usually something like:
   - `https://[your-store].apinlero.com` or
   - `https://apinlero.com/store/[your-store-name]`

2. **Add items to cart**
   - Browse your products
   - Add a few items to your cart
   - Proceed to checkout

3. **Enter customer details**
   - Fill in delivery name and address
   - Enter a test phone number
   - Choose delivery or collection

4. **Select payment method**
   - Choose **"Pay with Card"** or **"Credit/Debit Card"**
   - You should see the Stripe payment form

5. **Enter test card details**
   - Card number: `4242 4242 4242 4242`
   - Expiry: `12/28`
   - CVC: `123`
   - Postal code: `SW1A 1AA`

6. **Complete the order**
   - Click **"Pay Now"** or **"Complete Order"**
   - Wait for confirmation

### 4.3 Verify in Apinlero Dashboard

After placing the test order:

1. Go back to your **Apinlero Dashboard**
2. Click on the **"Orders"** or **"Overview"** tab
3. You should see your test order appear:
   - Order status: **Pending** or **Paid**
   - Payment status: **Paid** ✅
   - Amount: The total you ordered

> ℹ️ **Timing:** Orders usually appear within 1-2 seconds. If it doesn't appear immediately, refresh the page.

### 4.4 Verify in Stripe Dashboard

Let's also check that the payment appears in Stripe:

1. Go back to your **Stripe Dashboard** tab (https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (check the toggle at top right)
3. Click **"Payments"** in the left sidebar
4. You should see your test payment:
   - Amount: Same as the order
   - Status: **Succeeded** ✅
   - Description: May include your order ID
   - Test badge: Shows this is a test payment

5. Click on the payment to see details:
   - Card: ending in `4242`
   - Logs: Shows payment events
   - Metadata: May include customer info and order details

### 4.5 Test Multiple Times

To make sure everything works reliably:

1. Place 2-3 more test orders
2. Try different amounts (small and large orders)
3. Try the "3D Secure required" card (`4000 0025 0000 3155`) - you'll see an authentication popup
4. Try a declining card (`4000 0000 0000 9995`) - the payment should fail gracefully

> ✅ **Success indicator:** All successful test orders appear in both Apinlero and Stripe dashboards within seconds.

### 4.6 Understanding Test Mode Payments

**Important notes about test mode:**

- 💸 **No real money moves** - These are practice payments only
- 🧪 **Test data is separate** - Test payments don't mix with live payments
- 🔄 **You can reset** - Test payments can be deleted without consequence
- 📊 **Full functionality** - Everything works exactly like live mode

**You can practice as much as you want in test mode without any cost or risk.**

---

## Step 5: Complete Business Verification (For Going Live)

Before you can accept real payments (live mode), Stripe needs to verify your business identity. This is required by law and helps prevent fraud.

### 5.1 Why Business Verification is Required

Financial regulations require payment processors to verify:
- ✅ You're a legitimate business
- ✅ You have the right to accept payments
- ✅ The business bank account belongs to you

**This is normal and required for all businesses using Stripe.**

### 5.2 When to Submit Verification

You have two options:

**Option A: Submit now** (Recommended)
- Start verification while practicing in test mode
- Processing takes 1-5 business days
- You'll be ready to go live faster

**Option B: Submit later**
- Practice in test mode first
- Submit verification when you're ready to launch
- You won't be able to accept real payments until verified

> 💡 **Recommendation:** Submit verification now so it's processing while you test. This way, when you're ready to go live, you're already approved.

### 5.3 Required Documents Checklist

Gather these documents before starting:

#### For All Businesses:

- [ ] **Government-issued ID** - Passport, driver's license, or national ID card
- [ ] **Proof of business address** - Recent utility bill, bank statement, or lease agreement
- [ ] **Business registration document** - Certificate of incorporation or business registration

#### For Limited Companies:

- [ ] **Company registration number**
- [ ] **VAT registration** (if applicable)
- [ ] **Directors' information** (names, dates of birth, addresses)

#### For Sole Traders/Individuals:

- [ ] **Proof of personal address** - Recent utility bill or bank statement
- [ ] **National Insurance number** or **Unique Taxpayer Reference (UTR)**

#### For Bank Account Verification:

- [ ] **Bank statement** - Showing business name and account number (dated within 3 months)
- [ ] **Bank account details** - Sort code and account number

### 5.4 How to Submit Verification in Stripe

1. Go to your **Stripe Dashboard** (https://dashboard.stripe.com)
2. Look for a notification or banner at the top that says:
   - "Complete your account setup"
   - "Verify your business"
   - Or similar message
3. Click **"Complete account setup"** or **"Start verification"**

**Alternative navigation:**
1. Click **"Settings"** in the left sidebar (bottom of the menu)
2. Click **"Business settings"** or **"Account details"**
3. Look for sections marked as "incomplete" or "verification required"
4. Click **"Complete"** or **"Verify"**

### 5.5 Fill Out Business Information

You'll be asked to provide or confirm:

#### Personal Information (Account Owner):

- Full legal name
- Date of birth
- Home address
- Phone number
- Email address

#### Business Information:

- Legal business name (as registered)
- Business address
- Business type (sole trader, limited company, partnership, etc.)
- Industry/business category
- Website URL (if you have one)
- Business phone number
- Tax ID / VAT number / Company registration number

#### Representative Information:

For companies, you'll need details for:
- Directors
- People with significant control (PSC)
- People who can sign on behalf of the business

**For each person:**
- Full name
- Date of birth
- Address
- Relationship to business

### 5.6 Upload Documents

After filling in information, you'll be asked to upload documents:

1. Click **"Upload document"** for each required item
2. Select the file from your computer (JPEG, PNG, or PDF)
3. Make sure documents are:
   - ✅ Clear and readable (not blurry)
   - ✅ All four corners visible (not cropped)
   - ✅ Recent (dated within 3-6 months for bills/statements)
   - ✅ Match the name you provided

**Tips for good document photos:**
- Use good lighting
- Lay document flat on a contrasting surface
- Take photo from directly above (not at an angle)
- Make sure all text is readable

### 5.7 Add Bank Account Details

To receive payouts, add your business bank account:

1. Find the **"Bank accounts"** or **"Payouts"** section
2. Click **"Add bank account"**
3. Enter your bank details:

| Field | What to Enter |
|-------|---------------|
| **Account holder name** | Business name (exactly as it appears on bank account) |
| **Sort code** | 6-digit sort code (e.g., 12-34-56) |
| **Account number** | 8-digit account number |
| **Bank name** | Your bank's name (usually auto-detected) |

4. Click **"Save"** or **"Add bank account"**

> ⚠️ **Important:** The bank account must be in the same name as the business you registered. Personal accounts may not work for business payments.

### 5.8 Submit for Review

After filling everything out:

1. Review all information carefully
2. Click **"Submit for review"** or **"Complete verification"**
3. You'll see a confirmation message

### 5.9 Processing Time

**How long does verification take?**

- **Automated approval:** Some businesses are verified instantly
- **Manual review:** Most businesses: 1-3 business days
- **Additional information needed:** Up to 5 business days if Stripe needs more documents

**You'll receive an email when:**
- ✅ Verification is complete
- ⚠️ Additional information is needed
- ❌ Verification is declined (rare, with reasons)

### 5.10 What to Do While Waiting

While your verification is being processed:

- ✅ Continue testing in test mode
- ✅ Set up your storefront and products
- ✅ Train your staff on the system
- ✅ Prepare marketing materials
- ✅ Plan your launch announcement

**You cannot accept real payments until verification is complete,** but you can do everything else.

### 5.11 Verification Status

Check your verification status:

1. Go to **Stripe Dashboard** → **Settings** → **Business settings**
2. Look for:
   - ✅ **Verified** - You can accept live payments
   - 🔄 **Pending** - Being reviewed (wait for email)
   - ⚠️ **Action required** - Need to submit more info
   - ❌ **Declined** - Contact Stripe support for help

---

## Step 6: Switch to Live Mode (Going Live!)

Once your business is verified, you're ready to accept real payments. This means switching from test keys to live keys.

### 6.1 Pre-Launch Checklist

Before going live, make sure:

- [ ] **Business verification complete** - Status shows "Verified" in Stripe
- [ ] **Bank account added** - Payouts configured and verified
- [ ] **Test mode thoroughly tested** - You've placed multiple successful test orders
- [ ] **Products configured** - All products are in your Apinlero store with correct prices
- [ ] **Delivery settings configured** - Delivery zones and fees set up
- [ ] **Staff trained** - Your team knows how to process orders
- [ ] **Customer communication ready** - You're ready to announce online ordering

> ⚠️ **Don't skip testing!** Make sure test mode works perfectly before going live. Once you switch to live mode, real money will be involved.

### 6.2 Get Your Live API Keys

1. Go to your **Stripe Dashboard** (https://dashboard.stripe.com)
2. At the **top right**, find the **mode toggle switch**
3. Click it to switch from **"Test mode"** to **"Live mode"**
   - The switch may turn orange, green, or red
   - The dashboard background or header may change color
4. In the **left sidebar**, click **"Developers"**
5. Click **"API keys"**

You'll now see your **LIVE API keys** (these are different from your test keys).

### 6.3 Copy Your Live Publishable Key

1. Find **"Publishable key"** in the Standard keys section
2. It now starts with `pk_live_` (notice "live" instead of "test")
3. Click the **copy icon** (📋) to copy it
4. Keep it safe - you'll paste it into Apinlero next

> ℹ️ **Note:** Live keys are different from test keys. You can't mix them.

### 6.4 Reveal and Copy Your Live Secret Key

1. Find **"Secret key"** in the Standard keys section
2. It shows as `sk_live_••••••••••••••••••••••••••••••••`
3. Click **"Reveal live key token"**
4. The key appears - it starts with `sk_live_`
5. Click the **copy icon** (📋) to copy it

> ⚠️ **CRITICAL:** Your live secret key is even more important than test keys. It has access to real money. Never share it, email it, or commit it to code.

### 6.5 Live Keys Checklist

Before updating Apinlero, confirm:

- [ ] Publishable key copied (starts with `pk_live_`)
- [ ] Secret key copied (starts with `sk_live_`)
- [ ] Both keys are LIVE keys (both have `_live_` in them)
- [ ] You're absolutely sure you're ready to accept real payments

### 6.6 Update Keys in Apinlero Settings

1. Go to your **Apinlero Dashboard**
2. Navigate to **Settings** → **Stripe Payments** (same place as before)
3. You'll see your current test keys configured

4. **Replace the Publishable Key:**
   - Clear the existing test key (starts with `pk_test_`)
   - Paste your new live key (starts with `pk_live_`)

5. **Replace the Secret Key:**
   - Clear the existing test key (starts with `sk_test_`)
   - Paste your new live key (starts with `sk_live_`)

6. **Double-check:**
   - Make sure both keys start with `_live_`
   - Make sure there are no extra spaces

### 6.7 Test Connection with Live Keys

**Critical step:** Test the live keys before saving.

1. Click **"Test Connection"** button
2. Wait for the validation
3. You should see: ✅ "Stripe connection successful!"
4. The connection status should now show:
   - ✅ **Connected**
   - 🟢 **Live Mode** (notice it no longer says "Test Mode")

> ⚠️ **If you see an error:** Check both keys are `_live_` keys and not mixed with test keys. See [Troubleshooting](#troubleshooting).

### 6.8 Save Live Configuration

Once the test succeeds:

1. Click **"Save Configuration"** or **"Save Settings"**
2. Confirm the save (there may be a confirmation popup)
3. You'll see: ✅ "Stripe settings saved successfully"
4. Status badge should show: **Connected** and **Live Mode**

🎉 **You're now LIVE!** Your Apinlero store can accept real payments!

### 6.9 Place a Small Real Test Order

**Before announcing to customers,** place one real order to verify:

1. Use your personal credit/debit card (a real card this time)
2. Place a small order (e.g., £1 or £5)
3. Complete the payment
4. Verify:
   - Order appears in Apinlero Dashboard as **Paid**
   - Payment appears in Stripe Dashboard (in **Live mode**) as **Succeeded**
   - You receive order confirmation email (if configured)
5. Check your Stripe balance to see the payment recorded

> 💡 **Tip:** You can refund this test order in Stripe if you want, or just keep it as your first live transaction.

### 6.10 Monitor Your First Orders

For the first few days after going live:

- ✅ Check Apinlero Dashboard regularly for new orders
- ✅ Check Stripe Dashboard to see payments coming in
- ✅ Verify orders are marked as paid correctly
- ✅ Ensure customers receive confirmation
- ✅ Watch for any failed payments or errors

**If anything doesn't work correctly,** see [Troubleshooting](#troubleshooting) or contact support immediately.

### 6.11 Announce to Your Customers

Once you've verified everything works:

1. **Update your website/social media:**
   - "We now accept online card payments!"
   - "Order online and pay with your card"

2. **Email your customers:**
   - Announce the new online payment option
   - Include link to your Apinlero storefront
   - Highlight the convenience and security

3. **Promote your storefront:**
   - Share your storefront URL
   - Add it to your WhatsApp status
   - Include it in your email signature

4. **Train your staff:**
   - Show them where to see paid orders
   - Explain how to handle payment issues
   - Ensure they know Stripe handles card security

---

## Step 7: Understanding Your Stripe Dashboard

Now that you're set up, let's explore what you can do in your Stripe Dashboard.

### 7.1 Accessing Your Stripe Dashboard

**URL:** [https://dashboard.stripe.com](https://dashboard.stripe.com)

**Login:**
- Email: The email you used to create your Stripe account
- Password: Your Stripe password

**Switching Modes:**
- Use the toggle at top right to switch between Test and Live
- **Live mode** = Real money (orange/green indicator)
- **Test mode** = Practice (blue/grey indicator)

### 7.2 Payments Tab - View Transactions

**Location:** Left sidebar → **"Payments"**

**What you'll see:**
- List of all card payments received
- Each payment shows:
  - Amount (e.g., £45.50)
  - Status (Succeeded, Failed, Pending, etc.)
  - Customer email (if provided)
  - Date and time
  - Card type and last 4 digits
  - Description or order ID

**Useful features:**
- **Search:** Find specific payments by amount, customer, or date
- **Filters:** Show only successful/failed payments
- **Export:** Download CSV for accounting
- **Refund:** Click a payment → "Refund" button (top right)

**Click on a payment to see:**
- Payment details (amount, fees, net amount)
- Timeline (when payment was created, succeeded, etc.)
- Customer info
- Card details (last 4 digits, brand, country)
- Logs (API events)
- Metadata (order ID, customer name, etc. from Apinlero)

### 7.3 Payouts Tab - Bank Transfers

**Location:** Left sidebar → **"Payouts"**

**What you'll see:**
- Scheduled transfers to your bank account
- Payout amount
- Expected arrival date
- Status (Paid, In transit, Pending)

**Payout schedule:**
- **UK businesses (default):** Daily automatic payouts
- **First payout:** Usually 7 days after first payment (for fraud prevention)
- **Subsequent payouts:** 2 business days after payment received

**Example:**
- Customer pays on Monday
- Payout arrives in your bank account on Wednesday

**Understanding your balance:**
- **Available balance:** Money ready to be paid out
- **Pending balance:** Money waiting for clearance (usually 2 days)

**Change payout schedule:**
1. Click **"Settings"** → **"Bank accounts and scheduling"**
2. Choose: Daily, Weekly, or Monthly payouts
3. Select specific day (for weekly/monthly)

### 7.4 Balance Tab - Your Stripe Balance

**Location:** Left sidebar → **"Balance"**

**What you'll see:**
- **Available balance:** £XXX.XX - Ready to transfer to your bank
- **Pending balance:** £XXX.XX - Waiting for clearance
- **Total volume:** Total payments received this month

**Why is money pending?**
- Stripe holds funds for 2 business days to protect against fraud and chargebacks
- After 2 days, funds move to "Available" and are automatically paid out

### 7.5 Customers Tab - Customer Database

**Location:** Left sidebar → **"Customers"**

**What you'll see:**
- List of all customers who have paid through Stripe
- Each customer shows:
  - Name (if provided)
  - Email
  - Number of payments
  - Total amount spent
  - Last payment date

**Useful features:**
- **Search:** Find customers by name or email
- **Click customer:** See their full payment history
- **Export:** Download customer list

> ℹ️ **Note:** Customer data is automatically created from Apinlero orders. You don't need to manually add customers.

### 7.6 Reports Tab - Download Statements

**Location:** Left sidebar → **"Reports"**

**What you can generate:**
- **Balance change from activity:** Income and fees breakdown
- **Payouts:** List of transfers to your bank
- **Itemized payout reconciliation:** Match payouts to specific orders
- **Ending balance reconciliation:** Account balance summary

**How to generate a report:**
1. Click **"Reports"**
2. Choose report type
3. Select date range
4. Click **"Generate"** or **"Export"**
5. Download CSV or PDF

**Why download reports?**
- For your accountant
- Tax preparation
- Reconciling with your bank statements
- Understanding fees charged

### 7.7 Settings - Configure Your Account

**Location:** Left sidebar → **"Settings"** (bottom of sidebar)

**Important settings to configure:**

#### Business Settings:
- Business name and address
- Tax registration details
- Industry and description

#### Bank Accounts and Scheduling:
- Add or change bank account
- Change payout schedule
- View payout history

#### Public Business Information:
- What customers see on card statements
- Business phone number
- Customer support email

#### Team:
- Add team members (accountant, staff)
- Set permissions (view-only, admin, etc.)

#### Notifications:
- Email alerts for:
  - Successful payments
  - Failed payments
  - Payouts
  - Disputes

#### Receipts:
- Customize email receipts sent to customers
- Add your logo
- Include custom message

---

## Step 8: Setting Up Webhooks (Optional - Advanced)

Webhooks automatically notify Apinlero when payment events happen in Stripe. This is optional but recommended for real-time order updates.

### 8.1 What Are Webhooks?

**Simple explanation:**
Webhooks are like automatic notifications. When something happens in Stripe (a payment succeeds, fails, or is refunded), Stripe sends a message to Apinlero to update the order status automatically.

**Without webhooks:**
- Apinlero checks payment status when you view the order
- There may be a slight delay in status updates

**With webhooks:**
- Apinlero knows immediately when a payment succeeds or fails
- Order status updates in real-time
- You get instant notifications

**Do you need webhooks?**
- **For most businesses:** No, the default setup works fine
- **Recommended if:** You process many orders, want instant updates, or need automated refund handling

### 8.2 When to Set Up Webhooks

**Set up webhooks if:**
- You want real-time payment status updates
- You process more than 50 orders per day
- You offer automatic refunds or cancellations
- You need to send automated emails when payment succeeds/fails

**Skip webhooks if:**
- You're just starting out
- You process fewer than 20 orders per day
- The default setup works fine for your needs

> ℹ️ **Note:** You can always add webhooks later. It's not required for basic payment processing.

### 8.3 How to Create a Webhook in Stripe

If you decide to set up webhooks:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"** button (top right)
3. You'll see a form to configure the webhook

**Webhook endpoint URL:**
- This is provided by Apinlero
- Format: `https://[your-apinlero-instance]/api/stripe/webhook`
- **Where to find it:** Check your Apinlero Settings → Stripe section, or contact Apinlero support

4. **Enter the webhook URL** in the "Endpoint URL" field
5. **Select events to listen for:**
   - ✅ `payment_intent.succeeded` - Payment successful
   - ✅ `payment_intent.payment_failed` - Payment failed
   - ✅ `charge.refunded` - Refund processed
   - (You can add more events later if needed)

6. Click **"Add endpoint"**

### 8.4 Copy the Webhook Signing Secret

After creating the webhook:

1. Click on your webhook endpoint in the list
2. Scroll down to find **"Signing secret"**
3. It starts with `whsec_` and looks like: `whsec_abcdefgh1234567890ABCDEFGH`
4. Click **"Reveal"** or the copy icon
5. Copy the entire secret

> ⚠️ **Keep secret:** The webhook signing secret is sensitive. Don't share it publicly.

### 8.5 Enter Webhook Secret in Apinlero

1. Go to **Apinlero Dashboard** → **Settings** → **Stripe Payments**
2. Find the field labeled **"Webhook Signing Secret"** or **"Webhook Secret"**
3. Paste the secret (starts with `whsec_`)
4. Click **"Save Configuration"**

### 8.6 Test the Webhook

After saving:

1. In Stripe, go back to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Send test webhook"** button
4. Choose an event (e.g., `payment_intent.succeeded`)
5. Click **"Send test event"**
6. Check the response:
   - ✅ **200 OK** = Webhook working correctly
   - ❌ **Error 4xx/5xx** = Check webhook URL and secret

> ℹ️ **Tip:** You can see webhook logs in Stripe to debug any issues.

---

## Troubleshooting

Common issues and how to solve them.

### "Test Connection Failed"

**Possible causes:**

**1. Invalid API keys**
- ✅ **Solution:** Copy the keys again from Stripe
- Make sure you're copying the complete key (they're very long)
- Check for extra spaces at the beginning or end

**2. Test and Live keys mixed**
- ✅ **Solution:** Both keys must match modes
- If publishable key is `pk_test_`, secret must be `sk_test_`
- If publishable key is `pk_live_`, secret must be `sk_live_`
- Never mix test and live keys

**3. Keys expired or revoked**
- ✅ **Solution:** Generate new keys in Stripe
- Go to Stripe Dashboard → Developers → API Keys
- Click "Roll key" to create new secret key

**4. Stripe account not fully set up**
- ✅ **Solution:** Complete Stripe account setup
- Check for notifications in Stripe Dashboard
- Complete any pending steps

### "Keys Don't Match" or "Mode Mismatch"

**Error message:** "Publishable key and secret key must be in the same mode"

**Cause:** One key is test (`_test_`) and one is live (`_live_`)

**Solution:**
1. Go back to Stripe Dashboard
2. Switch to **Test mode** (if practicing) or **Live mode** (if going live)
3. Copy BOTH keys from the same mode
4. Paste both into Apinlero
5. Test connection again

### "Can't Find API Keys Page"

**Solution:**
1. Log into Stripe Dashboard
2. Look at the **left sidebar**
3. Scroll down to find **"Developers"** (has a `</>` icon)
4. Click **"Developers"**
5. In the submenu, click **"API keys"**

**Still can't find it?**
- Try this direct link: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- Make sure you're logged into the correct Stripe account

### "Payment Not Showing in Dashboard"

**If order doesn't appear in Apinlero:**

**1. Check internet connection**
- ✅ Refresh the page
- ✅ Check your internet is working

**2. Wait a moment**
- Payments usually appear in 1-2 seconds
- Refresh the page after 5 seconds

**3. Check Stripe Dashboard**
- If payment appears in Stripe but not Apinlero, contact Apinlero support

**If payment doesn't appear in Stripe:**

**1. Check mode**
- Make sure you're in the correct mode (test or live)
- Test payments only show in Test mode
- Live payments only show in Live mode

**2. Payment may have failed**
- Check customer's email for payment declined message
- Check Stripe logs for failure reason

### "Business Verification Rejected"

**Common reasons:**

**1. Document quality issues**
- ✅ **Solution:** Re-upload clearer photos
- Use good lighting
- Make sure all text is readable
- Include all four corners of documents

**2. Name mismatch**
- ✅ **Solution:** Ensure all names match exactly
- Business name on documents must match registration
- Your name must match ID exactly (no nicknames)

**3. Documents expired**
- ✅ **Solution:** Upload more recent documents
- Bills/statements must be from last 3 months
- IDs must not be expired

**4. Business address doesn't match**
- ✅ **Solution:** Ensure address is consistent
- Use the same address on all documents
- If you've moved, update business registration first

**5. Bank account name mismatch**
- ✅ **Solution:** Bank account must be in business name
- Personal accounts may not work for business payments
- Open a business bank account if needed

**What to do:**
1. Check email from Stripe explaining the rejection
2. Fix the issues mentioned
3. Re-submit corrected information
4. Wait 1-3 business days for re-review

### "Card Declined" When Testing

**In test mode:**

**1. Using real card in test mode**
- ❌ **Problem:** Real cards don't work in test mode
- ✅ **Solution:** Use test card `4242 4242 4242 4242`

**2. Using intentionally declining test card**
- ❌ Some test cards are designed to fail (e.g., `4000 0000 0000 9995`)
- ✅ **Solution:** Use the basic test card `4242 4242 4242 4242`

**In live mode:**

**1. Insufficient funds**
- Customer's card has insufficient balance
- Ask customer to try different card

**2. Card security check failed**
- Incorrect CVC or postal code
- Ask customer to verify details

**3. Card blocked by bank**
- Customer's bank flagged as suspicious
- Customer should contact their bank
- Ask customer to approve the payment and try again

### "Webhook Errors"

**"Webhook signature verification failed"**

**Cause:** Webhook secret doesn't match

**Solution:**
1. Get the webhook signing secret from Stripe (starts with `whsec_`)
2. Make sure you copied the complete secret
3. Update in Apinlero Settings
4. Test again

**"Webhook endpoint not responding"**

**Cause:** Webhook URL is incorrect or server is down

**Solution:**
1. Check the webhook URL is correct
2. Contact Apinlero support to verify webhook endpoint
3. Check Apinlero server status

### "Payout Delayed" or "Funds Not in Bank Account"

**Understanding payout timing:**

**First payout:** 7 days after first payment (Stripe's fraud prevention)

**Subsequent payouts:**
- Default: 2 business days after payment
- Weekend payments: May take 3-4 days

**Checking payout status:**
1. Stripe Dashboard → **"Payouts"**
2. Check **"Status"** column:
   - **Pending:** Being processed
   - **In transit:** Sent to bank, arriving soon
   - **Paid:** Should be in your account

**If payout is "Paid" but not in your account:**
- Wait one more business day
- Check with your bank
- Verify bank account details in Stripe are correct

**If payout is stuck on "Pending":**
- Stripe may need additional information
- Check email from Stripe
- Contact Stripe support

### Contact Support

**For Apinlero issues:**
- Email: support@apinlero.com
- Or use the help chat in your Apinlero Dashboard

**For Stripe issues:**
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Email: support@stripe.com
- Phone: Check your Stripe Dashboard → Settings → Support

**What to include when contacting support:**
- Description of the issue
- Screenshots (hide sensitive keys!)
- What you've tried already
- Error messages (exact wording)
- When the problem started

---

## Frequently Asked Questions

### Account & Setup

**Q: Do I need a business bank account?**

A: Yes, for live payments. Stripe requires payouts to go to a bank account in your business name. Personal accounts may not work for business payments. Check with your bank about opening a business account.

**Q: How much does Stripe cost?**

A: Stripe's standard UK pricing is 1.5% + 20p per successful UK card transaction, and 2.9% + 20p for international cards. There are no setup fees, monthly fees, or hidden charges. You only pay when you receive a payment.

**Q: Can I use my existing Stripe account?**

A: Yes! If you already have a Stripe account, just grab your API keys from that account and enter them into Apinlero. You don't need to create a new Stripe account.

**Q: What if I want to change my Stripe keys later?**

A: You can update your keys anytime:
1. Get new keys from Stripe Dashboard
2. Go to Apinlero Settings → Stripe Payments
3. Enter the new keys
4. Click "Test Connection"
5. Save

**Q: Can I use the same Stripe account for multiple businesses?**

A: Not recommended. Each business should have its own Stripe account to keep finances separate and avoid payout complications. Create separate Stripe accounts for each business.

---

### Payments & Processing

**Q: When do I receive payouts?**

A:
- **First payout:** 7 days after your first payment (Stripe's fraud prevention policy)
- **After that:** 2 business days after each payment (default schedule)
- **Weekends:** Payments on Saturday/Sunday may take 3-4 days
- **You can change:** Payout schedule to daily, weekly, or monthly in Stripe Settings

**Q: What currencies can I accept?**

A: This depends on your business country. UK businesses typically accept GBP (£), but you can enable other currencies in your Stripe Dashboard. Contact Stripe support to enable multi-currency if needed.

**Q: What payment methods are supported?**

A: Apinlero + Stripe currently supports:
- Visa
- Mastercard
- American Express
- Discover (in supported countries)
- Debit cards

Additional methods like Apple Pay, Google Pay, and digital wallets can be enabled - contact Apinlero support.

**Q: Can customers see my API keys?**

A: Only the publishable key (`pk_test_` or `pk_live_`) is exposed to customers' browsers, and this is safe - it's designed to be public. Your secret key (`sk_test_` or `sk_live_`) is never exposed to customers. It stays secure on Apinlero's servers and is encrypted in the database.

**Q: How do refunds work?**

A: You can refund payments directly from your Stripe Dashboard:
1. Go to Payments
2. Click on the payment to refund
3. Click "Refund" button (top right)
4. Enter refund amount (full or partial)
5. Click "Refund"

The customer receives their money back in 5-10 business days. Stripe's fee (1.5% + 20p) is NOT refunded to you.

---

### Security & Data

**Q: Is my data secure?**

A: Yes! Here's how your data is protected:
- ✅ **Stripe keys encrypted:** Apinlero encrypts your secret key before storing it in the database
- ✅ **PCI DSS Level 1:** Stripe is certified to the highest payment security standard
- ✅ **Card data never stored:** Apinlero never sees or stores customer card numbers - Stripe handles all card data
- ✅ **HTTPS/SSL:** All connections are encrypted in transit
- ✅ **Secure servers:** Hosted on enterprise-grade infrastructure

**Q: What information does Apinlero store?**

A: Apinlero stores:
- Your publishable key (encrypted)
- Your secret key (encrypted)
- Your Stripe account ID (for reference)
- Order amounts and customer info (name, email)

Apinlero never stores:
- Customer card numbers
- Card CVV codes
- Full card details

**Q: Can Apinlero staff see my Stripe keys?**

A: No. Your secret key is encrypted before storage, and Apinlero staff cannot retrieve it. If you lose your keys, you must get them from your Stripe Dashboard - Apinlero cannot recover them for you.

**Q: What happens if my Stripe keys are compromised?**

A: If you believe your secret key has been exposed:
1. Immediately go to Stripe Dashboard → Developers → API Keys
2. Click "Roll key" next to the secret key (this generates a new key and invalidates the old one)
3. Update the new key in Apinlero Settings
4. Contact Stripe support to report the compromise

---

### Test vs Live Mode

**Q: What's the difference between test and live mode?**

A: **Test mode:**
- Practice environment
- No real money involved
- Use test card numbers (e.g., `4242 4242 4242 4242`)
- Test payments appear separately in Stripe
- Perfect for learning and testing

**Live mode:**
- Production environment
- Real money, real cards, real payments
- Use after business verification is complete
- Payments appear in your live Stripe balance
- Funds are paid out to your bank account

**Q: Can I switch back to test mode after going live?**

A: Yes! You can always switch back to test mode to practice new features or test changes. Just use the mode toggle in Stripe Dashboard to switch between test and live. Test and live data are completely separate - testing won't affect your live payments.

**Q: What happens to test payments?**

A: Test payments are isolated and never mix with real payments. They don't affect your payout balance, don't create real charges, and can be deleted without consequence. Test data can be cleared at any time without affecting your live mode.

---

### Business Verification

**Q: Why does Stripe need to verify my business?**

A: Financial regulations require payment processors to verify business identity to:
- Prevent fraud and money laundering
- Ensure you're authorized to accept payments
- Protect customers and the payment system
- Comply with "Know Your Customer" (KYC) laws

This is standard for all payment providers, not just Stripe.

**Q: How long does verification take?**

A:
- **Instant:** Some businesses are automatically approved
- **1-3 business days:** Most businesses with clear documents
- **Up to 5 business days:** If additional information is needed

You'll receive an email when verification is complete.

**Q: Can I accept live payments before verification?**

A: No. Stripe requires business verification before enabling live mode. However, you can use test mode unlimited while waiting for verification to complete.

**Q: What if I don't have a business registration document?**

A: If you're a sole trader or individual:
- Use proof of personal identity (passport, driver's license)
- Provide proof of address (utility bill, bank statement)
- National Insurance number or UTR

Contact Stripe support if you're unsure what documents to provide for your business structure.

---

### Technical Issues

**Q: What if my keys don't work?**

A: Check these common issues:
1. Keys are complete (no missing characters)
2. Both keys are in the same mode (both test or both live)
3. No extra spaces before or after keys
4. Keys haven't been revoked in Stripe
5. Your Stripe account setup is complete

If still not working, generate new keys and try again.

**Q: Can I test with a real card in test mode?**

A: No. Test mode only accepts test card numbers. Real cards will be declined. Use test cards like `4242 4242 4242 4242` for testing.

**Q: What if a payment succeeds in Stripe but the order isn't marked paid in Apinlero?**

A: This can happen if:
- Network issues during order creation
- Webhook not configured (optional feature)

**Solutions:**
1. Manually mark the order as paid in Apinlero
2. Contact Apinlero support to investigate
3. Consider setting up webhooks for automatic status updates

---

## Next Steps

Congratulations on setting up Stripe with Apinlero! Here's what to do next:

### Immediate Next Steps

1. **Practice with test mode**
   - Place several test orders
   - Try different amounts
   - Test refunds in Stripe Dashboard
   - Familiarize yourself with both dashboards

2. **Submit business verification** (if not done yet)
   - Gather required documents
   - Submit in Stripe Dashboard
   - Wait for approval (1-5 business days)

3. **Set up your storefront**
   - Add all products with correct prices
   - Configure delivery zones and fees
   - Test the complete customer journey

4. **Train your team**
   - Show staff how to check orders
   - Explain paid vs pending orders
   - Demonstrate where to see payments in Stripe

### When You're Ready to Go Live

5. **Switch to live keys**
   - Wait for business verification to complete
   - Get live API keys from Stripe
   - Update keys in Apinlero Settings
   - Place one small real test order

6. **Announce to customers**
   - Email newsletter announcing online payments
   - Post on social media with storefront link
   - Update website with "Order Online" button
   - Add to WhatsApp Business status

### After Launch

7. **Monitor payments**
   - Check dashboards daily for the first week
   - Ensure payouts arrive in your bank account
   - Watch for any failed payments or errors
   - Collect customer feedback

8. **Optimize your setup**
   - Review Stripe reports weekly
   - Understand your peak order times
   - Adjust payout schedule if needed
   - Consider webhooks for high-volume businesses

9. **Promote online ordering**
   - Create marketing materials
   - Offer online-exclusive promotions
   - Share customer testimonials
   - Encourage repeat online orders

### Long-Term Success

10. **Regular maintenance**
    - Check Stripe balance weekly
    - Reconcile with bank statements monthly
    - Download reports for your accountant
    - Keep Stripe business info up to date

11. **Grow your business**
    - Analyze payment data to identify trends
    - Use Stripe reports to understand customer behavior
    - Explore additional Stripe features (subscriptions, invoicing, etc.)
    - Scale your online operations

---

## Support & Resources

### Apinlero Support

**For questions about:**
- Connecting Stripe to Apinlero
- Apinlero Dashboard features
- Order management
- Product setup
- Storefront configuration

**Contact:**
- **Email:** support@apinlero.com
- **Dashboard:** Click the help/chat icon in your Apinlero Dashboard
- **Response time:** Usually within 24 hours (weekdays)

### Stripe Support

**For questions about:**
- Business verification
- Payment processing
- Payouts and bank accounts
- Stripe fees
- Account settings
- Refunds

**Contact:**
- **Support Center:** [https://support.stripe.com](https://support.stripe.com)
- **Email:** support@stripe.com
- **Dashboard:** Stripe Dashboard → Settings → Support
- **Response time:** Usually within 1-2 business days

### Helpful Stripe Resources

**Documentation:**
- Stripe Dashboard guide: [https://stripe.com/docs/dashboard](https://stripe.com/docs/dashboard)
- Testing guide: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- Payouts guide: [https://stripe.com/docs/payouts](https://stripe.com/docs/payouts)

**Test Cards:**
- Full list: [https://stripe.com/docs/testing#cards](https://stripe.com/docs/testing#cards)

**Community:**
- Stack Overflow: [stackoverflow.com/questions/tagged/stripe-payments](https://stackoverflow.com/questions/tagged/stripe-payments)

### Video Tutorials (If Available)

Check Apinlero's help center or YouTube channel for:
- Stripe setup walkthrough video
- How to process orders with payments
- Managing refunds
- Monthly reconciliation guide

---

## Version History

**Version 1.0** - January 27, 2026
- Initial comprehensive guide
- Covers complete setup from account creation to going live
- 14 sections with step-by-step instructions
- Troubleshooting and FAQ sections
- Compatible with Apinlero Stripe integration v2.0+

---

## Feedback

We're always improving this guide. If you have suggestions, found confusing sections, or encountered issues not covered here:

**Send feedback to:** support@apinlero.com

**Include:**
- Which section was unclear
- What you were trying to do
- Suggestions for improvement

Thank you for choosing Apinlero! 🎉

---

*This guide was created for Apinlero clients and is designed to be simple and accessible for business owners of all technical skill levels. For developer documentation, see the technical Stripe integration guide.*

*Need help? Don't hesitate to reach out to support - we're here to ensure your success!*
