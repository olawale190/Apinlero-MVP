#!/usr/bin/env node

/**
 * Simple Message Parser Tester
 * Test message parsing without needing server/webhooks
 */

import { parseMessage, detectIntent } from './src/message-parser.js';

const testMessages = [
  'Hello',
  '2x palm oil',
  '2 bags of rice',
  '3x epo pupa to E1 6AN',
  '2x palm oil to SE15 4AA',
  'How much is egusi?',
  'Do you have plantain?',
  'yes',
  'cash on delivery'
];

console.log('🧪 Testing Message Parser\n');
console.log('='.repeat(60));

for (const message of testMessages) {
  console.log(`\n📨 Message: "${message}"`);

  const intent = detectIntent(message);
  console.log(`   Intent: ${intent}`);

  const parsed = await parseMessage(message);

  if (parsed.items.length > 0) {
    console.log(`   Items: ${parsed.items.length} found`);
    parsed.items.forEach(item => {
      console.log(`     - ${item.quantity}x ${item.product} (${item.unit})`);
    });
  }

  if (parsed.postcode) {
    console.log(`   Postcode: ${parsed.postcode}`);
    console.log(`   Delivery: £${parsed.deliveryZone.fee} - ${parsed.deliveryZone.estimatedDelivery}`);
  }

  if (parsed.isCompleteOrder) {
    console.log(`   ✅ Complete order!`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Testing complete!\n');
