/**
 * Àpínlẹ̀rọ Knowledge Graph - Meal Seeder
 *
 * Creates meal nodes with REQUIRES relationships to products.
 * Run: node knowledge-graph/src/seed-meals.js
 */

import { runWrite, verifyConnection, closeDriver } from './neo4j-client.js';

// ============================================================================
// MEAL DEFINITIONS
// ============================================================================
const meals = [
  {
    name: 'Jollof Rice',
    serves: 4,
    description: 'Classic Nigerian party rice with tomato-based sauce',
    cuisine: 'Nigerian',
    emoji: '🍚',
    ingredients: [
      { productId: 'rice-10kg', quantity_per_serving: 500, unit: 'g', notes: 'Long grain preferred' },
      { productId: 'tomato-paste-400g', quantity_per_serving: 2, unit: 'tins' },
      { productId: 'palm-oil-1l', quantity_per_serving: 100, unit: 'ml' },
      { productId: 'onions-5kg', quantity_per_serving: 2, unit: 'pieces' },
      { productId: 'scotch-bonnet-200g', quantity_per_serving: 50, unit: 'g' },
      { productId: 'maggi-100', quantity_per_serving: 2, unit: 'cubes' },
      { productId: 'curry-500g', quantity_per_serving: 1, unit: 'tsp' },
      { productId: 'thyme-100g', quantity_per_serving: 0.5, unit: 'tsp' }
    ]
  },
  {
    name: 'Egusi Soup',
    serves: 4,
    description: 'Rich melon seed soup with leafy vegetables',
    cuisine: 'Nigerian',
    emoji: '🥣',
    ingredients: [
      { productId: 'egusi-1kg', quantity_per_serving: 200, unit: 'g' },
      { productId: 'palm-oil-1l', quantity_per_serving: 150, unit: 'ml' },
      { productId: 'bitter-leaf-100g', quantity_per_serving: 1, unit: 'bunch' },
      { productId: 'stockfish-medium', quantity_per_serving: 1, unit: 'pieces' },
      { productId: 'crayfish-ground-500g', quantity_per_serving: 100, unit: 'g' },
      { productId: 'locust-beans-200g', quantity_per_serving: 50, unit: 'g' },
      { productId: 'scotch-bonnet-200g', quantity_per_serving: 30, unit: 'g' },
      { productId: 'ponmo-1kg', quantity_per_serving: 200, unit: 'g' }
    ]
  },
  {
    name: 'Pepper Soup',
    serves: 4,
    description: 'Spicy aromatic broth with meat or fish',
    cuisine: 'Nigerian',
    emoji: '🍲',
    ingredients: [
      { productId: 'goat-meat-500g', quantity_per_serving: 500, unit: 'g' },
      { productId: 'cameroon-pepper-200g', quantity_per_serving: 30, unit: 'g' },
      { productId: 'scotch-bonnet-200g', quantity_per_serving: 20, unit: 'g' },
      { productId: 'scent-leaf-50g', quantity_per_serving: 1, unit: 'bunch' },
      { productId: 'uziza-leaf-50g', quantity_per_serving: 1, unit: 'pack' },
      { productId: 'onions-5kg', quantity_per_serving: 1, unit: 'pieces' },
      { productId: 'maggi-100', quantity_per_serving: 2, unit: 'cubes' }
    ]
  },
  {
    name: 'Suya',
    serves: 10,
    description: 'Spiced grilled meat skewers',
    cuisine: 'Nigerian',
    emoji: '🍢',
    ingredients: [
      { productId: 'chicken-whole', quantity_per_serving: 1000, unit: 'g' },
      { productId: 'suya-spice-200g', quantity_per_serving: 2, unit: 'packs' },
      { productId: 'onions-5kg', quantity_per_serving: 2, unit: 'pieces' },
      { productId: 'groundnut-oil-5l', quantity_per_serving: 50, unit: 'ml' },
      { productId: 'cameroon-pepper-200g', quantity_per_serving: 20, unit: 'g' }
    ]
  },
  {
    name: 'Fried Rice',
    serves: 4,
    description: 'Nigerian-style fried rice with vegetables',
    cuisine: 'Nigerian',
    emoji: '🍛',
    ingredients: [
      { productId: 'rice-10kg', quantity_per_serving: 500, unit: 'g' },
      { productId: 'mixed-veg-500g', quantity_per_serving: 300, unit: 'g' },
      { productId: 'chicken-whole', quantity_per_serving: 300, unit: 'g' },
      { productId: 'curry-500g', quantity_per_serving: 1, unit: 'tbsp' },
      { productId: 'thyme-100g', quantity_per_serving: 0.5, unit: 'tsp' },
      { productId: 'onions-5kg', quantity_per_serving: 1, unit: 'pieces' },
      { productId: 'groundnut-oil-5l', quantity_per_serving: 100, unit: 'ml' },
      { productId: 'maggi-100', quantity_per_serving: 2, unit: 'cubes' }
    ]
  }
];

// ============================================================================
// SEED FUNCTION
// ============================================================================
async function seedMeals() {
  console.log('🍽️  Àpínlẹ̀rọ Knowledge Graph - Meal Seeder\n');
  console.log('━'.repeat(60));

  const connected = await verifyConnection();
  if (!connected) {
    console.error('❌ Cannot connect to Neo4j. Check your .env configuration.');
    process.exit(1);
  }

  console.log('\n📋 Creating meal nodes...\n');

  let mealCount = 0;
  let relationshipCount = 0;

  for (const meal of meals) {
    try {
      // Create or update the Meal node
      await runWrite(`
        MERGE (m:Meal {name: $name})
        SET m.serves = $serves,
            m.description = $description,
            m.cuisine = $cuisine,
            m.emoji = $emoji
      `, {
        name: meal.name,
        serves: meal.serves,
        description: meal.description,
        cuisine: meal.cuisine,
        emoji: meal.emoji
      });

      console.log(`  ✅ ${meal.emoji} ${meal.name} (serves ${meal.serves})`);
      mealCount++;

      // Create REQUIRES relationships to products
      for (const ingredient of meal.ingredients) {
        try {
          await runWrite(`
            MATCH (m:Meal {name: $mealName})
            MATCH (p:Product {id: $productId})
            MERGE (m)-[r:REQUIRES]->(p)
            SET r.quantity_per_serving = $quantity,
                r.unit = $unit,
                r.notes = $notes
          `, {
            mealName: meal.name,
            productId: ingredient.productId,
            quantity: ingredient.quantity_per_serving,
            unit: ingredient.unit,
            notes: ingredient.notes || ''
          });
          relationshipCount++;
        } catch (error) {
          // Product may not exist - log but continue
          if (error.message.includes('no changes')) {
            // This is expected if product doesn't exist
            console.log(`     ⚠️  Product ${ingredient.productId} not found (skipping)`);
          }
        }
      }
      console.log(`     └─ ${meal.ingredients.length} ingredients linked`);

    } catch (error) {
      console.error(`  ❌ Failed to create ${meal.name}:`, error.message);
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 Meal Seeding Summary:');
  console.log(`   Meals created: ${mealCount}`);
  console.log(`   REQUIRES relationships: ${relationshipCount}`);

  // Print sample query
  console.log('\n📖 Sample Queries:');
  console.log(`
  // Get all ingredients for a meal
  MATCH (m:Meal {name: "Jollof Rice"})-[r:REQUIRES]->(p:Product)
  RETURN p.name, r.quantity_per_serving, r.unit

  // Scale recipe for 8 people (from 4 servings)
  MATCH (m:Meal {name: "Egusi Soup"})-[r:REQUIRES]->(p:Product)
  RETURN p.name,
         r.quantity_per_serving * (8.0 / m.serves) as scaled_quantity,
         r.unit

  // Find meals using specific product
  MATCH (m:Meal)-[:REQUIRES]->(p:Product {id: "palm-oil-1l"})
  RETURN m.name, m.serves
  `);

  await closeDriver();
  console.log('\n✅ Meal seeding complete.\n');
}

// Run if called directly
seedMeals().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
