/**
 * Nigerian Products Population Script
 * Populates Supabase with Nigerian grocery products
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://***REMOVED***.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
  // Rice & Grains
  { name: 'Royal Stallion Rice', description: 'Premium long grain rice, 5kg bag', price: 7500, category: 'Grains, Rice & Pasta', stock_quantity: 50, unit: 'Per 5kg bag' },
  { name: 'Mama Gold Rice', description: 'Premium parboiled rice, 5kg bag', price: 7200, category: 'Grains, Rice & Pasta', stock_quantity: 45, unit: 'Per 5kg bag' },
  { name: 'Caprice Rice', description: 'Quality long grain rice, 5kg bag', price: 6800, category: 'Grains, Rice & Pasta', stock_quantity: 40, unit: 'Per 5kg bag' },

  // Beans
  { name: 'Honey Beans (Ewa Oloyin)', description: 'Premium honey beans, 1kg', price: 1500, category: 'Beans & Legumes', stock_quantity: 60, unit: 'Per kg' },
  { name: 'Brown Beans (Ewa)', description: 'Quality brown beans, 1kg', price: 1200, category: 'Beans & Legumes', stock_quantity: 55, unit: 'Per kg' },

  // Oils
  { name: 'Kings Vegetable Oil', description: 'Pure vegetable oil, 2.5 liters', price: 5500, category: 'Spices, Seasonings & Oils', stock_quantity: 35, unit: 'Per 2.5L' },
  { name: 'Palm Oil (Epo Pupa)', description: 'Fresh red palm oil, 2 liters', price: 3500, category: 'Spices, Seasonings & Oils', stock_quantity: 40, unit: 'Per 2L' },
  { name: 'Groundnut Oil', description: 'Pure groundnut oil, 1 liter', price: 2800, category: 'Spices, Seasonings & Oils', stock_quantity: 25, unit: 'Per liter' },

  // Seasoning
  { name: 'Maggi Star Cubes', description: 'Maggi seasoning cubes, 50 cubes', price: 800, category: 'Spices, Seasonings & Oils', stock_quantity: 100, unit: 'Per pack' },
  { name: 'Knorr Cubes', description: 'Knorr seasoning cubes, 50 cubes', price: 850, category: 'Spices, Seasonings & Oils', stock_quantity: 90, unit: 'Per pack' },
  { name: 'Curry Powder', description: 'Premium curry powder, 100g', price: 400, category: 'Spices, Seasonings & Oils', stock_quantity: 70, unit: 'Per 100g' },
  { name: 'Thyme', description: 'Dried thyme, 50g', price: 350, category: 'Spices, Seasonings & Oils', stock_quantity: 65, unit: 'Per 50g' },
  { name: 'Crayfish (Ground)', description: 'Ground crayfish, 100g', price: 1500, category: 'Dried Fish', stock_quantity: 30, unit: 'Per 100g' },

  // Tomato Products
  { name: 'Gino Tomato Paste', description: 'Concentrated tomato paste, 210g tin', price: 600, category: 'Canned, Packaged & Dry Foods', stock_quantity: 80, unit: 'Per tin' },
  { name: 'Fresh Tomatoes', description: 'Fresh tomatoes, 1kg', price: 1200, category: 'Fresh Fruits & Vegetables', stock_quantity: 30, unit: 'Per kg' },

  // Beverages
  { name: 'Milo', description: 'Milo chocolate drink, 400g tin', price: 2800, category: 'Drinks & Beverages', stock_quantity: 45, unit: 'Per tin' },
  { name: 'Peak Milk', description: 'Peak powdered milk, 400g tin', price: 3200, category: 'Drinks & Beverages', stock_quantity: 50, unit: 'Per tin' },
  { name: 'Coca-Cola', description: 'Coca-Cola, 50cl bottle', price: 300, category: 'Drinks & Beverages', stock_quantity: 150, unit: 'Per bottle' },

  // Snacks
  { name: 'Indomie Noodles', description: 'Indomie instant noodles, chicken flavor (pack of 5)', price: 1500, category: 'Snacks & Treats', stock_quantity: 120, unit: 'Per pack' },
  { name: 'Gala Sausage Roll', description: 'Gala sausage roll, single pack', price: 250, category: 'Snacks & Treats', stock_quantity: 100, unit: 'Each' },

  // Fresh Produce
  { name: 'Onions (Alubosa)', description: 'Fresh onions, 1kg', price: 800, category: 'Fresh Fruits & Vegetables', stock_quantity: 40, unit: 'Per kg' },
  { name: 'Red Bell Pepper (Tatashe)', description: 'Fresh red bell peppers, 1kg', price: 1000, category: 'Fresh Fruits & Vegetables', stock_quantity: 35, unit: 'Per kg' },
  { name: 'Scotch Bonnet (Ata Rodo)', description: 'Fresh scotch bonnet peppers, 100g', price: 300, category: 'Fresh Fruits & Vegetables', stock_quantity: 45, unit: 'Per 100g' },

  // Flours
  { name: 'Garri (White)', description: 'Quality white garri, 1kg', price: 900, category: 'Flours', stock_quantity: 50, unit: 'Per kg' },
  { name: 'Semovita', description: 'Semovita, 1kg pack', price: 1100, category: 'Flours', stock_quantity: 40, unit: 'Per kg' },

  // Bakery
  { name: 'Sliced Bread', description: 'Fresh sliced bread', price: 800, category: 'Bakery & Breakfast Items', stock_quantity: 30, unit: 'Each' },
];

async function populate() {
  console.log('🌱 Populating Nigerian products...\n');

  try {
    // Get or create business
    let { data: businesses } = await supabase.from('businesses').select('id, name, slug').limit(1);

    let businessId;
    if (businesses && businesses.length > 0) {
      businessId = businesses[0].id;
      console.log(`✅ Using business: ${businesses[0].name} (${businesses[0].slug})`);
    } else {
      console.log('⚠️  Creating default business...');
      const { data: newBiz } = await supabase.from('businesses').insert({
        name: "Isha's Treat & Groceries",
        slug: 'ishas-treat',
        owner_email: 'admin@ishastreat.com',
        phone: '+2348012345678',
        address: 'Lagos',
        city: 'Lagos',
        country: 'Nigeria'
      }).select().single();
      businessId = newBiz.id;
      console.log(`✅ Created: ${newBiz.name}`);
    }

    // Clear existing
    console.log('\n🗑️  Clearing old products...');
    await supabase.from('products').delete().eq('business_id', businessId);

    // Insert products
    console.log('📦 Inserting products...\n');
    let success = 0;

    for (const product of products) {
      const { error } = await supabase.from('products').insert({
        ...product,
        business_id: businessId,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400'
      });

      if (error) {
        console.error(`❌ ${product.name}: ${error.message}`);
      } else {
        console.log(`✅ ${product.name.padEnd(35)} ₦${product.price.toLocaleString()}`);
        success++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ SUCCESS! Inserted ${success}/${products.length} products`);
    console.log('='.repeat(70));

    // Category breakdown
    const cats = {};
    products.forEach(p => cats[p.category] = (cats[p.category] || 0) + 1);
    console.log('\n📂 By Category:');
    Object.entries(cats).forEach(([cat, count]) => console.log(`   ${cat}: ${count}`));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

populate();
