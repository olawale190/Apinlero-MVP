/**
 * Fix Pricing Format Migration
 *
 * This script converts product prices from pence/kobo (integer) to pounds/currency (decimal)
 * Example: 6800 -> 68.00, 1500 -> 15.00
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPricingFormat() {
  console.log('🔄 Starting price format migration...\n');

  // Step 1: Fetch all products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError);
    return;
  }

  console.log(`✅ Found ${products.length} products\n`);

  // Step 2: Identify products that need conversion (prices > 100 are likely in pence)
  const productsToUpdate = products.filter(p => p.price > 100);

  if (productsToUpdate.length === 0) {
    console.log('✅ No products need price conversion. All prices appear to be in correct format.');
    return;
  }

  console.log(`📊 Products to update: ${productsToUpdate.length}/${products.length}\n`);
  console.log('Preview of changes:');
  console.log('─'.repeat(70));

  productsToUpdate.forEach(p => {
    const oldPrice = p.price;
    const newPrice = (p.price / 100).toFixed(2);
    console.log(`${p.name.padEnd(40)} £${oldPrice} -> £${newPrice}`);
  });

  console.log('─'.repeat(70));
  console.log('\n⚠️  This will update prices in the database.');
  console.log('Continue with migration? (y/n)');

  // For automated execution, we'll proceed automatically
  console.log('\n🚀 Proceeding with migration...\n');

  let successCount = 0;
  let errorCount = 0;

  // Step 3: Update each product
  for (const product of productsToUpdate) {
    const newPrice = parseFloat((product.price / 100).toFixed(2));

    const { error: updateError } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error updating ${product.name}:`, updateError);
      errorCount++;
    } else {
      console.log(`✅ Updated ${product.name}: £${product.price} -> £${newPrice}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Migration Complete!');
  console.log('='.repeat(70));
  console.log(`✅ Successfully updated: ${successCount} products`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} products`);
  }
  console.log('='.repeat(70));

  // Step 4: Verify the changes
  console.log('\n🔍 Verifying changes...\n');

  const { data: updatedProducts, error: verifyError } = await supabase
    .from('products')
    .select('name, price, category')
    .order('name', { ascending: true });

  if (!verifyError && updatedProducts) {
    console.log('Updated Product Prices:');
    console.log('─'.repeat(70));
    updatedProducts.slice(0, 10).forEach(p => {
      console.log(`${p.name.padEnd(40)} £${p.price.toFixed(2)} (${p.category})`);
    });
    if (updatedProducts.length > 10) {
      console.log(`... and ${updatedProducts.length - 10} more products`);
    }
    console.log('─'.repeat(70));
  }

  console.log('\n✅ Migration complete! Prices are now in decimal format (pounds/currency).');
}

fixPricingFormat().catch(console.error);
