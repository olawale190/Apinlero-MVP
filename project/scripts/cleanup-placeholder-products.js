#!/usr/bin/env node

/**
 * Cleanup Placeholder Products Script
 *
 * This script deletes the auto-generated placeholder products from the database.
 * It only deletes products that match BOTH the exact name AND price from the
 * original seed data, ensuring admin-added products are preserved.
 */

const { createClient } = require('@supabase/supabase-js');

// Load credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholder products to delete (from original migration)
const PLACEHOLDER_PRODUCTS = [
  { name: 'Jollof Rice Mix', price: 8.50 },
  { name: 'Plantain (Green)', price: 3.25 },
  { name: 'Palm Oil (5L)', price: 25.00 },
  { name: 'Egusi Seeds', price: 12.50 },
  { name: 'Stockfish', price: 18.75 },
  { name: 'Scotch Bonnet Peppers', price: 4.50 },
  { name: 'Yam Flour', price: 6.99 },
  { name: 'Maggi Seasoning', price: 3.50 },
  { name: 'Cassava Flour', price: 5.75 },
  { name: 'Dried Crayfish', price: 15.00 },
  { name: 'Garden Eggs', price: 4.25 },
  { name: 'Fufu Flour', price: 7.50 },
  { name: 'Coconut Oil (1L)', price: 12.00 },
  { name: 'Red Palm Oil', price: 22.50 },
  { name: 'African Nutmeg', price: 8.25 }
];

async function cleanupPlaceholders() {
  console.log('🧹 Starting placeholder products cleanup...\n');

  // First, fetch all products to see what we have
  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, price, created_at');

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError.message);
    return;
  }

  console.log(`📦 Total products in database: ${allProducts.length}\n`);

  // Find placeholders to delete
  const toDelete = [];
  for (const product of allProducts) {
    const isPlaceholder = PLACEHOLDER_PRODUCTS.some(
      ph => ph.name === product.name && Math.abs(ph.price - product.price) < 0.01
    );

    if (isPlaceholder) {
      toDelete.push(product);
      console.log(`🗑️  Found placeholder: "${product.name}" (£${product.price})`);
    }
  }

  if (toDelete.length === 0) {
    console.log('\n✅ No placeholder products found. Database is clean!');
    return;
  }

  console.log(`\n⚠️  Found ${toDelete.length} placeholder product(s) to delete.\n`);

  // Delete each placeholder
  let deleted = 0;
  let failed = 0;

  for (const product of toDelete) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      console.error(`❌ Failed to delete "${product.name}":`, error.message);
      failed++;
    } else {
      console.log(`✅ Deleted: "${product.name}"`);
      deleted++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Cleanup Summary:`);
  console.log(`   ✅ Deleted: ${deleted}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
  }
  console.log('='.repeat(50) + '\n');

  // Show remaining products count
  const { data: remainingProducts } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  const remaining = remainingProducts?.length || 0;
  console.log(`📦 Products remaining in database: ${remaining}\n`);

  console.log('✨ Cleanup complete!');
}

// Run the cleanup
cleanupPlaceholders().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
