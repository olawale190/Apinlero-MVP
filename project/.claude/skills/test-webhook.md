# Àpínlẹ̀rọ Test Webhook

## Purpose
Test WhatsApp webhooks and n8n workflow endpoints to verify the message routing pipeline is working correctly.

## Usage
```
/test-webhook
```

## Prerequisites
- WhatsApp bot deployed on Railway
- n8n workflow active
- Supabase tables created (whatsapp_configs, whatsapp_message_logs)

## Commands

| Command | Description |
|---------|-------------|
| `/test-webhook` | Run all webhook tests |
| `/test-webhook verify` | Test Meta webhook verification |
| `/test-webhook message` | Test message routing |
| `/test-webhook n8n` | Test n8n endpoint directly |

## Configuration

### Required Environment Variables
```bash
WHATSAPP_BOT_URL=https://web-production-63e51.up.railway.app
N8N_WEBHOOK_URL=https://your-n8n.railway.app/webhook/whatsapp/webhook
```

## Implementation

### Test 1: Bot Health Check
```bash
curl -s https://web-production-63e51.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Àpínlẹ̀rọ WhatsApp Bot",
  "version": "3.0.0 (Multi-Tenant)"
}
```

### Test 2: Meta Webhook Verification
Simulates Meta's verification challenge:
```bash
curl -s "https://your-n8n.railway.app/webhook/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Expected response: `test123`

### Test 3: Message Webhook (via n8n)
Send a simulated WhatsApp message:
```bash
curl -X POST https://your-n8n.railway.app/webhook/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "TEST_WABA_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "1234567890",
            "phone_number_id": "TEST_PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": { "name": "Test User" },
            "wa_id": "447123456789"
          }],
          "messages": [{
            "from": "447123456789",
            "id": "test_msg_123",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "Hello, test message" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Test 4: Direct Bot Endpoint
Test the bot's n8n webhook endpoint directly:
```bash
curl -X POST https://web-production-63e51.up.railway.app/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumberId": "TEST_ID",
    "from": "447123456789",
    "profileName": "Test User",
    "content": "Hello test",
    "messageType": "text",
    "messageId": "test_123",
    "timestamp": "2024-01-20T10:00:00Z"
  }'
```

## Verification Checklist

| Test | Expected Result | Status |
|------|-----------------|--------|
| Bot /health | Returns version 3.0.0 | |
| Webhook verify | Returns challenge value | |
| n8n receives webhook | 200 OK response | |
| Bot processes message | Response sent | |
| Message logged | Entry in whatsapp_message_logs | |

## Troubleshooting

### Webhook verification fails
**Cause:** Verify token mismatch or n8n workflow not active
**Solution:**
1. Check n8n workflow is toggled ON
2. Verify the token matches in Meta dashboard and Supabase

### Bot returns 404
**Cause:** Endpoint path incorrect or bot not deployed
**Solution:**
1. Check Railway deployment status
2. Verify endpoint path: `/webhook/n8n` or `/webhook/meta`

### Message not logged
**Cause:** Supabase connection issue or RLS policy
**Solution:**
1. Check SUPABASE_SERVICE_KEY is set in Railway
2. Verify whatsapp_message_logs table exists

## Database Query to Check Logs
```sql
SELECT * FROM whatsapp_message_logs
ORDER BY timestamp DESC
LIMIT 10;
```

## Related Skills
- `/test-bot` - Test bot responses
- `/test-payment` - Test payment flows

---
*Apinlero Test Webhook Skill v1.0*
