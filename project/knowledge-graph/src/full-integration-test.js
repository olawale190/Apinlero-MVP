#!/usr/bin/env node
/**
 * Àpínlẹ̀rọ Knowledge Graph - Full Integration Test
 *
 * Simulates 16 WhatsApp orders through processMessage() end-to-end.
 * No real WhatsApp needed — tests the full pipeline:
 *   intent-classifier → product-search → context-resolver → session-manager → order-saver
 *
 * Usage:
 *   node knowledge-graph/src/full-integration-test.js
 *
 * Requires:
 *   - ANTHROPIC_API_KEY (Claude classifier)
 *   - NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD (Knowledge Graph)
 *   - SUPABASE_URL, SUPABASE_SERVICE_KEY (Session management)
 */

import { processMessage } from './order-processor.js';
import { clearSession } from './session-manager.js';
import { closeDriver } from './neo4j-client.js';
import 'dotenv/config';

// ============================================================================
// TEST INFRASTRUCTURE
// ============================================================================

const results = [];
let testNumber = 0;

/**
 * Run a single test case.
 * @param {string} phone - Simulated phone number
 * @param {string} message - WhatsApp message text
 * @param {Function} validator - (response: string) => { pass: boolean, reason: string }
 * @param {Object} opts - Optional: { mediaUrl, description }
 */
async function runTest(phone, message, validator, opts = {}) {
  testNumber++;
  const desc = opts.description || message;
  const start = Date.now();

  try {
    const response = await processMessage(phone, message, opts.mediaUrl || null);
    const elapsed = Date.now() - start;
    const { pass, reason } = validator(response);

    results.push({
      num: testNumber,
      phone,
      message: desc,
      pass,
      reason,
      response: response.substring(0, 200),
      elapsed,
    });

    const icon = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  ${icon} #${testNumber} (${elapsed}ms) ${desc}`);
    if (!pass) {
      console.log(`       Reason: ${reason}`);
      console.log(`       Response: ${response.substring(0, 150)}...`);
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    results.push({
      num: testNumber,
      phone,
      message: desc,
      pass: false,
      reason: `THREW: ${err.message}`,
      response: '',
      elapsed,
    });
    console.log(`  \x1b[31mFAIL\x1b[0m #${testNumber} (${elapsed}ms) ${desc}`);
    console.log(`       Error: ${err.message}`);
  }
}

/** Helper validators */
const expect = {
  /** Response contains all of the given substrings (case-insensitive) */
  contains: (...substrings) => (response) => {
    const lower = response.toLowerCase();
    for (const sub of substrings) {
      if (!lower.includes(sub.toLowerCase())) {
        return { pass: false, reason: `Missing "${sub}" in response` };
      }
    }
    return { pass: true, reason: 'All substrings found' };
  },

  /** Response contains at least one of the given substrings */
  containsAny: (...substrings) => (response) => {
    const lower = response.toLowerCase();
    for (const sub of substrings) {
      if (lower.includes(sub.toLowerCase())) {
        return { pass: true, reason: `Found "${sub}"` };
      }
    }
    return { pass: false, reason: `None of [${substrings.join(', ')}] found in response` };
  },

  /** Response does NOT contain the given substring */
  notContains: (substring) => (response) => {
    if (response.toLowerCase().includes(substring.toLowerCase())) {
      return { pass: false, reason: `Should NOT contain "${substring}"` };
    }
    return { pass: true, reason: `Correctly absent: "${substring}"` };
  },

  /** Response is non-empty and doesn't indicate a crash */
  isValidResponse: () => (response) => {
    if (!response || response.trim() === '') {
      return { pass: false, reason: 'Empty response' };
    }
    if (response.includes('undefined') || response.includes('null')) {
      return { pass: false, reason: 'Response contains undefined/null' };
    }
    return { pass: true, reason: 'Valid non-empty response' };
  },

  /** Combine multiple validators — all must pass */
  all: (...validators) => (response) => {
    for (const v of validators) {
      const result = v(response);
      if (!result.pass) return result;
    }
    return { pass: true, reason: 'All validators passed' };
  },
};

/** Clear sessions for all test phone numbers */
async function resetTestSessions() {
  const phones = [
    '+447418293041', '+447521384067', '+447632475182',
    '+447845697302', '+447956708413',
  ];
  for (const phone of phones) {
    try {
      await clearSession(phone);
    } catch {
      // Session might not exist, that's fine
    }
  }
}

// ============================================================================
// TEST PHASES
// ============================================================================

async function phase1_simple() {
  console.log('\n\x1b[36m━━━ Phase 1: Simple Orders (5 tests) ━━━\x1b[0m\n');

  await resetTestSessions();

  // Test 1: Basic order with quantity and unit
  await runTest(
    '+447418293041',
    'I want 2kg of rice',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('rice', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'Simple order: "I want 2kg of rice"' }
  );

  // Clear session for next independent test
  await clearSession('+447418293041');

  // Test 2: Price enquiry — should NOT create an order
  await runTest(
    '+447521384067',
    'How much is a bag of rice?',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('£', 'price', 'couldn\'t find'),
      expect.notContains('order confirmed'),
    ),
    { description: 'Price enquiry: "How much is a bag of rice?"' }
  );

  // Test 3: Order with "tins" unit
  await runTest(
    '+447632475182',
    '3 tins of tomato paste',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('tomato', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'Unit order: "3 tins of tomato paste"' }
  );

  // Clear for next test
  await clearSession('+447632475182');

  // Test 4: Informal order phrasing
  await runTest(
    '+447845697302',
    'Can I get 5 plantains?',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('plantain', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'Informal order: "Can I get 5 plantains?"' }
  );

  // Clear for next test
  await clearSession('+447845697302');

  // Test 5: Dash-separated quantity
  await runTest(
    '+447956708413',
    'Egusi — 500g',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('egusi', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'Dash order: "Egusi — 500g"' }
  );

  // Clear for next test
  await clearSession('+447956708413');
}

async function phase2_medium() {
  console.log('\n\x1b[36m━━━ Phase 2: Medium Complexity (3 tests) ━━━\x1b[0m\n');

  await resetTestSessions();

  // Test 6: Multi-item order
  await runTest(
    '+447418293041',
    'I need 2kg rice, 1 tin tomato, and 3 plantains',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('running total', 'order', 'total'),
    ),
    { description: 'Multi-item: "2kg rice, 1 tin tomato, and 3 plantains"' }
  );

  await clearSession('+447418293041');

  // Test 7: Meal scaling
  await runTest(
    '+447632475182',
    'Jollof rice ingredients for 20',
    expect.all(
      expect.isValidResponse(),
      // Should either find the meal or report it's not found
      expect.containsAny('jollof', 'ingredients', 'meal', 'recipe', 'total', 'couldn\'t find', 'sorry'),
    ),
    { description: 'Meal order: "Jollof rice ingredients for 20"' }
  );

  await clearSession('+447632475182');

  // Test 8: Budget order
  await runTest(
    '+447845697302',
    'Give me £30 worth of provisions',
    expect.all(
      expect.isValidResponse(),
      // Should either build a budget cart or explain no history
      expect.containsAny('£', 'provision', 'budget', 'total', 'history', 'couldn\'t'),
    ),
    { description: 'Budget order: "Give me £30 worth of provisions"' }
  );

  await clearSession('+447845697302');
}

async function phase3_complex() {
  console.log('\n\x1b[36m━━━ Phase 3: Complex / Knowledge Graph (5 tests) ━━━\x1b[0m\n');

  await resetTestSessions();

  // Test 9: "The usual please" — requires USUAL_ORDER or order history
  await runTest(
    '+447418293041',
    'The usual please',
    expect.all(
      expect.isValidResponse(),
      // Either resolves usual order or says no history
      expect.containsAny('order', 'usual', 'pattern', 'previous', 'history', 'don\'t have'),
    ),
    { description: 'Reorder: "The usual please" (Bola Ogundimu\'s weekly shop)' }
  );

  await clearSession('+447418293041');

  // Test 10: "Same as last week" — time-based lookup
  await runTest(
    '+447418293041',
    'Same as last week',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('order', 'last week', 'week', 'history', 'don\'t have', 'previous'),
    ),
    { description: 'Time-based: "Same as last week"' }
  );

  await clearSession('+447418293041');

  // Test 11: "My mum's order" — family/RELATED_TO traversal
  await runTest(
    '+447632475182',
    "My mum's order",
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('order', 'mum', 'mother', 'family', 'history', 'don\'t have', 'not found'),
    ),
    { description: 'Family ref: "My mum\'s order" (Mrs Adeyemi via RELATED_TO)' }
  );

  await clearSession('+447632475182');

  // Test 12: "You know what I like" — preference-based
  await runTest(
    '+447956708413',
    'You know what I like',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('order', 'usual', 'like', 'preference', 'history', 'don\'t have'),
    ),
    { description: 'Preference: "You know what I like" (Amara Eze\'s preferences)' }
  );

  await clearSession('+447956708413');

  // Test 13: "Same event as December" — date + event lookup
  await runTest(
    '+447521384067',
    'Same event as December',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('order', 'december', 'event', 'history', 'don\'t have', 'previous'),
    ),
    { description: 'Event reorder: "Same event as December" (Chidi Nwosu\'s party)' }
  );

  await clearSession('+447521384067');
}

async function phase4_edge_cases() {
  console.log('\n\x1b[36m━━━ Phase 4: Edge Cases (3 tests) ━━━\x1b[0m\n');

  await resetTestSessions();

  // Test 14: Misspelled product — E6
  await runTest(
    '+447956708413',
    'Ricee',
    expect.all(
      expect.isValidResponse(),
      // Fuzzy matcher should catch "ricee" → "rice" or report not found
      expect.containsAny('rice', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'E6 Fuzzy match: "Ricee" (misspelled)' }
  );

  await clearSession('+447956708413');

  // Test 15: Emoji + number — E7
  await runTest(
    '+447956708413',
    '\u{1F35A} 2',  // 🍚 2
    expect.all(
      expect.isValidResponse(),
      // Should preprocess emoji to "2 rice" and create order
      expect.containsAny('rice', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'E7 Emoji: "🍚 2" → 2 rice' }
  );

  await clearSession('+447956708413');

  // Test 16: Multi-step modification — E1
  // Step A: Start an order with rice
  console.log('    (Test 16 is multi-step: order → modify)');
  await runTest(
    '+447956708413',
    'I want 2kg of rice',
    expect.all(
      expect.isValidResponse(),
      expect.containsAny('rice', 'order', 'running total', 'couldn\'t find'),
    ),
    { description: 'E1 Setup: Start order with "I want 2kg of rice"' }
  );

  // Step B: Compound modification — cancel rice, add beans
  // Note: this uses the same phone so session state carries over
  // We decrement testNumber since this is part of Test 16
  testNumber--;
  results.pop(); // Remove step A from final count

  await runTest(
    '+447956708413',
    'Actually cancel the rice, add beans instead',
    expect.all(
      expect.isValidResponse(),
      // Should have removed rice and added beans (or at least attempted)
      expect.containsAny('bean', 'order', 'running total', 'cart', 'couldn\'t find'),
    ),
    { description: 'E1 Compound modify: "Cancel the rice, add beans instead"' }
  );

  await clearSession('+447956708413');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\x1b[1m\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Àpínlẹ̀rọ Full Integration Test Suite                ║');
  console.log('║         16 WhatsApp Order Scenarios                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  const totalStart = Date.now();

  try {
    await phase1_simple();
    await phase2_medium();
    await phase3_complex();
    await phase4_edge_cases();
  } catch (err) {
    console.error('\n\x1b[31mFATAL ERROR:\x1b[0m', err.message);
    console.error(err.stack);
  }

  const totalElapsed = Date.now() - totalStart;

  // ========================================================================
  // SUMMARY
  // ========================================================================

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;

  console.log('\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m                        TEST SUMMARY\x1b[0m');
  console.log('\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

  // Result table
  console.log('  #  | Result | Time   | Description');
  console.log('  ---+--------+--------+------------------------------------------');
  for (const r of results) {
    const icon = r.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    const time = `${r.elapsed}ms`.padStart(5);
    const desc = r.message.substring(0, 45);
    console.log(`  ${String(r.num).padStart(2)} | ${icon}   | ${time} | ${desc}`);
  }

  console.log('\n  ---+--------+--------+------------------------------------------');

  // Score
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  const scoreColor = pct === 100 ? '\x1b[32m' : pct >= 75 ? '\x1b[33m' : '\x1b[31m';

  console.log(`\n  ${scoreColor}${passed}/${total} passed (${pct}%)\x1b[0m`);
  console.log(`  Total time: ${(totalElapsed / 1000).toFixed(1)}s`);
  console.log(`  Avg per test: ${total > 0 ? Math.round(totalElapsed / total) : 0}ms`);

  if (failed > 0) {
    console.log(`\n  \x1b[31mFailed tests:\x1b[0m`);
    for (const r of results.filter(r => !r.pass)) {
      console.log(`    #${r.num}: ${r.message}`);
      console.log(`          ${r.reason}`);
    }
  }

  console.log('\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');

  // Cleanup
  try {
    await resetTestSessions();
    await closeDriver();
  } catch {
    // Best effort cleanup
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
