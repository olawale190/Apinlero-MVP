/**
 * Apinlero Knowledge Graph - Product Search Tests
 *
 * Run: node knowledge-graph/src/test-product-search.js
 */

import { searchProduct, normalise, levenshtein } from './product-search.js';
import { verifyConnection, closeDriver } from './neo4j-client.js';

// ============================================================================
// TEST CASES
// ============================================================================

const testCases = [
  // Exact matches
  { query: 'rice', expectMatch: true,  expectType: null,       label: 'exact name match' },
  { query: 'Rice', expectMatch: true,  expectType: null,       label: 'case insensitive' },

  // Typo tolerance (fuzzy)
  { query: 'ricee', expectMatch: true, expectType: 'fuzzy',    label: 'typo tolerance' },

  // Cultural names
  { query: 'iresi', expectMatch: true, expectType: 'cultural', label: 'Yoruba cultural name' },
  { query: 'shinkafa', expectMatch: true, expectType: 'cultural', label: 'Hausa cultural name' },

  // Alias match
  { query: 'tin tomato', expectMatch: true, expectType: 'alias', label: 'alias match' },

  // Typo on common word
  { query: 'tomatoe', expectMatch: true, expectType: 'fuzzy',  label: 'typo on tomato' },

  // Emoji
  { query: '\u{1F35A}', expectMatch: true, expectType: 'emoji', label: 'emoji lookup (rice)' },

  // Direct product name
  { query: 'egusi', expectMatch: true, expectType: null,        label: 'exact product match' },

  // Fuzzy for double letter
  { query: 'gari', expectMatch: true,  expectType: null,        label: 'gari -> garri fuzzy' },

  // Product by name
  { query: 'ponmo', expectMatch: true, expectType: null,        label: 'ponmo / cow skin' },

  // Not in catalogue
  { query: 'moin moin', expectMatch: false, expectType: null,   label: 'not in catalogue' },
];

// ============================================================================
// UNIT TESTS (no Neo4j needed)
// ============================================================================

function runUnitTests() {
  console.log('=== Unit Tests (no Neo4j) ===\n');
  let passed = 0;
  let failed = 0;

  // normalise tests
  const normTests = [
    { input: '  Rice  ', expected: 'rice' },
    { input: 'PALM  OIL', expected: 'palm oil' },
    { input: '', expected: '' },
    { input: null, expected: '' },
  ];

  for (const t of normTests) {
    const result = normalise(t.input);
    if (result === t.expected) {
      console.log(`  PASS  normalise(${JSON.stringify(t.input)}) = ${JSON.stringify(result)}`);
      passed++;
    } else {
      console.log(`  FAIL  normalise(${JSON.stringify(t.input)}) = ${JSON.stringify(result)}, expected ${JSON.stringify(t.expected)}`);
      failed++;
    }
  }

  // levenshtein tests
  const levTests = [
    { a: 'rice', b: 'rice', expected: 0 },
    { a: 'rice', b: 'ricee', expected: 1 },
    { a: 'gari', b: 'garri', expected: 1 },
    { a: 'tomato', b: 'tomatoe', expected: 1 },
    { a: 'cat', b: 'dog', expected: 3 },
    { a: '', b: 'abc', expected: 3 },
    { a: 'kitten', b: 'sitting', expected: 3 },
  ];

  for (const t of levTests) {
    const result = levenshtein(t.a, t.b);
    if (result === t.expected) {
      console.log(`  PASS  levenshtein("${t.a}", "${t.b}") = ${result}`);
      passed++;
    } else {
      console.log(`  FAIL  levenshtein("${t.a}", "${t.b}") = ${result}, expected ${t.expected}`);
      failed++;
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  return failed;
}

// ============================================================================
// INTEGRATION TESTS (require Neo4j)
// ============================================================================

async function runIntegrationTests() {
  console.log('=== Integration Tests (Neo4j) ===\n');

  const connected = await verifyConnection();
  if (!connected) {
    console.log('  SKIP  Cannot connect to Neo4j - skipping integration tests\n');
    return 0;
  }

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const results = await searchProduct(tc.query);
      const hasMatch = results.length > 0;

      if (hasMatch !== tc.expectMatch) {
        console.log(`  FAIL  "${tc.query}" (${tc.label})`);
        console.log(`         Expected ${tc.expectMatch ? 'match' : 'no match'}, got ${hasMatch ? 'match' : 'no match'}`);
        failed++;
        continue;
      }

      if (tc.expectType && hasMatch && results[0].match_type !== tc.expectType) {
        // Accept if the match type is more precise (e.g. exact instead of fuzzy)
        const typePriority = ['exact', 'alias', 'cultural', 'fuzzy', 'emoji'];
        const expectedIdx = typePriority.indexOf(tc.expectType);
        const actualIdx = typePriority.indexOf(results[0].match_type);
        if (actualIdx <= expectedIdx) {
          // More precise match is fine
          console.log(`  PASS  "${tc.query}" -> ${results[0].product} [${results[0].match_type}] (${tc.label})`);
          passed++;
        } else {
          console.log(`  FAIL  "${tc.query}" (${tc.label})`);
          console.log(`         Expected match_type "${tc.expectType}", got "${results[0].match_type}"`);
          failed++;
        }
        continue;
      }

      if (hasMatch) {
        console.log(`  PASS  "${tc.query}" -> ${results[0].product} [${results[0].match_type}] (${tc.label})`);
      } else {
        console.log(`  PASS  "${tc.query}" -> no match (${tc.label})`);
      }
      passed++;
    } catch (error) {
      console.log(`  FAIL  "${tc.query}" (${tc.label}) - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  return failed;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\nApinlero Product Search - Test Suite\n');
  console.log('='.repeat(50) + '\n');

  const unitFailures = runUnitTests();
  const integrationFailures = await runIntegrationTests();

  await closeDriver();

  const totalFailures = unitFailures + integrationFailures;
  console.log('='.repeat(50));
  if (totalFailures === 0) {
    console.log('\nAll tests passed!\n');
  } else {
    console.log(`\n${totalFailures} test(s) failed.\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
