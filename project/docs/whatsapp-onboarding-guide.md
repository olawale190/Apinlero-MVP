# WhatsApp Business Integration Guide

This guide walks you through connecting your WhatsApp Business account to Apinlero so your customers can place orders via WhatsApp.

---

## Overview

**What you'll get:**
- Customers can message your WhatsApp number to place orders
- Automatic order processing and responses
- Order notifications and status updates
- Message analytics in your Apinlero dashboard

**Time required:** 30-45 minutes

**Cost:** Free for the first 1,000 customer conversations per month, then approximately $0.003-0.01 per conversation after that.

---

## Prerequisites

Before you begin, make sure you have:

- [ ] An active Apinlero business account
- [ ] A Facebook account (personal or business)
- [ ] A phone number dedicated for WhatsApp Business (can be a new number or existing)
- [ ] Access to receive SMS or calls on that phone number for verification

---

## Step 1: Create a Meta Business Account

If you already have a Meta Business account, skip to Step 2.

### 1.1 Go to Meta Business Suite

1. Visit [business.facebook.com](https://business.facebook.com)
2. Click **"Create account"** or **"Get Started"**

### 1.2 Enter Your Business Details

Fill in your business information:

| Field | What to enter |
|-------|---------------|
| Business name | Your registered business name |
| Your name | Your full name |
| Business email | Your business email address |

3. Click **"Submit"**

### 1.3 Verify Your Email

1. Check your email for a verification link from Meta
2. Click the link to verify your email address

---

## Step 2: Create a Meta App

### 2.1 Go to Meta Developers

1. Visit [developers.facebook.com](https://developers.facebook.com)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**

### 2.2 Select App Type

1. Choose **"Business"** as the app type
2. Click **"Next"**

### 2.3 Enter App Details

| Field | What to enter |
|-------|---------------|
| App name | `[Your Business Name] WhatsApp` (e.g., "Lagos Grocers WhatsApp") |
| App contact email | Your business email |
| Business portfolio | Select your Meta Business account |

4. Click **"Create app"**
5. Complete the security check if prompted

---

## Step 3: Set Up WhatsApp Business API

### 3.1 Add WhatsApp to Your App

1. In your app dashboard, scroll down to **"Add products to your app"**
2. Find **"WhatsApp"** and click **"Set up"**

### 3.2 Getting Started with WhatsApp

1. You'll see a **"Getting Started"** page for WhatsApp
2. Click **"Start using the API"**

### 3.3 Add a Phone Number

1. In the WhatsApp section, go to **"API Setup"** (left sidebar)
2. Under **"From"**, you'll see a test phone number provided by Meta
3. Click **"Add phone number"** to add your business phone number

#### Adding Your Business Phone Number:

1. Click **"Add phone number"**
2. Select your **Business portfolio**
3. Click **"Next"**

#### Enter Phone Number Details:

| Field | What to enter |
|-------|---------------|
| Phone number display name | Your business name as customers will see it |
| Category | Select the most relevant category |
| Business description | Brief description of your business |
| Phone number | Your WhatsApp Business phone number (with country code) |

4. Click **"Next"**

#### Verify Your Phone Number:

1. Choose verification method: **SMS** or **Voice call**
2. Enter the 6-digit code you receive
3. Click **"Verify"**

> **Important:** This phone number cannot already be registered with WhatsApp or WhatsApp Business app. If it is, you'll need to delete that WhatsApp account first.

### 3.4 Get Your Credentials

After adding your phone number, you'll need two pieces of information:

#### Phone Number ID:
1. Go to **"API Setup"** in the WhatsApp section
2. Under **"From"**, select your business phone number
3. Look for **"Phone number ID"** - it looks like: `1234567890123456`
4. Copy this number

#### Access Token:
1. On the same **"API Setup"** page
2. Look for **"Temporary access token"** section
3. Click **"Generate"** to create a token
4. Copy the entire token (it's a long string)

> **Note:** Temporary tokens expire after 24 hours. For permanent access, see the "Generate Permanent Token" section below.

---

## Step 4: Enter Credentials in Apinlero

### 4.1 Go to WhatsApp Settings

1. Log in to your Apinlero dashboard
2. Navigate to **Settings** → **WhatsApp**
3. Click on the **"Meta Cloud API"** tab

### 4.2 Enter Your Credentials

Fill in the following fields:

| Field | Value |
|-------|-------|
| Phone Number ID | The Phone Number ID from Step 3.4 |
| Access Token | The Access Token from Step 3.4 |
| WABA ID (optional) | Your WhatsApp Business Account ID |
| Display Phone Number | Your phone number (for display purposes) |

4. Click **"Save Configuration"**

### 4.3 Copy the Webhook Details

After saving, Apinlero will display:

- **Webhook URL**: `https://[your-n8n-url]/webhook/whatsapp/webhook`
- **Verify Token**: A unique token generated for your business

**Copy both of these** - you'll need them in the next step.

---

## Step 5: Configure Webhook in Meta Dashboard

### 5.1 Go to Webhook Configuration

1. Return to [developers.facebook.com](https://developers.facebook.com)
2. Open your WhatsApp app
3. In the left sidebar, under WhatsApp, click **"Configuration"**

### 5.2 Edit Webhook Settings

1. Click **"Edit"** next to the Callback URL field

2. Enter the details from Apinlero:

| Field | Value |
|-------|-------|
| Callback URL | The Webhook URL from Apinlero (Step 4.3) |
| Verify token | The Verify Token from Apinlero (Step 4.3) |

3. Click **"Verify and save"**

> If verification fails, double-check that:
> - The n8n server is running
> - The webhook URL is correct
> - The verify token matches exactly

### 5.3 Subscribe to Webhook Events

After the webhook is verified, you need to subscribe to message events:

1. Under **"Webhook fields"**, find the **"messages"** field
2. Click **"Subscribe"** next to it

You should subscribe to these events:
- ✅ `messages` - Required for receiving customer messages

---

## Step 6: Test Your Connection

### 6.1 Test from Apinlero Dashboard

1. Go back to your Apinlero WhatsApp Settings page
2. Click **"Test Connection"**
3. You should see a success message with your phone number displayed

### 6.2 Send a Test Message

1. From your personal WhatsApp (different phone):
2. Send a message to your business WhatsApp number
3. Try: "Hello" or "Hi"

**Expected response:** The Apinlero bot should reply with a welcome message.

### 6.3 Verify in Message Logs

1. In Apinlero, go to your WhatsApp Settings
2. Scroll down to **"Message Logs"**
3. You should see your test message logged

---

## Generating a Permanent Access Token

The temporary token expires after 24 hours. For production use, create a permanent token:

### Option A: System User Token (Recommended)

1. Go to [business.facebook.com](https://business.facebook.com)
2. Navigate to **Business Settings** → **Users** → **System users**
3. Click **"Add"** to create a system user
4. Enter a name (e.g., "WhatsApp API")
5. Set role to **"Admin"**
6. Click **"Create system user"**

#### Assign Assets to System User:

1. Click on your new system user
2. Click **"Add assets"**
3. Select **"Apps"** and choose your WhatsApp app
4. Grant **"Full control"**
5. Click **"Save changes"**

#### Generate Token:

1. Click **"Generate new token"**
2. Select your WhatsApp app
3. Select these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Click **"Generate token"**
5. **Copy and save this token securely** - it won't be shown again

### Option B: Long-Lived User Token

1. In your app dashboard, go to **Tools** → **Access Token Tool**
2. Generate a User Token with `whatsapp_business_messaging` permission
3. Exchange it for a long-lived token using the Token Debugger

---

## Troubleshooting

### "Webhook verification failed"

**Cause:** Meta cannot reach your webhook URL or the verify token doesn't match.

**Solutions:**
1. Verify n8n is running and accessible from the internet
2. Check the webhook URL is exactly correct (including https://)
3. Ensure the verify token in Meta matches the one from Apinlero
4. Check n8n logs for any errors

### "Access token expired"

**Cause:** You're using a temporary token that has expired.

**Solution:** Generate a permanent token using the System User method above, then update it in your Apinlero dashboard.

### "Phone number not registered"

**Cause:** The phone number hasn't completed verification or setup.

**Solutions:**
1. Complete phone number verification in Meta dashboard
2. Ensure the phone number isn't already registered with WhatsApp
3. Wait a few minutes after verification before testing

### "Message not delivered"

**Cause:** Various possible issues with message delivery.

**Solutions:**
1. Check that your business has been verified by Meta
2. Ensure the recipient's number is in the correct format (with country code)
3. Check the message logs in Apinlero for specific error messages
4. Verify your access token is valid and has correct permissions

### "Bot not responding"

**Cause:** Messages aren't reaching the bot server.

**Solutions:**
1. Check webhook subscription is active for `messages` event
2. Verify n8n workflow is enabled and running
3. Check the WhatsApp Bot server is online
4. Review server logs for errors

---

## Phone Number Requirements

### Can I use my existing WhatsApp number?

If your number is currently registered with:
- **WhatsApp (personal)**: You must delete the WhatsApp account first
- **WhatsApp Business App**: You must delete the business account first

> **Warning:** Deleting your WhatsApp account will lose all chat history.

### Getting a new number

You can use:
- A new SIM card
- A virtual phone number (some providers work, some don't)
- A landline number (verification via voice call)

---

## Business Verification (Optional but Recommended)

For higher messaging limits and full API access, verify your business:

1. Go to [business.facebook.com](https://business.facebook.com)
2. Navigate to **Business Settings** → **Security Center**
3. Click **"Start Verification"**
4. Submit required documents:
   - Business registration certificate
   - Utility bill or bank statement with business name and address
   - Tax registration document

**Processing time:** 1-5 business days

**Benefits of verification:**
- Higher daily messaging limits
- Ability to send message templates
- Green verified badge on your WhatsApp profile

---

## Message Limits

### Without Business Verification

| Tier | Messages per 24 hours |
|------|----------------------|
| Starting | 250 unique customers |
| After 2+ weeks | 1,000 unique customers |

### With Business Verification

| Tier | Messages per 24 hours |
|------|----------------------|
| Tier 1 | 1,000 unique customers |
| Tier 2 | 10,000 unique customers |
| Tier 3 | 100,000 unique customers |
| Tier 4 | Unlimited |

You move up tiers automatically based on your messaging quality and volume.

---

## Next Steps

Once your WhatsApp is connected:

1. **Customize your bot responses** - Contact Apinlero support to customize greetings and messages
2. **Add your products** - Ensure your product catalog is set up in Apinlero
3. **Train your staff** - Let your team know customers can now order via WhatsApp
4. **Promote it** - Add your WhatsApp number to your website, social media, and marketing materials

---

## Support

Need help? Contact Apinlero support:
- Email: support@apinlero.com
- Dashboard: Use the help chat in your Apinlero dashboard

For Meta/WhatsApp specific issues:
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
