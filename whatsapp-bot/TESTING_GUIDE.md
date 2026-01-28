# WhatsApp Bot Testing Guide

## ✅ Current Status

**All 74 tests passing!** The bot is fully functional and ready for testing.

```
Test Suites: 3 passed, 3 total
Tests:       74 passed, 74 total
```

## Testing Options

### 1. 🧪 Unit Tests (WORKING ✅)

Run the full test suite:
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/whatsapp-bot
npm test
```

### 2. 🔍 Message Parser Testing (WORKING ✅)

Test message parsing without needing webhooks:
```bash
node test-simple.js
```

**Example Output:**
```
📨 Message: "2x palm oil to SE15 4AA"
   Intent: NEW_ORDER
   Items: 1 found
     - 2x Palm Oil 5L (Each)
   Postcode: SE15 4AA
   Delivery: £5 - Next day
   ✅ Complete order!
```

**Supported Messages:**
- `"Hello"` → GREETING
- `"2x palm oil"` → NEW_ORDER (needs address)
- `"2 bags of rice"` → NEW_ORDER (needs address)
- `"3x epo pupa to E1 6AN"` → Complete order (Yoruba)
- `"2x palm oil to SE15 4AA"` → Complete order
- `"How much is egusi?"` → PRICE_CHECK
- `"Do you have plantain?"` → AVAILABILITY
- `"yes"` → CONFIRM
- `"cash on delivery"` → PAYMENT_CASH

### 3. 🌐 Local Webhook Server (WORKING ✅)

Server is running on: **http://localhost:3000**

Health check:
```bash
curl http://localhost:3000/
```

Response:
```json
{
  "status": "ok",
  "service": "Àpínlẹ̀rọ WhatsApp Bot",
  "version": "3.0.0 (Multi-Tenant)",
  "providers": ["Meta WhatsApp Cloud API", "Twilio"]
}
```

### 4. 🌍 Public URL with ngrok (READY ✅)

Your public URL: **https://brownish-meagan-glandlike.ngrok-free.dev**

This URL is live and can receive webhooks from Meta/Twilio!

**Webhook Endpoints:**
- Meta WhatsApp: `https://brownish-meagan-glandlike.ngrok-free.dev/webhook/meta`
- Twilio: `https://brownish-meagan-glandlike.ngrok-free.dev/webhook/twilio`
- Health: `https://brownish-meagan-glandlike.ngrok-free.dev/`

## 📱 Testing with Real WhatsApp

### Option A: Meta WhatsApp Cloud API

1. **Go to Meta Developer Console**
   - Visit: https://developers.facebook.com/
   - Select your WhatsApp app

2. **Configure Webhook**
   ```
   Callback URL: https://brownish-meagan-glandlike.ngrok-free.dev/webhook/meta
   Verify Token: (check your .env file: WHATSAPP_VERIFY_TOKEN)
   ```

3. **Subscribe to Messages**
   - Subscribe to `messages` webhook field
   - Test by sending a WhatsApp message to your test number

4. **Send Test Messages**
   Send these to your WhatsApp Business number:
   - "Hello"
   - "2x palm oil"
   - "SE15 4AA"
   - "yes"
   - "cash on delivery"

### Option B: Twilio WhatsApp Sandbox

1. **Go to Twilio Console**
   - Visit: https://console.twilio.com/
   - Go to: Messaging > Try it out > Send a WhatsApp message

2. **Configure Sandbox Webhook**
   ```
   When a message comes in: https://brownish-meagan-glandlike.ngrok-free.dev/webhook/twilio
   HTTP POST
   ```

3. **Join Sandbox**
   - Send `join <sandbox-code>` to the Twilio sandbox number
   - Example: `join copper-mountain`

4. **Send Test Messages**
   Same as Meta option above

## 🔧 Configuration Checklist

### Required Environment Variables

Check your `.env` file has:

```bash
# For Meta WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_APP_SECRET=your-app-secret

# For Twilio (alternative)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database
SUPABASE_URL=https://***REMOVED***.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3000
NODE_ENV=development
```

## 🐛 Troubleshooting

### Server Not Responding
```bash
# Check if running
curl http://localhost:3000/

# Restart server
npm run dev
```

### ngrok Not Working
```bash
# Kill and restart
pkill ngrok
ngrok http 3000

# Get new URL
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
```

### Webhooks Not Receiving Messages
1. Check ngrok is running: `curl http://localhost:4040/status`
2. Verify webhook URL in Meta/Twilio console
3. Check server logs: Look for incoming requests
4. Test verification: Visit webhook URL with `?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`

### Neo4j Warnings (Can Ignore)
```
Neo4j matching error: Could not perform discovery...
```
This is expected - the bot falls back to local product matching when Neo4j isn't running.

## 📊 Test Coverage

### Unit Tests (45 tests)
- ✅ Message intent detection (12 tests)
- ✅ Order item parsing (11 tests)
- ✅ Address/postcode extraction (8 tests)
- ✅ Delivery zone calculation (6 tests)
- ✅ Complete order validation (4 tests)
- ✅ Full integration parsing (4 tests)

### Integration Tests (15 tests)
- ✅ Order processing flow
- ✅ Session management
- ✅ Database operations
- ✅ Product availability
- ✅ Business multi-tenancy
- ✅ Delivery zones

### E2E Tests (14 tests)
- ✅ Webhook processing
- ✅ Complete order flows
- ✅ Session persistence
- ✅ Message logging
- ✅ Error handling
- ✅ Multi-tenant isolation

## 🎯 Quick Start Commands

```bash
# Run all tests
npm test

# Test message parsing
node test-simple.js

# Start server
npm run dev

# Start ngrok
ngrok http 3000

# Get ngrok URL
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# Test webhook
./test-webhook.sh
```

## 📝 Example Test Conversation

```
Customer: Hello
Bot: Welcome! 🌍 Order African & Caribbean groceries...

Customer: 2x palm oil
Bot: Great! I found: 2x Palm Oil 5L (£12.99 each)...
     Where should we deliver?

Customer: SE15 4AA
Bot: Perfect! Delivery to SE15 4AA (£5 fee, Next day)
     Total: £30.98. Confirm?

Customer: yes
Bot: How would you like to pay?
     💵 Cash on delivery
     💳 Card payment
     🏦 Bank transfer

Customer: cash on delivery
Bot: ✅ Order confirmed! #ORD-12345
     Total: £30.98 (includes £5 delivery)
     Payment: Cash on delivery
     Delivery: Next day to SE15 4AA
```

## 🚀 Next Steps

1. **Verify .env configuration** - Make sure all API keys are set
2. **Test with Meta/Twilio** - Use the ngrok URL to receive real messages
3. **Monitor logs** - Watch `npm run dev` output for debugging
4. **Add products to Supabase** - Populate your product catalog
5. **Customize responses** - Edit `src/response-templates.js`

---

**Need Help?**
- Check server logs: `npm run dev`
- View ngrok requests: http://localhost:4040/
- Run tests: `npm test`
- Test parser: `node test-simple.js`
