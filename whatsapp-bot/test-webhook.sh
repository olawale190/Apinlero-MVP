#!/bin/bash

# WhatsApp Bot Local Testing Script
# Tests webhook endpoints locally without needing Meta/Twilio

BASE_URL="http://localhost:3000"

echo "🧪 Testing Àpínlẹ̀rọ WhatsApp Bot Webhooks"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check"
curl -s "$BASE_URL/" | jq '.' || curl -s "$BASE_URL/"
echo -e "\n"

# Test 2: Webhook Verification (Meta)
echo "2️⃣  Meta Webhook Verification"
curl -s "$BASE_URL/webhook/meta?hub.mode=subscribe&hub.verify_token=test-token&hub.challenge=test-challenge-123"
echo -e "\n"

# Test 3: Simulate Incoming WhatsApp Message (Meta)
echo "3️⃣  Simulate Meta WhatsApp Message - Greeting"
curl -s -X POST "$BASE_URL/webhook/meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test-business-001",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "447448682282",
            "phone_number_id": "test-phone-id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "447448682282"
          }],
          "messages": [{
            "from": "447448682282",
            "id": "test-msg-001",
            "timestamp": "1234567890",
            "text": {
              "body": "Hello"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.' 2>/dev/null || echo "Response received"
echo -e "\n"

# Test 4: Simulate Order Message
echo "4️⃣  Simulate Order Message - '2x palm oil'"
curl -s -X POST "$BASE_URL/webhook/meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test-business-001",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "447448682282",
            "phone_number_id": "test-phone-id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "447448682282"
          }],
          "messages": [{
            "from": "447448682282",
            "id": "test-msg-002",
            "timestamp": "1234567890",
            "text": {
              "body": "2x palm oil"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.' 2>/dev/null || echo "Response received"
echo -e "\n"

# Test 5: Simulate Complete Order with Address
echo "5️⃣  Simulate Complete Order - '2x palm oil to SE15 4AA'"
curl -s -X POST "$BASE_URL/webhook/meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test-business-001",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "447448682282",
            "phone_number_id": "test-phone-id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "447448682282"
          }],
          "messages": [{
            "from": "447448682282",
            "id": "test-msg-003",
            "timestamp": "1234567890",
            "text": {
              "body": "2x palm oil to SE15 4AA"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.' 2>/dev/null || echo "Response received"
echo -e "\n"

# Test 6: Simulate Yoruba Order
echo "6️⃣  Simulate Yoruba Order - '3x epo pupa to E1 6AN'"
curl -s -X POST "$BASE_URL/webhook/meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test-business-001",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "447448682282",
            "phone_number_id": "test-phone-id"
          },
          "contacts": [{
            "profile": {
              "name": "Test Customer"
            },
            "wa_id": "447448682282"
          }],
          "messages": [{
            "from": "447448682282",
            "id": "test-msg-004",
            "timestamp": "1234567890",
            "text": {
              "body": "3x epo pupa to E1 6AN"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }' | jq '.' 2>/dev/null || echo "Response received"
echo -e "\n"

echo "✅ Testing Complete!"
echo ""
echo "💡 Tips:"
echo "  - Check server logs for detailed message processing"
echo "  - Use 'npm run dev' to see live logs"
echo "  - For real WhatsApp testing, use ngrok: 'ngrok http 3000'"
