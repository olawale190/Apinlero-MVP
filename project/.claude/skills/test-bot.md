# Àpínlẹ̀rọ Test Bot

## Purpose
Send test messages to the WhatsApp bot to verify conversation flows, intent detection, and order processing.

## Usage
```
/test-bot
```

## Prerequisites
- WhatsApp bot deployed and running
- Supabase connected with products table populated
- Neo4j knowledge graph running (for product matching)

## Commands

| Command | Description |
|---------|-------------|
| `/test-bot` | Run full bot test suite |
| `/test-bot greeting` | Test greeting response |
| `/test-bot order` | Test order flow |
| `/test-bot catalog` | Test product catalog |
| `/test-bot intent [message]` | Test specific intent |

## Configuration

### Required Environment Variables
```bash
WHATSAPP_BOT_URL=https://web-production-63e51.up.railway.app
TEST_PHONE_NUMBER=447123456789
```

## Test Scenarios

### 1. Greeting Test
**Input:** "Hello" / "Hi" / "Good morning"
**Expected:** Welcome message with menu options

```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "from": "447123456789",
    "profileName": "Test User",
    "content": "Hello",
    "messageType": "text"
  }'
```

**Expected Response:**
```
Welcome to Isha's Treat & Groceries!

How can I help you today?
1. Browse products
2. Place an order
3. Check order status
4. Delivery information
```

### 2. Order Flow Test
**Input:** "I want to order 2 bags of rice and 1 palm oil"

```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "from": "447123456789",
    "profileName": "Test User",
    "content": "I want to order 2 bags of rice and 1 palm oil",
    "messageType": "text"
  }'
```

**Expected Response:**
- Products recognized
- Quantities extracted
- Cart confirmation
- Delivery address request

### 3. Product Catalog Test
**Input:** "What products do you have?"

```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "from": "447123456789",
    "profileName": "Test User",
    "content": "Show me your products",
    "messageType": "text"
  }'
```

### 4. Nigerian/Caribbean Product Alias Test
**Input:** "I need ewa" (beans in Yoruba)

```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "from": "447123456789",
    "profileName": "Test User",
    "content": "I need some ewa and epo pupa",
    "messageType": "text"
  }'
```

**Expected:** Bot recognizes "ewa" as beans and "epo pupa" as palm oil

### 5. Delivery Zone Test
**Input:** "Delivery to SE15 2AA"

```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "from": "447123456789",
    "profileName": "Test User",
    "content": "Can you deliver to SE15 2AA?",
    "messageType": "text"
  }'
```

**Expected:** Delivery confirmation with fee (£5 for South London)

## Intent Detection Tests

| Message | Expected Intent |
|---------|-----------------|
| "Hello" | greeting |
| "I want to order..." | order |
| "What do you have?" | browse |
| "Where is my order?" | order_status |
| "Do you deliver to...?" | delivery_info |
| "How much is...?" | price_check |
| "Cancel my order" | cancel |
| "Thanks" | thanks |

## Session Persistence Test

1. Send greeting message
2. Wait 5 seconds
3. Send order message
4. Verify session maintains context

```bash
# Message 1
curl -X POST $BOT_URL/webhook/n8n -d '{"from":"447123456789","content":"Hi"}'

# Wait 5 seconds
sleep 5

# Message 2 (should remember user)
curl -X POST $BOT_URL/webhook/n8n -d '{"from":"447123456789","content":"I want rice"}'
```

## Troubleshooting

### Bot not responding
**Cause:** Server crashed or endpoint wrong
**Solution:**
1. Check `/health` endpoint
2. Check Railway logs
3. Verify endpoint is `/webhook/n8n`

### Products not recognized
**Cause:** Neo4j not connected or product not in database
**Solution:**
1. Check NEO4J_URI environment variable
2. Verify product exists in Supabase products table
3. Check Neo4j knowledge graph has alias mappings

### Session not persisting
**Cause:** Redis/cache issue or different phone number
**Solution:**
1. Use consistent phone number in tests
2. Check session table in Supabase

## Check Bot Logs
```bash
# View Railway logs
railway logs --service web
```

## Related Skills
- `/test-webhook` - Test webhook routing
- `/test-payment` - Test payment processing

---
*Apinlero Test Bot Skill v1.0*
