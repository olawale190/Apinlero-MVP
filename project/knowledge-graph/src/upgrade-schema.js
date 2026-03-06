/**
 * Àpínlẹ̀rọ Knowledge Graph - Schema Upgrade
 *
 * Adds contextual ordering capabilities for comparison test.
 * Run: node knowledge-graph/src/upgrade-schema.js
 */

import { runWrite, verifyConnection, closeDriver } from './neo4j-client.js';

const schemaUpgrades = [
  // ============================================================================
  // NEW NODE CONSTRAINTS
  // ============================================================================
  {
    name: 'Meal node constraint',
    cypher: `CREATE CONSTRAINT meal_name IF NOT EXISTS FOR (m:Meal) REQUIRE m.name IS UNIQUE`
  },

  // ============================================================================
  // NEW INDEXES FOR PERFORMANCE
  // ============================================================================
  {
    name: 'Customer phone index',
    cypher: `CREATE INDEX customer_phone IF NOT EXISTS FOR (c:Customer) ON (c.phone)`
  },
  {
    name: 'Product aliases index',
    cypher: `CREATE INDEX product_aliases IF NOT EXISTS FOR (p:Product) ON (p.aliases)`
  },
  {
    name: 'Product cultural_names index',
    cypher: `CREATE INDEX product_cultural_names IF NOT EXISTS FOR (p:Product) ON (p.cultural_names)`
  },
  {
    name: 'Order status index',
    cypher: `CREATE INDEX order_status IF NOT EXISTS FOR (o:Order) ON (o.status)`
  },
  {
    name: 'Order created_at index',
    cypher: `CREATE INDEX order_created_at IF NOT EXISTS FOR (o:Order) ON (o.created_at)`
  },

  // ============================================================================
  // ADD NEW PROPERTIES TO EXISTING PRODUCT NODES
  // ============================================================================
  {
    name: 'Add aliases property to Products',
    cypher: `
      MATCH (p:Product)
      WHERE p.aliases IS NULL
      SET p.aliases = [], p.cultural_names = [], p.emoji = ''
    `
  },

  // ============================================================================
  // RELATIONSHIP TYPE INDEXES (for query performance)
  // ============================================================================
  {
    name: 'PREFERS relationship index',
    cypher: `CREATE INDEX prefers_frequency IF NOT EXISTS FOR ()-[r:PREFERS]-() ON (r.frequency)`
  },
  {
    name: 'USUAL_ORDER relationship index',
    cypher: `CREATE INDEX usual_order_confidence IF NOT EXISTS FOR ()-[r:USUAL_ORDER]-() ON (r.confidence)`
  },
  {
    name: 'RELATED_TO relationship index',
    cypher: `CREATE INDEX related_to_relationship IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.relationship)`
  },
  {
    name: 'REQUIRES relationship index',
    cypher: `CREATE INDEX requires_unit IF NOT EXISTS FOR ()-[r:REQUIRES]-() ON (r.unit)`
  }
];

// Sample relationship types for documentation/verification
const relationshipExamples = `
NEW RELATIONSHIP TYPES:

  (Customer)-[:PREFERS {
    frequency: "weekly" | "monthly" | "occasional",
    typical_quantity: 2,
    preferred_size: "5kg",
    last_ordered: datetime()
  }]->(Product)

  (Customer)-[:USUAL_ORDER {
    pattern_name: "weekly_shop" | "monthly_bulk" | "event_order",
    confidence: 0.85,
    last_matched: datetime(),
    times_ordered: 6
  }]->(Order)

  (Customer)-[:RELATED_TO {
    relationship: "mother" | "spouse" | "sibling" | "child"
  }]->(Customer)

  (Meal)-[:REQUIRES {
    quantity_per_serving: 500,
    unit: "g" | "ml" | "pieces" | "tins"
  }]->(Product)

NEW NODE TYPE:

  (Meal {
    name: "Jollof Rice",
    serves: 4
  })

UPDATED PRODUCT PROPERTIES:

  (Product {
    ...existing properties...,
    aliases: ["red oil", "palm fruit oil"],
    cultural_names: ["epo pupa", "mmanu nri"],
    emoji: "🫒"
  })
`;

async function upgradeSchema() {
  console.log('🔧 Àpínlẹ̀rọ Knowledge Graph - Schema Upgrade\n');
  console.log('━'.repeat(60));

  const connected = await verifyConnection();
  if (!connected) {
    console.error('❌ Cannot connect to Neo4j. Check your .env configuration.');
    process.exit(1);
  }

  console.log('\n📋 Applying schema upgrades...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const upgrade of schemaUpgrades) {
    try {
      await runWrite(upgrade.cypher);
      console.log(`  ✅ ${upgrade.name}`);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('EquivalentSchemaRuleAlreadyExists')) {
        console.log(`  ⏭️  ${upgrade.name} (already exists)`);
        skipCount++;
      } else {
        console.log(`  ❌ ${upgrade.name}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`\n📊 Schema Upgrade Summary:`);
  console.log(`   ✅ Applied: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors:  ${errorCount}`);

  console.log('\n📖 New Schema Elements:');
  console.log(relationshipExamples);

  await closeDriver();
  console.log('\n✅ Schema upgrade complete.\n');
}

// Run if called directly
upgradeSchema().catch(error => {
  console.error('Schema upgrade failed:', error);
  process.exit(1);
});
