/**
 * Test WhatsApp Bot - Message Parsing & Neo4j Integration
 * Run with: node test-bot.js
 */

import { parseMessage, matchProduct, detectIntent, isCompleteOrder } from './src/message-parser.js';
import { handleIncomingMessage } from './src/message-handler.js';

console.log('🤖 Àpínlẹ̀rọ WhatsApp Bot Test Suite\n');
console.log('='.repeat(50));

// Test messages to simulate customer orders
const testMessages = [
  // Yoruba product names
  { text: 'I want epo pupa', description: 'Yoruba: Palm oil' },
  { text: 'Order 2x ata rodo', description: 'Yoruba: Scotch bonnet peppers' },
  { text: 'Do you have egwusi?', description: 'Yoruba: Egusi seeds' },
  { text: 'I need amala', description: 'Yoruba: Yam flour' },
  { text: 'Give me ogede', description: 'Yoruba: Plantain' },

  // English product names
  { text: 'I want palm oil', description: 'English: Palm oil' },
  { text: '3 bags egusi seeds please', description: 'English with quantity' },
  { text: 'Order scotch bonnet and plantain', description: 'Multiple products' },

  // Full orders with delivery
  { text: 'I want 2x epo pupa and 3 bags egwusi to SE15 4AA', description: 'Full order with Yoruba + postcode' },

  // Greetings & inquiries
  { text: 'Hello', description: 'Greeting' },
  { text: 'What products do you have?', description: 'Product inquiry' },
  { text: 'How much is palm oil?', description: 'Price check' },

  // NEW: Quick commands
  { text: 'reorder', description: 'Repeat last order' },
  { text: 'same again', description: 'Repeat last order (alt)' },
  { text: 'quick palm oil', description: 'Quick order with saved address' },
];

async function runTests() {
  console.log('\n📋 TEST 1: Intent Detection\n');
  console.log('-'.repeat(50));

  for (const test of testMessages) {
    const intent = detectIntent(test.text);
    console.log(`"${test.text}"`);
    console.log(`  → Intent: ${intent}`);
    console.log(`  (${test.description})\n`);
  }

  console.log('\n�� TEST 2: Product Matching (Neo4j + Fallback)\n');
  console.log('-'.repeat(50));

  const productTests = [
    'epo pupa',      // Yoruba: Palm oil
    'ata rodo',      // Yoruba: Scotch bonnet
    'egwusi',        // Yoruba: Egusi
    'amala',         // Yoruba: Yam flour
    'ogede',         // Yoruba: Plantain
    'palm oil',      // English
    'egusi seeds',   // English
    'scotch bonnet', // English
  ];

  for (const term of productTests) {
    const result = await matchProduct(term);
    if (result) {
      console.log(`"${term}"`);
      console.log(`  → ${result.name}`);
      console.log(`  Language: ${result.language}, Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Source: ${result.source}\n`);
    } else {
      console.log(`"${term}" → ❌ No match found\n`);
    }
  }

  console.log('\n📋 TEST 3: One-Message Order Detection\n');
  console.log('-'.repeat(50));

  const completeOrderTests = [
    { text: '2x palm oil to SE15 4AA', expected: true },
    { text: 'I want egusi', expected: false },  // No postcode
    { text: '3x ata rodo and amala to E1 6AN', expected: true },
    { text: 'palm oil', expected: false },  // No quantity, no postcode
  ];

  for (const test of completeOrderTests) {
    const parsed = await parseMessage(test.text);
    const isComplete = isCompleteOrder(parsed.items, parsed.postcode);
    const status = isComplete === test.expected ? '✅' : '❌';
    console.log(`${status} "${test.text}"`);
    console.log(`   Complete order: ${isComplete} (expected: ${test.expected})`);
    console.log(`   Items: ${parsed.items.length}, Postcode: ${parsed.postcode || 'none'}\n`);
  }

  console.log('\n📋 TEST 4: Full Message Parsing\n');
  console.log('-'.repeat(50));

  const orderMessages = [
    'I want 2x epo pupa',
    'Order 3 bags egwusi and ata rodo to SE15 4AA',
    'Give me amala and ogede please',
  ];

  for (const msg of orderMessages) {
    console.log(`Message: "${msg}"\n`);
    const parsed = await parseMessage(msg);
    console.log(`  Intent: ${parsed.intent}`);
    console.log(`  Neo4j Enabled: ${parsed.neo4jEnabled ? '✅ Yes' : '⚠️ Fallback'}`);
    console.log(`  Items found: ${parsed.items.length}`);
    for (const item of parsed.items) {
      console.log(`    - ${item.product}: ${item.quantity}x (${item.language})`);
    }
    if (parsed.postcode) {
      console.log(`  Postcode: ${parsed.postcode}`);
      console.log(`  Delivery Fee: £${parsed.deliveryZone.fee}`);
    }
    console.log('');
  }

  console.log('\n📋 TEST 5: Full Conversation Flow (Simulated)\n');
  console.log('-'.repeat(50));

  // Simulate a customer conversation
  const conversation = [
    { text: 'Hello', description: 'Customer greets' },
    { text: 'I want to order epo pupa and egwusi', description: 'Customer orders in Yoruba' },
  ];

  for (const msg of conversation) {
    console.log(`Customer: "${msg.text}" (${msg.description})`);
    try {
      const response = await handleIncomingMessage({
        from: '+447448682282',
        customerName: 'Test Customer',
        text: msg.text,
        messageId: 'test-' + Date.now()
      });
      console.log(`Bot: ${response?.text?.substring(0, 150)}...`);
    } catch (error) {
      console.log(`Bot Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!\n');
}

runTests().catch(console.error);
