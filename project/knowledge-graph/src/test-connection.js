/**
 * Test connections to Neo4j and Supabase
 */

import { verifyConnection, closeDriver } from './neo4j-client.js';
import { getProducts, getOrders } from './supabase-client.js';

async function testConnections() {
  console.log('🔌 Testing Àpínlẹ̀rọ Knowledge Graph Connections\n');

  // Test Neo4j
  console.log('1. Testing Neo4j Aura...');
  const neo4jOk = await verifyConnection();

  // Test Supabase
  console.log('\n2. Testing Supabase...');
  try {
    const products = await getProducts();
    const orders = await getOrders();
    console.log(`  ✅ Connected to Supabase`);
    console.log(`     - Products: ${products.length}`);
    console.log(`     - Orders: ${orders.length}`);
  } catch (error) {
    console.log(`  ❌ Supabase connection failed: ${error.message}`);
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log(`  Neo4j: ${neo4jOk ? '✅ Connected' : '❌ Failed'}`);
  console.log(`  Supabase: Check above for status`);

  await closeDriver();
}

testConnections();
