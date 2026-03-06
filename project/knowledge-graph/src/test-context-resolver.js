/**
 * Àpínlẹ̀rọ Context Resolver - Test Suite
 *
 * Tests all context resolution functions against seeded test data.
 * Prerequisites: Run seed scripts first:
 *   node knowledge-graph/src/seed-test-customers.js
 *   node knowledge-graph/src/seed-meals.js
 *
 * Run: node knowledge-graph/src/test-context-resolver.js
 */

import {
  resolveUsualOrder,
  resolveTimeBasedOrder,
  resolveFamilyOrder,
  resolveCrossCustomerOrder,
  resolveMealOrder,
  resolveBudgetOrder,
  resolvePreferenceUpdate,
  resolveContext,
} from './context-resolver.js';
import { verifyConnection, closeDriver } from './neo4j-client.js';

// ============================================================================
// TEST HARNESS
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✅ ${message}`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: ${message}`);
    failed++;
  }
}

function printItems(items, indent = '      ') {
  if (!items || items.length === 0) {
    console.log(`${indent}(none)`);
    return;
  }
  for (const item of items) {
    const qty = item.quantity || '';
    const unit = item.unit ? ` ${item.unit}` : '';
    const price = item.price ? ` @ £${item.price.toFixed(2)}` : '';
    const subtotal = item.subtotal ? ` = £${item.subtotal.toFixed(2)}` : '';
    console.log(`${indent}• ${qty}${unit} ${item.name}${price}${subtotal}`);
  }
}

// ============================================================================
// TEST 1: resolveUsualOrder — Bola Ogundimu's weekly shop
// ============================================================================
async function test1_UsualOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 1: resolveUsualOrder("+447418293041")');
  console.log('   Customer: Bola Ogundimu (Weekly Regular)');
  console.log('   Trigger:  "The usual please" / "You know what I like"');
  console.log('   Expected: Rice, Tomato Paste, Palm Oil, Plantain, Egusi\n');

  const result = await resolveUsualOrder('+447418293041');

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  printItems(result.items);

  assert(result.source === 'usual_order', 'Source is "usual_order"');
  assert(result.confidence >= 0.8, `Confidence ${result.confidence} >= 0.8`);
  assert(result.items.length === 5, `Has ${result.items.length} items (expected 5)`);

  const names = result.items.map(i => i.name.toLowerCase());
  assert(names.some(n => n.includes('rice')), 'Contains rice');
  assert(names.some(n => n.includes('tomato')), 'Contains tomato paste');
  assert(names.some(n => n.includes('palm oil')), 'Contains palm oil');
  assert(names.some(n => n.includes('plantain')), 'Contains plantain');
  assert(names.some(n => n.includes('egusi')), 'Contains egusi');
}

// ============================================================================
// TEST 2: resolveTimeBasedOrder — "Same as last week"
// ============================================================================
async function test2_TimeBasedOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 2: resolveTimeBasedOrder("+447418293041", "last week")');
  console.log('   Customer: Bola Ogundimu');
  console.log('   Trigger:  "Same as last week"');
  console.log('   Expected: Her most recent order (7 days ago)\n');

  const result = await resolveTimeBasedOrder('+447418293041', 'last week');

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  printItems(result.items);

  assert(result.source === 'date_lookup', 'Source is "date_lookup"');
  assert(result.confidence > 0, `Confidence ${result.confidence} > 0`);
  assert(result.items.length > 0, `Has ${result.items.length} items (expected > 0)`);

  const names = result.items.map(i => i.name.toLowerCase());
  assert(names.some(n => n.includes('rice')), 'Contains rice');
}

// ============================================================================
// TEST 3: resolveFamilyOrder — "My mum's order"
// ============================================================================
async function test3_FamilyOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 3: resolveFamilyOrder("+447632475182", "mother")');
  console.log('   Customer: Folake Adeyemi');
  console.log('   Trigger:  "My mum\'s order" / "Same as my mother\'s last order"');
  console.log('   Expected: Mrs Adeyemi\'s most recent order (garri, palm oil, egusi, stockfish)\n');

  const result = await resolveFamilyOrder('+447632475182', 'mother');

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  printItems(result.items);

  assert(result.source === 'family_ref', 'Source is "family_ref"');
  assert(result.confidence > 0, `Confidence ${result.confidence} > 0`);
  assert(result.explanation.includes('Mrs Adeyemi'), 'Explanation references Mrs Adeyemi');
  assert(result.items.length === 4, `Has ${result.items.length} items (expected 4)`);

  const names = result.items.map(i => i.name.toLowerCase());
  assert(names.some(n => n.includes('garri')), 'Contains garri');
  assert(names.some(n => n.includes('egusi')), 'Contains egusi');
  assert(names.some(n => n.includes('stockfish')), 'Contains stockfish');
}

// ============================================================================
// TEST 4: resolveCrossCustomerOrder — "Same as Bola's usual"
// ============================================================================
async function test4_CrossCustomerOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 4: resolveCrossCustomerOrder("Bola Ogundimu")');
  console.log('   Trigger:  "Same as Bola\'s usual"');
  console.log('   Expected: Bola Ogundimu\'s usual order (rice, tomato, palm oil, plantain, egusi)\n');

  const result = await resolveCrossCustomerOrder('Bola Ogundimu');

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  printItems(result.items);

  assert(result.source === 'cross_customer', 'Source is "cross_customer"');
  assert(result.confidence >= 0.8, `Confidence ${result.confidence} >= 0.8`);
  assert(result.items.length === 5, `Has ${result.items.length} items (expected 5)`);

  const names = result.items.map(i => i.name.toLowerCase());
  assert(names.some(n => n.includes('rice')), 'Contains rice');
  assert(names.some(n => n.includes('egusi')), 'Contains egusi');
}

// ============================================================================
// TEST 5: resolveMealOrder — "Jollof rice ingredients for 20"
// ============================================================================
async function test5_MealOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 5: resolveMealOrder("Jollof Rice", 20)');
  console.log('   Trigger:  "Jollof rice ingredients for 20"');
  console.log('   Expected: 8 ingredients, scaled 5x (from 4 servings)\n');

  const result = await resolveMealOrder('Jollof Rice', 20);

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  for (const item of result.items) {
    const notes = item.notes ? ` (${item.notes})` : '';
    console.log(`      • ${item.quantity} ${item.unit} ${item.name} @ £${item.price.toFixed(2)}${notes}`);
  }

  assert(result.source === 'meal_recipe', 'Source is "meal_recipe"');
  assert(result.confidence >= 0.9, `Confidence ${result.confidence} >= 0.9`);
  assert(result.items.length === 8, `Has ${result.items.length} items (expected 8)`);
  assert(result.explanation.includes('5x'), 'Explanation mentions 5x scale');

  const rice = result.items.find(i => i.name.toLowerCase().includes('rice'));
  assert(rice && rice.quantity === 2500, `Rice scaled to ${rice?.quantity}g (expected 2500g)`);

  const tomato = result.items.find(i => i.name.toLowerCase().includes('tomato'));
  assert(tomato && tomato.quantity === 10, `Tomato paste scaled to ${tomato?.quantity} tins (expected 10)`);

  const thyme = result.items.find(i => i.name.toLowerCase().includes('thyme'));
  assert(thyme && thyme.quantity === 2.5, `Thyme scaled to ${thyme?.quantity} tsp (expected 2.5)`);
}

// ============================================================================
// TEST 6: resolveBudgetOrder — "£30 worth of provisions"
// ============================================================================
async function test6_BudgetOrder() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 6: resolveBudgetOrder("+447845697302", 30)');
  console.log('   Customer: Tunde Abiola (Price-sensitive)');
  console.log('   Trigger:  "£30 worth of provisions"');
  console.log('   Expected: Items totalling ≤ £30, preferred rice first\n');

  const result = await resolveBudgetOrder('+447845697302', 30);

  console.log(`   Source:     ${result.source}`);
  console.log(`   Confidence: ${result.confidence}`);
  console.log(`   Budget:     £${result.budget}`);
  console.log(`   Total:      £${result.total.toFixed(2)}`);
  console.log(`   Remaining:  £${result.remaining.toFixed(2)}`);
  console.log(`   Explanation: ${result.explanation}`);
  console.log('   Items:');
  printItems(result.items);

  assert(result.source === 'budget_fill', 'Source is "budget_fill"');
  assert(result.total <= 30, `Total £${result.total.toFixed(2)} <= £30.00`);
  assert(result.total > 0, `Total £${result.total.toFixed(2)} > £0.00`);
  assert(result.items.length >= 2, `Has ${result.items.length} items (expected >= 2)`);
  assert(result.remaining >= 0, `Remaining £${result.remaining.toFixed(2)} >= 0`);

  // Rice should be first (from PREFERS)
  const firstName = result.items[0]?.name?.toLowerCase() || '';
  assert(firstName.includes('rice'), `First item is rice (got: ${result.items[0]?.name})`);
}

// ============================================================================
// TEST 7: resolvePreferenceUpdate — "rice was too small"
// ============================================================================
async function test7_PreferenceUpdate() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Test 7: resolvePreferenceUpdate("+447845697302", "rice", "too small")');
  console.log('   Customer: Tunde Abiola');
  console.log('   Trigger:  "The rice last time was too small, get the bigger one"');
  console.log('   Expected: Upgrade from 5kg to 10kg\n');

  const result = await resolvePreferenceUpdate('+447845697302', 'rice', 'too small');

  console.log(`   Updated:    ${result.updated}`);
  console.log(`   Source:     ${result.source}`);
  console.log(`   Explanation: ${result.explanation}`);
  if (result.previous) {
    console.log(`   Previous:   ${result.previous.name} (${result.previous.size}) @ £${result.previous.price.toFixed(2)}`);
  }
  if (result.current) {
    console.log(`   Now:        ${result.current.name} (${result.current.size}) @ £${result.current.price.toFixed(2)}`);
  }

  assert(result.updated === true, 'Preference was updated');
  assert(result.source === 'preference_update', 'Source is "preference_update"');

  if (result.previous && result.current) {
    assert(result.current.price > result.previous.price, 'New product is more expensive (bigger)');
    assert(result.current.name.toLowerCase().includes('rice'), 'New product is still rice');
    assert(result.current.name.toLowerCase().includes('10kg'), 'Upgraded to 10kg');
  }
}

// ============================================================================
// BONUS: Test resolveContext master router
// ============================================================================
async function testBonus_ContextRouter() {
  console.log('\n' + '─'.repeat(60));
  console.log('📋 Bonus: resolveContext() master router');
  console.log('   Testing that clues route to the correct resolver\n');

  // "The usual" → resolveUsualOrder
  const r1 = await resolveContext('+447418293041', { references_previous: true });
  assert(r1.source === 'usual_order', '{ references_previous: true } → usual_order');

  // "Last week's order" → resolveTimeBasedOrder
  const r2 = await resolveContext('+447418293041', { references_time: 'last week' });
  assert(r2.source === 'date_lookup', '{ references_time: "last week" } → date_lookup');

  // "My mum's order" → resolveFamilyOrder
  const r3 = await resolveContext('+447632475182', { references_person: 'mother' });
  assert(r3.source === 'family_ref', '{ references_person: "mother" } → family_ref');

  // "Same as Bola's" → resolveCrossCustomerOrder
  const r4 = await resolveContext('+447418293041', { references_person: 'Bola Ogundimu' });
  assert(r4.source === 'cross_customer', '{ references_person: "Bola Ogundimu" } → cross_customer');

  // "Jollof rice for 10" → resolveMealOrder
  const r5 = await resolveContext('+447418293041', { references_meal: 'Jollof Rice', servings: 10 });
  assert(r5.source === 'meal_recipe', '{ references_meal: "Jollof Rice" } → meal_recipe');

  // "£50 of provisions" → resolveBudgetOrder
  const r6 = await resolveContext('+447418293041', { references_budget: 50 });
  assert(r6.source === 'budget_fill', '{ references_budget: 50 } → budget_fill');
}

// ============================================================================
// MAIN
// ============================================================================
async function runTests() {
  console.log('🧠 Àpínlẹ̀rọ Context Resolver — Test Suite\n');
  console.log('━'.repeat(60));

  const connected = await verifyConnection();
  if (!connected) {
    console.error('\n❌ Cannot connect to Neo4j. Run seed scripts first:');
    console.error('   node knowledge-graph/src/seed-test-customers.js');
    console.error('   node knowledge-graph/src/seed-meals.js\n');
    process.exit(1);
  }

  try {
    await test1_UsualOrder();
    await test2_TimeBasedOrder();
    await test3_FamilyOrder();
    await test4_CrossCustomerOrder();
    await test5_MealOrder();
    await test6_BudgetOrder();
    await test7_PreferenceUpdate();   // Must be last (mutates data)
    await testBonus_ContextRouter();

    console.log('\n' + '━'.repeat(60));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! The Knowledge Graph intelligence is working.\n');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check output above.\n`);
    }

    console.log('💡 Note: Test 7 mutates Tunde Abiola\'s preference (5kg → 10kg).');
    console.log('   Re-run seed-test-customers.js to reset before re-testing.\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await closeDriver();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
