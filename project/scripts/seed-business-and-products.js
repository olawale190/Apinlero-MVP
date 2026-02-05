#!/usr/bin/env node

/**
 * Seed Script: Create Isha's Treat business and sample products
 *
 * This script creates:
 * 1. The "ishas-treat" business record
 * 2. Sample products for testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Seeding database for Isha\'s Treat...\n');

  try {
    // Step 1: Check if business exists
    console.log('1️⃣ Checking for existing business...');
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id, name, slug')
      .eq('slug', 'ishas-treat')
      .single();

    let businessId;

    if (existingBusiness) {
      console.log(`✅ Business found: ${existingBusiness.name} (${existingBusiness.id})`);
      businessId = existingBusiness.id;
    } else {
      // Step 2: Create business
      console.log('2️⃣ Creating Isha\'s Treat business...');
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: 'Isha\'s Treat & Groceries',
          slug: 'ishas-treat',
          owner_email: 'owner@ishastreat.com', // Change this to actual owner email
          phone: '+447448682282',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (businessError) throw businessError;
      console.log(`✅ Business created: ${newBusiness.name} (${newBusiness.id})`);
      businessId = newBusiness.id;
    }

    // Step 3: Check existing products count
    console.log('\n3️⃣ Checking existing products...');
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (count && count > 0) {
      console.log(`✅ Found ${count} existing products for this business`);
      console.log('ℹ️  Skipping product creation (products already exist)');
    } else {
      // Step 4: Create sample products
      console.log('4️⃣ Creating sample products...');

      const sampleProducts = [
        {
          business_id: businessId,
          name: 'Yam',
          price: 300, // £3.00 in pence
          category: 'Vegetables',
          unit: 'per piece',
          stock_quantity: 50,
          description: 'Fresh yam',
          is_active: true
        },
        {
          business_id: businessId,
          name: 'Plantain',
          price: 500, // £5.00 in pence
          category: 'Vegetables',
          unit: 'per bunch',
          stock_quantity: 40,
          description: 'Fresh plantain bunch',
          is_active: true
        },
        {
          business_id: businessId,
          name: 'Palm Oil 1L',
          price: 599, // £5.99 in pence
          category: 'Oils & Fats',
          unit: '1L bottle',
          stock_quantity: 80,
          description: 'Pure red palm oil',
          is_active: true
        },
        {
          business_id: businessId,
          name: 'Cassava Flour (Garri) 2kg',
          price: 599, // £5.99 in pence
          category: 'Flours',
          unit: '2kg bag',
          stock_quantity: 80,
          description: 'Premium white garri',
          is_active: true
        },
        {
          business_id: businessId,
          name: 'Stockfish (Okporoko) Medium',
          price: 2500, // £25.00 in pence
          category: 'Dried Fish',
          unit: 'per piece',
          stock_quantity: 30,
          description: 'Quality stockfish, medium size',
          is_active: true
        }
      ];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

      if (productsError) throw productsError;
      console.log(`✅ Created ${products.length} sample products`);
    }

    console.log('\n✅ Database seeding complete!');
    console.log('\n📍 Test your storefront at: http://localhost:5173/store/ishas-treat');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
