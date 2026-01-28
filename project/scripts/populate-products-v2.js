/**
 * Product Catalog Population Script v2
 *
 * This script populates your Supabase database with a sample product catalog
 * for a Nigerian grocery store.
 *
 * Usage:
 *   export SUPABASE_SERVICE_KEY=your-key
 *   node scripts/populate-products-v2.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://***REMOVED***.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_KEY=your-key node scripts/populate-products-v2.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample product catalog for a Nigerian grocery store
const products = [
  // Rice
  {
    name: 'Royal Stallion Rice',
    description: 'Premium long grain rice, 5kg bag',
    price: 7500,
    category: 'Grains, Rice & Pasta',
    stock_quantity: 50,
    unit: 'Per 5kg bag',
    image_url: null,
    is_active: true
  },
  {
    name: 'Mama Gold Rice',
    description: 'Premium parboiled rice, 5kg bag',
    price: 7200,
    category: 'Grains, Rice & Pasta',
    stock_quantity: 45,
    image_url: null,
    is_featured: true,
    aliases: ['mama gold', 'gold rice']
  },
  {
    name: 'Caprice Rice',
    description: 'Quality long grain rice, 5kg bag',
    price: 6800,
    category: 'Grains, Rice & Pasta',
    stock_quantity: 40,
    image_url: null,
    aliases: ['caprice']
  },

  // Beans
  {
    name: 'Honey Beans',
    description: 'Premium honey beans, 1kg',
    price: 1500,
    category: 'Beans & Legumes',
    stock_quantity: 60,
    image_url: null,
    aliases: ['honey beans', 'ewa oloyin', 'oloyin']
  },
  {
    name: 'Brown Beans',
    description: 'Quality brown beans, 1kg',
    price: 1200,
    category: 'Beans & Legumes',
    stock_quantity: 55,
    image_url: null,
    aliases: ['brown beans', 'ewa']
  },

  // Oils
  {
    name: 'Kings Vegetable Oil',
    description: 'Pure vegetable oil, 2.5 liters',
    price: 5500,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 35,
    image_url: null,
    is_featured: true,
    aliases: ['kings oil', 'vegetable oil', 'epo']
  },
  {
    name: 'Palm Oil',
    description: 'Fresh red palm oil, 2 liters',
    price: 3500,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 40,
    image_url: null,
    aliases: ['palm oil', 'epo pupa', 'red oil']
  },

  // Seasoning
  {
    name: 'Maggi Star Cubes',
    description: 'Maggi seasoning cubes, 50 cubes',
    price: 800,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 100,
    image_url: null,
    is_featured: true,
    aliases: ['maggi', 'maggi star', 'seasoning cubes']
  },
  {
    name: 'Knorr Cubes',
    description: 'Knorr seasoning cubes, 50 cubes',
    price: 850,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 90,
    image_url: null,
    aliases: ['knorr', 'knorr cubes']
  },
  {
    name: 'Curry Powder',
    description: 'Premium curry powder, 100g',
    price: 400,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 70,
    image_url: null,
    aliases: ['curry']
  },
  {
    name: 'Thyme',
    description: 'Dried thyme, 50g',
    price: 350,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 65,
    image_url: null,
    aliases: ['thyme']
  },

  // Tomato Products
  {
    name: 'Gino Tomato Paste',
    description: 'Concentrated tomato paste, 210g tin',
    price: 600,
    category: 'Canned, Packaged & Dry Foods',
    stock_quantity: 80,
    image_url: null,
    is_featured: true,
    aliases: ['gino', 'tomato paste', 'gino paste']
  },
  {
    name: 'Fresh Tomatoes',
    description: 'Fresh tomatoes, 1kg',
    price: 1200,
    category: 'Fresh Fruits & Vegetables',
    stock_quantity: 30,
    image_url: null,
    aliases: ['tomatoes', 'fresh tomatoes', 'tomato']
  },

  // Beverages
  {
    name: 'Milo',
    description: 'Milo chocolate drink, 400g tin',
    price: 2800,
    category: 'Drinks & Beverages',
    stock_quantity: 45,
    image_url: null,
    is_featured: true,
    aliases: ['milo', 'milo drink']
  },
  {
    name: 'Peak Milk',
    description: 'Peak powdered milk, 400g tin',
    price: 3200,
    category: 'Drinks & Beverages',
    stock_quantity: 50,
    image_url: null,
    is_featured: true,
    aliases: ['peak milk', 'peak', 'powdered milk']
  },

  // Snacks
  {
    name: 'Indomie Noodles',
    description: 'Indomie instant noodles, chicken flavor (pack of 5)',
    price: 1500,
    category: 'Snacks & Treats',
    stock_quantity: 120,
    image_url: null,
    is_featured: true,
    aliases: ['indomie', 'noodles', 'indomie chicken']
  },
  {
    name: 'Gala Sausage Roll',
    description: 'Gala sausage roll, single pack',
    price: 250,
    category: 'Snacks & Treats',
    stock_quantity: 100,
    image_url: null,
    aliases: ['gala', 'sausage roll']
  },

  // Fresh Produce
  {
    name: 'Onions',
    description: 'Fresh onions, 1kg',
    price: 800,
    category: 'Fresh Fruits & Vegetables',
    stock_quantity: 40,
    image_url: null,
    aliases: ['onions', 'alubosa']
  },
  {
    name: 'Red Bell Pepper',
    description: 'Fresh red bell peppers (tatashe), 1kg',
    price: 1000,
    category: 'Fresh Fruits & Vegetables',
    stock_quantity: 35,
    image_url: null,
    aliases: ['tatashe', 'red pepper', 'bell pepper']
  },
  {
    name: 'Scotch Bonnet Pepper',
    description: 'Fresh scotch bonnet peppers (ata rodo), 100g',
    price: 300,
    category: 'Fresh Fruits & Vegetables',
    stock_quantity: 45,
    image_url: null,
    aliases: ['ata rodo', 'scotch bonnet', 'hot pepper', 'rodo']
  },

  // Additional Items
  {
    name: 'Garri (White)',
    description: 'Quality white garri, 1kg',
    price: 900,
    category: 'Flours',
    stock_quantity: 50,
    image_url: null,
    aliases: ['garri', 'white garri', 'cassava flakes']
  },
  {
    name: 'Semovita',
    description: 'Semovita, 1kg pack',
    price: 1100,
    category: 'Flours',
    stock_quantity: 40,
    image_url: null,
    aliases: ['semovita', 'semo']
  },
  {
    name: 'Groundnut Oil',
    description: 'Pure groundnut oil, 1 liter',
    price: 2800,
    category: 'Spices, Seasonings & Oils',
    stock_quantity: 25,
    image_url: null,
    aliases: ['groundnut oil', 'peanut oil']
  },
  {
    name: 'Crayfish (Ground)',
    description: 'Ground crayfish, 100g',
    price: 1500,
    category: 'Dried Fish',
    stock_quantity: 30,
    image_url: null,
    aliases: ['crayfish', 'ground crayfish']
  },
  {
    name: 'Coca-Cola',
    description: 'Coca-Cola, 50cl bottle',
    price: 300,
    category: 'Drinks & Beverages',
    stock_quantity: 150,
    image_url: null,
    aliases: ['coke', 'coca cola', 'coca-cola']
  },
  {
    name: 'Bread (Sliced)',
    description: 'Fresh sliced bread',
    price: 800,
    category: 'Bakery & Breakfast Items',
    stock_quantity: 30,
    image_url: null,
    aliases: ['bread', 'sliced bread']
  }
];

async function populateProducts() {
  console.log('🌱 Starting to populate products...\n');

  try {
    // Get the first business (or create a default one)
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .limit(1);

    if (bizError) {
      console.error('❌ Error fetching businesses:', bizError.message);
      throw bizError;
    }

    let businessId;
    if (businesses && businesses.length > 0) {
      businessId = businesses[0].id;
      console.log(`✅ Found business: ${businesses[0].name} (${businesses[0].slug})\n`);
    } else {
      console.log('⚠️  No business found. Creating a default business first...\n');

      const { data: newBusiness, error: createError } = await supabase
        .from('businesses')
        .insert({
          name: "Isha's Treat & Groceries",
          slug: 'ishas-treat',
          owner_email: 'admin@ishastreat.com',
          phone: '+2348012345678',
          address: 'Lagos',
          city: 'Lagos',
          country: 'Nigeria'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create business:', createError.message);
        throw createError;
      }

      businessId = newBusiness.id;
      console.log(`✅ Created business: ${newBusiness.name}\n`);
    }

    // Check if products table has business_id column
    const { data: sampleProduct } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();

    const hasBizId = sampleProduct && 'business_id' in sampleProduct;

    // Delete existing products (optional - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing products...');
    if (hasBizId) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
        console.warn('⚠️  Could not clear existing products:', deleteError.message);
      } else {
        console.log('✅ Existing products cleared\n');
      }
    } else {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.warn('⚠️  Could not clear existing products:', deleteError.message);
      } else {
        console.log('✅ Existing products cleared\n');
      }
    }

    // Insert products
    console.log('📦 Inserting products...\n');
    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      const productData = hasBizId ? { ...product, business_id: businessId } : product;

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select();

      if (error) {
        console.error(`❌ Failed to insert ${product.name}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Inserted: ${product.name.padEnd(30)} - ₦${product.price.toLocaleString()}`);
        successCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Product population complete!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully inserted: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📦 Total products: ${products.length}`);
    console.log('='.repeat(60) + '\n');

    // Show category breakdown
    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    console.log('📂 Products by category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

populateProducts();
