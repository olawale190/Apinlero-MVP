# WhatsApp Testing with ngrok - Complete Guide

This guide will help you test your WhatsApp bot locally using ngrok before deploying to production.

---

## Prerequisites

- Node.js installed
- ngrok installed (`brew install ngrok` on Mac)
- Meta Developer Account
- Supabase project created

---

## Part 1: Get Meta WhatsApp Credentials

### Step 1: Create Meta App

1. Go to [Meta Developers](https://developers.facebook.com)
2. Click **My Apps** > **Create App**
3. Choose **Business** as app type
4. Fill in:
   - **App Name**: Apinlero Bot
   - **App Contact Email**: your-email@example.com
5. Click **Create App**

### Step 2: Add WhatsApp Product

1. In your app dashboard, click **Add Product**
2. Find **WhatsApp** and click **Set Up**
3. Select or create a **Business Account**

### Step 3: Get Your Credentials

Navigate to **WhatsApp > API Setup** and note:

**Phone Number ID:**
- Located under "Phone number ID"
- Looks like: `123456789012345`

**Access Token:**
- Click **Generate Token** (temporary - valid 24 hours)
- For production, you'll need to generate a permanent token
- Looks like: `EAABsbCS...` (very long string)

**Verify Token:**
- This is a string YOU create
- Example: `my-super-secret-verify-token-2024`
- Remember this - you'll use it in both .env and Meta webhook config

**Business Account ID:**
- Go to **Business Settings** in Meta Business Suite
- Copy your Business ID

**App Secret:**
- Go to **Settings > Basic** in your app dashboard
- Click **Show** next to App Secret
- Looks like: `a1b2c3d4e5f6...`

---

## Part 2: Configure WhatsApp Bot

### Step 1: Navigate to WhatsApp Bot Directory

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
```

### Step 2: Create .env File

```bash
cp .env.example .env
nano .env
```

### Step 3: Add Your Credentials

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS...your-very-long-token
WHATSAPP_VERIFY_TOKEN=my-super-secret-verify-token-2024
WHATSAPP_BUSINESS_ID=987654321098765
WHATSAPP_APP_SECRET=a1b2c3d4e5f6...

# Supabase Configuration
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important:**
- Replace ALL placeholder values with your actual credentials
- Keep the verify token you choose - you'll need it later
- Get Supabase Service Key from: Supabase Dashboard > Settings > API

---

## Part 3: Start Your Services

### Terminal 1: Start WhatsApp Bot

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
npm install  # First time only
npm start
```

**Expected Output:**
```
🚀 Àpínlẹ̀rọ WhatsApp Bot v3.0.0 (Multi-Tenant) running on port 3000
📱 Ready to receive WhatsApp messages
```

**If you see errors:**
- Check that all env variables are set correctly
- Verify Supabase URL is reachable
- Make sure no other process is using port 3000

### Terminal 2: Start ngrok

Open a new terminal window:

```bash
ngrok http 3000
```

**Expected Output:**
```
ngrok

Session Status    online
Account           Your Name (Plan: Free)
Version           3.x.x
Region            United States (us)
Latency           -
Web Interface     http://127.0.0.1:4040
Forwarding        https://abcd-1234-5678-9012.ngrok-free.app -> http://localhost:3000

Connections       ttl     opn     rt1     rt5     p50     p90
                  0       0       0.00    0.00    0.00    0.00
```

**Copy the HTTPS URL** - you'll need it in the next step!

Example: `https://abcd-1234-5678-9012.ngrok-free.app`

**Note:** Free ngrok URLs change every time you restart. For a permanent URL, upgrade to ngrok paid plan or deploy to Railway/Render.

---

## Part 4: Configure Meta Webhook

### Step 1: Open Webhook Configuration

1. Go to [Meta Developers](https://developers.facebook.com)
2. Select your app
3. Navigate to **WhatsApp > Configuration**
4. Find **Webhook** section
5. Click **Edit** (or **Configure** if first time)

### Step 2: Enter Webhook Details

**Callback URL:**
```
https://your-ngrok-url.ngrok-free.app/webhook/meta
```

Replace `your-ngrok-url` with your actual ngrok URL from Terminal 2.

**Example:**
```
https://abcd-1234-5678-9012.ngrok-free.app/webhook/meta
```

**Verify Token:**
```
my-super-secret-verify-token-2024
```

This MUST match exactly what you put in your `.env` file!

### Step 3: Verify and Save

1. Click **Verify and Save**
2. Meta will send a GET request to your webhook
3. If successful, you'll see a green checkmark ✓

**If verification fails:**
- Check ngrok is running
- Verify the URL includes `/webhook/meta`
- Ensure verify token matches your .env exactly (case-sensitive!)
- Check Terminal 1 for error logs

### Step 4: Subscribe to Webhook Fields

After verification succeeds:

1. Click **Manage** on the Webhook section
2. Check these fields:
   - ✅ **messages** (required)
   - ✅ **message_status** (optional but recommended)
3. Click **Subscribe**

---

## Part 5: Test Your Bot

### Step 1: Send a Test Message

1. Open WhatsApp on your phone
2. Send a message to your Meta test number
   - Find this in Meta Dashboard under **WhatsApp > API Setup**
   - Add it to your contacts first
3. Send: **"Hello"**

### Step 2: Check the Logs

In Terminal 1 (bot server), you should see:

```
📥 Received webhook: POST /webhook/meta
✅ Webhook verified successfully
📨 Processing message from +2348012345678
👤 Message: Hello
🤖 Sending response...
✅ Message sent successfully
```

### Step 3: Check Your Phone

You should receive an automated response from the bot, such as:

```
Welcome to Isha's Treat & Groceries! 👋

How can I help you today?

Reply with:
1️⃣ Show products
2️⃣ Place order
3️⃣ Track order
4️⃣ Speak to human
```

### Test Commands

Try these messages to test different features:

```
"Show products"
"I want rice"
"Show me your catalog"
"Place an order"
"What do you have?"
```

---

## Part 6: Monitor & Debug

### Check ngrok Web Interface

Open in your browser:
```
http://127.0.0.1:4040
```

Here you can see:
- All incoming webhook requests
- Request/response details
- Replay requests for debugging

### Common Issues

**Bot not responding:**
1. Check Terminal 1 for errors
2. Verify webhook is subscribed to 'messages' field
3. Check Supabase connection
4. Verify your phone number is not blocked

**"Webhook verification failed":**
1. Verify token must match exactly (check for spaces/typos)
2. ngrok must be running on correct port
3. URL must include `/webhook/meta`

**Messages received but no response:**
1. Check Supabase service key is valid
2. Verify business exists in database
3. Check OpenAI API key if using AI features
4. Look for error logs in Terminal 1

**ngrok URL keeps changing:**
- Free tier URLs change on restart
- Upgrade to paid plan for static URL
- Or deploy to production (Railway/Vercel)

---

## Part 7: Populate Products

Once WhatsApp is working, add products to your catalog:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project

# Set your Supabase service key
export SUPABASE_SERVICE_KEY=your-service-role-key

# Run the population script
node scripts/populate-products.js
```

**Expected Output:**
```
🌱 Starting to populate products...
✅ Found business: Isha's Treat & Groceries
📦 Inserting products...

✅ Inserted: Royal Stallion Rice         - ₦7,500
✅ Inserted: Mama Gold Rice              - ₦7,200
✅ Inserted: Caprice Rice                - ₦6,800
...

✅ Product population complete!
📊 Summary:
   ✅ Successfully inserted: 25
   ❌ Failed: 0
   📦 Total products: 25
```

Now test ordering via WhatsApp:
- "Show me rice"
- "I want Royal Stallion Rice"
- "Add 2 packs of rice to my order"

---

## Part 8: Next Steps

### When You're Ready for Production

1. **Generate Permanent Access Token**
   - Meta Dashboard > WhatsApp > API Setup
   - Generate System User token (never expires)

2. **Deploy to Railway/Render**
   - See [PRODUCTION_SETUP_GUIDE.md](PRODUCTION_SETUP_GUIDE.md)
   - Update webhook URL to production domain

3. **Set Up Monitoring**
   - Add Sentry for error tracking
   - Set up log aggregation
   - Configure alerts

4. **Scale Your Bot**
   - Enable multi-tenant features
   - Add more businesses
   - Configure custom business logic

---

## Quick Reference

### Start Everything
```bash
# Terminal 1
cd whatsapp-bot && npm start

# Terminal 2
ngrok http 3000
```

### Stop Everything
```bash
# Terminal 1: Ctrl+C
# Terminal 2: Ctrl+C
```

### Check Logs
```bash
# Bot logs
tail -f whatsapp-bot/logs/app.log

# ngrok web interface
open http://127.0.0.1:4040
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Webhook verification
curl "http://localhost:3000/webhook/meta?hub.mode=subscribe&hub.verify_token=my-super-secret-verify-token-2024&hub.challenge=test123"
```

---

## Support Resources

- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **ngrok Docs**: https://ngrok.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Check [README.md](README.md)

---

**Happy Testing! 🚀**
