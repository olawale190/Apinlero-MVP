/**
 * Àpínlẹ̀rọ Knowledge Graph - Neo4j Schema Setup
 *
 * This script creates the graph schema in Neo4j Aura:
 * - Node labels and constraints
 * - Indexes for fast queries
 * - Relationship types
 */

import { runWrite, verifyConnection, closeDriver } from './neo4j-client.js';

async function setupSchema() {
  console.log('🚀 Setting up Àpínlẹ̀rọ Knowledge Graph Schema...\n');

  // Verify connection first
  const connected = await verifyConnection();
  if (!connected) {
    console.error('Cannot proceed without Neo4j connection');
    process.exit(1);
  }

  try {
    // 1. Create constraints (unique IDs)
    console.log('📌 Creating constraints...');

    await runWrite(`
      CREATE CONSTRAINT product_id IF NOT EXISTS
      FOR (p:Product) REQUIRE p.id IS UNIQUE
    `);
    console.log('  ✓ Product constraint');

    await runWrite(`
      CREATE CONSTRAINT order_id IF NOT EXISTS
      FOR (o:Order) REQUIRE o.id IS UNIQUE
    `);
    console.log('  ✓ Order constraint');

    await runWrite(`
      CREATE CONSTRAINT customer_id IF NOT EXISTS
      FOR (c:Customer) REQUIRE c.id IS UNIQUE
    `);
    console.log('  ✓ Customer constraint');

    await runWrite(`
      CREATE CONSTRAINT customer_phone IF NOT EXISTS
      FOR (c:Customer) REQUIRE c.phone IS UNIQUE
    `);
    console.log('  ✓ Customer phone constraint');

    await runWrite(`
      CREATE CONSTRAINT staff_id IF NOT EXISTS
      FOR (s:Staff) REQUIRE s.id IS UNIQUE
    `);
    console.log('  ✓ Staff constraint');

    await runWrite(`
      CREATE CONSTRAINT category_name IF NOT EXISTS
      FOR (cat:Category) REQUIRE cat.name IS UNIQUE
    `);
    console.log('  ✓ Category constraint');

    await runWrite(`
      CREATE CONSTRAINT alias_name IF NOT EXISTS
      FOR (a:Alias) REQUIRE a.name IS UNIQUE
    `);
    console.log('  ✓ Alias constraint');

    // 2. Create indexes for faster queries
    console.log('\n📊 Creating indexes...');

    await runWrite(`
      CREATE INDEX product_name IF NOT EXISTS
      FOR (p:Product) ON (p.name)
    `);
    console.log('  ✓ Product name index');

    await runWrite(`
      CREATE INDEX order_status IF NOT EXISTS
      FOR (o:Order) ON (o.status)
    `);
    console.log('  ✓ Order status index');

    await runWrite(`
      CREATE INDEX order_channel IF NOT EXISTS
      FOR (o:Order) ON (o.channel)
    `);
    console.log('  ✓ Order channel index');

    await runWrite(`
      CREATE INDEX order_created IF NOT EXISTS
      FOR (o:Order) ON (o.created_at)
    `);
    console.log('  ✓ Order created_at index');

    await runWrite(`
      CREATE INDEX customer_name IF NOT EXISTS
      FOR (c:Customer) ON (c.name)
    `);
    console.log('  ✓ Customer name index');

    await runWrite(`
      CREATE INDEX alias_language IF NOT EXISTS
      FOR (a:Alias) ON (a.language)
    `);
    console.log('  ✓ Alias language index');

    await runWrite(`
      CREATE FULLTEXT INDEX alias_search IF NOT EXISTS
      FOR (a:Alias) ON EACH [a.name]
    `);
    console.log('  ✓ Alias fulltext search index');

    console.log('\n✅ Schema setup complete!');
    console.log('\nNode Labels:');
    console.log('  - :Product');
    console.log('  - :Order');
    console.log('  - :Customer');
    console.log('  - :Staff');
    console.log('  - :Category');
    console.log('  - :Alias (NEW - for ethnic food terminology)');
    console.log('  - :Payment');

    console.log('\nRelationship Types:');
    console.log('  - [:PLACED] Customer -> Order');
    console.log('  - [:CONTAINS] Order -> Product');
    console.log('  - [:BELONGS_TO] Product -> Category');
    console.log('  - [:REFERS_TO] Alias -> Product (NEW - alias matching)');
    console.log('  - [:ASSIGNED_TO] Staff -> Order');
    console.log('  - [:HAS_PAYMENT] Order -> Payment');

  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    throw error;
  } finally {
    await closeDriver();
  }
}

setupSchema();
