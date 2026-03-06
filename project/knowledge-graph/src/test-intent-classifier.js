import { classifyMessage } from './intent-classifier.js';

const tests = [
  // ── Simple orders ──
  {
    message: 'I want 2kg of rice',
    expect: { intent: 'new_order', checkItem: { product: 'rice', quantity: 2, unit: 'kg' } },
  },
  {
    message: '3 tins of tomato paste',
    expect: { intent: 'new_order' },
  },
  {
    message: 'How much is a bag of rice?',
    expect: { intent: 'price_enquiry' },
  },

  // ── Contextual / reorder ──
  {
    message: 'The usual please',
    expect: { intent: 'reorder', requires_knowledge_graph: true },
  },
  {
    message: 'Same as last week',
    expect: { intent: 'reorder', checkClue: { references_time: 'last week' } },
  },
  {
    message: "My mum's order",
    expect: { intent: 'reorder', checkClue: { references_person_contains: 'mu' } },
  },

  // ── Meal ──
  {
    message: 'Jollof rice ingredients for 20',
    expect: { intent: 'meal_order', checkClue: { references_meal_set: true, serving_size: 20 } },
  },

  // ── Budget ──
  {
    message: '£50 worth of provisions',
    expect: { intent: 'budget_order', checkClue: { references_budget: 50 } },
  },

  // ── Modification ──
  {
    message: 'Cancel the rice, add beans',
    expect: { intent: 'modify_order' },
  },
  {
    message: 'Remove the last item',
    expect: { intent: 'modify_order' },
  },

  // ── Edge cases ──
  {
    message: 'Ricee',
    expect: { intent: 'new_order' },
  },
  {
    message: '🍚 2',
    expect: { intent: 'new_order' },
  },
  {
    message: "Is this still Isha's?",
    expect: { intent: 'general_query' },
  },
  {
    message: 'Can I pay tomorrow?',
    expect: { intent: 'general_query' },
  },
];

function check(result, expect) {
  const failures = [];

  if (result.intent !== expect.intent) {
    failures.push(`intent: got "${result.intent}", want "${expect.intent}"`);
  }

  if (expect.requires_knowledge_graph && !result.requires_knowledge_graph) {
    failures.push('requires_knowledge_graph should be true');
  }

  if (expect.checkItem && result.items?.length > 0) {
    const item = result.items[0];
    const e = expect.checkItem;
    if (e.product && !item.product?.toLowerCase().includes(e.product)) {
      failures.push(`item product: got "${item.product}", want contains "${e.product}"`);
    }
    if (e.quantity != null && item.quantity !== e.quantity) {
      failures.push(`item quantity: got ${item.quantity}, want ${e.quantity}`);
    }
    if (e.unit && item.unit !== e.unit) {
      failures.push(`item unit: got "${item.unit}", want "${e.unit}"`);
    }
  }

  if (expect.checkClue && result.context_clues) {
    const c = result.context_clues;
    const e = expect.checkClue;

    if (e.references_time && c.references_time !== e.references_time) {
      failures.push(`references_time: got "${c.references_time}", want "${e.references_time}"`);
    }
    if (e.references_person_contains) {
      const person = (c.references_person || '').toLowerCase();
      if (!person.includes(e.references_person_contains)) {
        failures.push(`references_person: got "${c.references_person}", want contains "${e.references_person_contains}"`);
      }
    }
    if (e.references_meal_set && !c.references_meal) {
      failures.push('references_meal should be set');
    }
    if (e.serving_size != null && c.serving_size !== e.serving_size) {
      failures.push(`serving_size: got ${c.serving_size}, want ${e.serving_size}`);
    }
    if (e.references_budget != null && c.references_budget !== e.references_budget) {
      failures.push(`references_budget: got ${c.references_budget}, want ${e.references_budget}`);
    }
  }

  return failures;
}

async function run() {
  console.log('Intent Classifier Test Suite');
  console.log('============================\n');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    process.stdout.write(`  "${t.message}" ... `);
    const result = await classifyMessage(t.message);
    const failures = check(result, t.expect);

    if (failures.length === 0) {
      console.log(`PASS  (${result.intent}, confidence: ${result.confidence})`);
      passed++;
    } else {
      console.log('FAIL');
      for (const f of failures) console.log(`    ✗ ${f}`);
      console.log(`    raw: ${JSON.stringify(result)}`);
      failed++;
    }
  }

  console.log(`\n============================`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
